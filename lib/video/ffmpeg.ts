import Replicate from "replicate";
import { createClient } from "@supabase/supabase-js";

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

interface ProcessVideoOptions {
  videoUrl: string;
  voiceoverUrl?: string;
  srtContent?: string;
  moduleId: string;
  version?: "ai_audio" | "original_audio";
}

export async function processVideo(
  options: ProcessVideoOptions
): Promise<string> {
  const {
    videoUrl,
    voiceoverUrl,
    srtContent,
    moduleId,
    version = "original_audio",
  } = options;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Upload subtitle file if needed
    let subtitleFileUrl: string | undefined;
    if (srtContent) {
      const srtBuffer = Buffer.from(srtContent, "utf-8");
      const srtPath = `subtitles/${moduleId}.srt`;
      await supabase.storage.from("processed").upload(srtPath, srtBuffer, {
        contentType: "text/plain",
        upsert: true,
      });
      const { data } = supabase.storage.from("processed").getPublicUrl(srtPath);
      subtitleFileUrl = data.publicUrl;
    }

    // Use Replicate to process the video with subtitles
    // Model: lucataco/video-subtitles
    const replicateInput: Record<string, unknown> = {
      video_url: version === "ai_audio" && voiceoverUrl ? voiceoverUrl : videoUrl,
      subtitle_url: subtitleFileUrl,
    };

    const output = await replicate.run(
      "lucataco/video-subtitles:b3f3c4de0d4f4a55e8d527e8decc76e7e84f6c86f4cb9c95d1e59efbb4536f73" as `${string}/${string}:${string}`,
      { input: replicateInput }
    );

    const outputUrl = (Array.isArray(output) ? output[0] : output) as unknown as string;

    // Upload processed video to Supabase
    const videoResponse = await fetch(outputUrl);
    const videoBuffer = await videoResponse.arrayBuffer();

    const suffix = version === "ai_audio" ? "ai" : "orig";
    const filePath = `processed/${moduleId}_${suffix}.mp4`;

    await supabase.storage
      .from("processed")
      .upload(filePath, Buffer.from(videoBuffer), {
        contentType: "video/mp4",
        upsert: true,
      });

    const { data: urlData } = supabase.storage
      .from("processed")
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  } catch (error) {
    console.error("Video processing error:", error);
    // Fall back to original video URL if processing fails
    return videoUrl;
  }
}
