import { createClient } from "@supabase/supabase-js";
import { transcribeVideo } from "@/lib/ai/whisper";
import { analyzeTranscript } from "@/lib/ai/claude";
import { generateVTT } from "@/lib/video/subtitles";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Runs the full video processing pipeline:
 *   1. Transcribe audio (Whisper) — uses the extracted audio URL, not the full video
 *   2. Analyze transcript (Claude) → title, SOP, chapters
 *   3. Generate VTT captions
 *   4. Finalize — mark module ready
 *
 * audioUrl: URL to the browser-extracted WAV file (tiny, ~1 MB/min)
 * videoUrl: URL to the original video (stored for employee playback)
 *
 * Fire-and-forget usage:  void runVideoPipeline(id, videoUrl, audioUrl)
 */
export async function runVideoPipeline(
  moduleId: string,
  videoUrl: string,
  audioUrl: string
): Promise<void> {
  const supabase = getSupabase();

  async function markStep(step: string | null) {
    await supabase
      .from("modules")
      .update({ processing_step: step, updated_at: new Date().toISOString() })
      .eq("id", moduleId);
  }

  try {
    // ── Step 1: Transcribe audio ───────────────────────────────────────────
    await markStep("transcribing");
    console.log(`[pipeline] ${moduleId} — transcribing`);

    const transcript = await transcribeVideo(audioUrl);

    await supabase
      .from("modules")
      .update({
        transcript: transcript as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      })
      .eq("id", moduleId);

    // ── Step 2: Analyze with Claude ───────────────────────────────────────
    await markStep("analyzing");
    console.log(`[pipeline] ${moduleId} — analyzing transcript`);

    const analysis = await analyzeTranscript(transcript.text);

    await supabase
      .from("modules")
      .update({
        title: analysis.title,
        cleaned_transcript: analysis.cleaned_transcript,
        sop_content: analysis.sop_content,
        chapters: analysis.chapters as unknown as Record<string, unknown>[],
        updated_at: new Date().toISOString(),
      })
      .eq("id", moduleId);

    // ── Step 3: Generate VTT captions ─────────────────────────────────────
    // Pass segments as fallback — Whisper sometimes returns an incomplete words
    // array (truncated at ~15s) but always returns full segment timestamps.
    const vttContent = generateVTT(transcript.words, transcript.segments);

    // ── Step 4: Finalize ──────────────────────────────────────────────────
    await markStep("finalizing");
    console.log(`[pipeline] ${moduleId} — finalizing`);

    await supabase
      .from("modules")
      .update({
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
