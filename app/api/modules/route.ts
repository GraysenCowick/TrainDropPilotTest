import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { generateSOP } from "@/lib/ai/claude";
import { runVideoPipeline } from "@/lib/video/pipeline";

export const maxDuration = 60; // 60s for Claude API call

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("modules")
    .select("id, title, status, input_type, created_at, share_slug")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return NextResponse.json(data || []);
}

export async function POST(request: NextRequest) {
  // Verify auth with the session-cookie client
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { input_type, title, raw_notes, original_video_url } = body;

  if (!input_type || !["text", "video"].includes(input_type)) {
    return NextResponse.json({ error: "Invalid input_type" }, { status: 400 });
  }

  if (input_type === "text" && !raw_notes) {
    return NextResponse.json({ error: "raw_notes required for text modules" }, { status: 400 });
  }

  if (input_type === "video" && !original_video_url) {
    return NextResponse.json({ error: "original_video_url required for video modules" }, { status: 400 });
  }

  // Use service-role client for all DB writes — bypasses RLS while keeping
  // user identity explicit via user_id in every row we write.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = await createAdminClient() as any;

  const { data: module, error } = await admin
    .from("modules")
    .insert({
      user_id: user.id,
      title: title || (input_type === "text" ? "Processing..." : "Video Module"),
      status: "processing",
      input_type,
      raw_notes: raw_notes || null,
      original_video_url: original_video_url || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (input_type === "text") {
    // Text: process synchronously — Claude is fast enough (~10–15s)
    try {
      const result = await generateSOP(raw_notes);
      await admin
        .from("modules")
        .update({
          title: result.title,
          sop_content: result.sop_content,
          status: "ready",
          updated_at: new Date().toISOString(),
        })
        .eq("id", module.id);
    } catch (err) {
      console.error("SOP generation failed:", err);
      await admin
        .from("modules")
        .update({ status: "error", updated_at: new Date().toISOString() })
        .eq("id", module.id);
    }
  } else {
    // Video: kick off pipeline in the background (fire-and-forget)
    void runVideoPipeline(module.id, original_video_url);
  }

  return NextResponse.json({ id: module.id }, { status: 201 });
}
