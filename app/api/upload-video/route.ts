import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("video") as File;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  try {
    // Upload original file directly to Supabase — no server-side FFmpeg compression.
    // FFmpeg binaries are unreliable in Vercel serverless. Original iPhone/Android
    // videos (H.264/AAC) are already browser-compatible. Safari compatibility is
    // handled by the device recording in a supported format natively.
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split(".").pop() || "mp4";
    const filePath = `videos/${user.id}/${randomUUID()}.${ext}`;

    const admin = getAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: uploadError } = await (admin as any).storage
      .from("processed")
      .upload(filePath, buffer, {
        contentType: file.type || "video/mp4",
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) throw new Error(uploadError.message);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: urlData } = (admin as any).storage
      .from("processed")
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) throw new Error("Failed to get public URL");

    return NextResponse.json({ signedUrl: urlData.publicUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[upload-video] failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
