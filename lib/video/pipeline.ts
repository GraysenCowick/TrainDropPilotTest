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
 *   1. Transcribe audio (Whisper)
 *   2. Analyze transcript (Claude) → title, SOP, chapters
 *   3. Generate VTT captions
 *   4. Finalize — mark module ready
 *
 * Updates processing_step in the DB as each stage starts so the frontend
 * progress UI stays in sync via polling.
 *
 * Fire-and-forget usage:  void runVideoPipeline(moduleId, videoUrl)
 */
export async function runVideoPipeline(
  moduleId: string,
  videoUrl: string
): Promise<void> {
  const supabase = getSupabase();

  async function markStep(step: string | null) {
    await supabase
      .from("modules")
      .update({ processing_step: step, updated_at: new Date().toISOString() })
      .eq("id", moduleId);
  }

  try {
    // ── Step 1: Transcribe ────────────────────────────────────────────────
    await markStep("transcribing");
    console.log(`[pipeline] ${moduleId} — transcribing`);

    const transcript = await transcribeVideo(videoUrl);

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
    const vttContent = generateVTT(transcript.words);

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
