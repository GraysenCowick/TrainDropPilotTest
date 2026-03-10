import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import { writeFile, unlink, readFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { randomUUID } from "crypto";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export const maxDuration = 300; // 5 min for compression

export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("video") as File;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const id = randomUUID();
  const ext = file.name.split(".").pop() || "mp4";
  const inputPath = join(tmpdir(), `${id}-input.${ext}`);
  const outputPath = join(tmpdir(), `${id}-output.mp4`);

  try {
    // Write uploaded file to disk
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(inputPath, buffer);

    // Compress to 720p H.264 with Safari-compatible settings:
    // - pix_fmt yuv420p: required by Safari/VideoToolbox (rejects other formats)
    // - profile high + level 4.0: explicit profile for broad compatibility
    // - vf scale+format: forces pixel format conversion during scale
    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          "-vf scale=-2:720,format=yuv420p",
          "-vcodec libx264",
          "-profile:v high",
          "-level:v 4.0",
          "-crf 28",
          "-preset fast",
          "-pix_fmt yuv420p",
          "-acodec aac",
          "-ar 44100",
          "-b:a 128k",
          "-movflags +faststart",
        ])
        .output(outputPath)
        .on("end", () => resolve())
        .on("error", (err) => reject(err))
        .run();
    });

    // Upload compressed file to Supabase (public bucket = permanent URL, no expiry)
    const admin = getAdminClient();
    const compressed = await readFile(outputPath);
    const filePath = `videos/${user.id}/${Date.now()}.mp4`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: uploadError } = await (admin as any).storage
      .from("processed")
      .upload(filePath, compressed, {
        contentType: "video/mp4",
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
  } finally {
    await unlink(inputPath).catch(() => {});
    await unlink(outputPath).catch(() => {});
  }
}
