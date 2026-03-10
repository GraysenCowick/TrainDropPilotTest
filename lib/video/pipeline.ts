import { createClient } from "@supabase/supabase-js";
import { analyzeTranscript } from "@/lib/ai/claude";
import { generateVTT } from "@/lib/video/subtitles";
import type { WhisperTranscript } from "@/lib/ai/whisper";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Runs the analyze + finalize stages after transcription is complete.
 * Transcription is handled separately by AssemblyAI (via whisper.ts).
 * This function runs in ~20-30s — well within Vercel Free's 60s limit.
 */
export async function analyzeAndFinalize(
  moduleId: string,
  transcript: WhisperTranscript,
  videoUrl: string
): Promise<void> {
  const supabase = getSupabase();

  try {
    // Save transcript
    await supabase
      .from("modules")
      .update({
        transcript: transcript as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      })
      .eq("id", moduleId);

    // Analyze with Claude (~20s)
    console.log(`[pipeline] ${moduleId} — analyzing`);
    const analysis = await analyzeTranscript(transcript.text);

    // Generate VTT captions from word timestamps
    const vttContent = generateVTT(transcript.words);

    // Finalize
    console.log(`[pipeline] ${moduleId} — finalizing`);
    await supabase
      .from("modules")
      .update({
        title: analysis.title,
        cleaned_transcript: analysis.cleaned_transcript,
        sop_content: analysis.sop_content,
        chapters: analysis.chapters as unknown as Record<string, unknown>[],
        processed_video_url: videoUrl,
        vtt_content: vttContent,
        processing_step: null,
        status: "ready",
        updated_at: new Date().toISOString(),
      })
      .eq("id", moduleId);

    console.log(`[pipeline] ${moduleId} — done`);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error(`[pipeline] ${moduleId} failed: ${reason}`);

    await supabase
      .from("modules")
      .update({
        status: "error",
        processing_step: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", moduleId);

    throw error;
  }
}
