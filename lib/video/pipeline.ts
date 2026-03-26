import { createClient } from "@supabase/supabase-js";
import { submitTranscription, getTranscriptionStatus } from "@/lib/ai/assemblyai";
import { analyzeTranscript } from "@/lib/ai/claude";
import { generateQuizQuestions } from "@/lib/ai/quizzes";
import { generateVTT } from "@/lib/video/subtitles";

function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Submit a video URL to AssemblyAI for async transcription.
 * Call this immediately when a video module is created.
 * Returns the AssemblyAI job ID (stored in transcription_job_id).
 */
export async function submitTranscriptionJob(
  moduleId: string,
  videoUrl: string
): Promise<string> {
  const supabase = getAdminSupabase();
  const jobId = await submitTranscription(videoUrl);

  await supabase
    .from("modules")
    .update({
      transcription_job_id: jobId,
      processing_step: "transcribing",
      updated_at: new Date().toISOString(),
    })
    .eq("id", moduleId);

  console.log(`[pipeline] ${moduleId} — submitted AAI job ${jobId}`);
  return jobId;
}

/**
 * Check AssemblyAI job status for a module.
 * Returns the AAI status object if the job is found.
 */
export async function checkTranscriptionJob(jobId: string) {
  return getTranscriptionStatus(jobId);
}

/**
 * Run the full analysis pipeline after transcription is complete.
 * Called by /api/modules/[id]/run-analysis when AssemblyAI finishes.
 *
 * Steps:
 *   1. Fetch stored transcript from DB
 *   2. Analyze with Claude → title, description, sop, chapters
 *   3. Generate VTT captions
 *   4. Generate quiz questions per chapter + final test
 *   5. Save all quiz questions
 *   6. Mark module as ready
 */
export async function runModuleAnalysis(moduleId: string): Promise<void> {
  const supabase = getAdminSupabase();

  // Get module with stored transcript
  const { data: module, error: fetchError } = await supabase
    .from("modules")
    .select("*")
    .eq("id", moduleId)
    .single();

  if (fetchError || !module) {
    throw new Error(`Module not found: ${moduleId}`);
  }

  const transcriptData = module.transcript as {
    text: string;
    words: Array<{ text: string; start: number; end: number }> | null;
  } | null;

  if (!transcriptData?.text) {
    throw new Error(`No transcript data for module ${moduleId}`);
  }

  try {
    // ── Step 1: Claude analysis ───────────────────────────────────────────
    await supabase
      .from("modules")
      .update({ processing_step: "analyzing", updated_at: new Date().toISOString() })
      .eq("id", moduleId);

    console.log(`[pipeline] ${moduleId} — analyzing with Claude`);
    const analysis = await analyzeTranscript(transcriptData.text);

    // ── Step 2: Generate VTT captions ─────────────────────────────────────
    // AssemblyAI words use { text, start(ms), end(ms) }
    // generateVTT expects { word, start(s), end(s) }
    const vttWords = transcriptData.words
      ? transcriptData.words.map((w) => ({
          word: w.text,
          start: w.start / 1000,
          end: w.end / 1000,
        }))
      : [];
    const vttContent = generateVTT(vttWords, []);

    // ── Step 3: Save analysis results ─────────────────────────────────────
    await supabase
      .from("modules")
      .update({
        title: analysis.title,
        description: (analysis as any).description ?? null,
        cleaned_transcript: analysis.cleaned_transcript,
        sop_content: analysis.sop_content,
        chapters: analysis.chapters as unknown as Record<string, unknown>[],
        vtt_content: vttContent,
        processed_video_url: module.original_video_url,
        processing_step: "quizzes",
        updated_at: new Date().toISOString(),
      })
      .eq("id", moduleId);

    console.log(`[pipeline] ${moduleId} — generating quizzes`);

    // ── Step 4: Generate quiz questions ───────────────────────────────────
    let questions: Awaited<ReturnType<typeof generateQuizQuestions>> = [];
    try {
      questions = await generateQuizQuestions(transcriptData.text, analysis.chapters);
    } catch (quizErr) {
      // Quiz generation failure should not block the module from becoming ready
      console.error(`[pipeline] ${moduleId} — quiz generation failed:`, quizErr);
    }

    // ── Step 5: Save quiz questions ───────────────────────────────────────
    if (questions.length > 0) {
      await supabase.from("quiz_questions").insert(
        questions.map((q) => ({
          module_id: moduleId,
          chapter_index: q.chapter_index,
          question: q.question,
          options: q.options,
          correct_answer: q.correct_answer,
          explanation: q.explanation,
          sort_order: q.sort_order,
        }))
      );
    }

    // ── Step 6: Finalize ──────────────────────────────────────────────────
    await supabase
      .from("modules")
      .update({
        status: "ready",
        processing_step: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", moduleId);

    console.log(`[pipeline] ${moduleId} — done`);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error(`[pipeline] ${moduleId} analysis failed: ${reason}`);

    await supabase
      .from("modules")
      .update({
        status: "error",
        processing_step: reason.slice(0, 500),
        updated_at: new Date().toISOString(),
      })
      .eq("id", moduleId);

    throw error;
  }
}
