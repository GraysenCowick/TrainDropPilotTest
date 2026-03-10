import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateSOP } from "@/lib/ai/claude";
import { runVideoPipeline } from "@/lib/video/pipeline";
import type { Module } from "@/lib/supabase/types";

export const maxDuration = 60;

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: rawModule } = await supabase
    .from("modules")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  const existingModule = rawModule as Module | null;
  if (!existingModule) return NextResponse.json({ error: "Module not found" }, { status: 404 });

  if (existingModule.input_type === "text" && existingModule.raw_notes) {
    // Text: regenerate synchronously
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("modules")
      .update({ status: "processing", updated_at: new Date().toISOString() })
      .eq("id", id);

    try {
      const result = await generateSOP(existingModule.raw_notes);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("modules")
        .update({
          title: result.title,
          sop_content: result.sop_content,
          status: "ready",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
    } catch (err) {
      console.error("SOP regeneration failed:", err);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("modules")
        .update({ status: "error", updated_at: new Date().toISOString() })
        .eq("id", id);
    }
  } else if (existingModule.input_type === "video" && existingModule.original_video_url) {
    // Video: reset to processing then kick off pipeline in the background
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("modules")
      .update({ status: "processing", processing_step: null, updated_at: new Date().toISOString() })
      .eq("id", id);

    void runVideoPipeline(id, existingModule.original_video_url);
  } else {
    return NextResponse.json({ error: "Cannot regenerate — no source content" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
