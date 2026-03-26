import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { checkTranscriptionJob, runModuleAnalysis } from "@/lib/video/pipeline";

// Must be high enough to cover AssemblyAI check + full Claude analysis + quiz generation
export const maxDuration = 300;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const admin = (await createAdminClient()) as any;

  const { data: module, error } = await admin
    .from("modules")
    .select("id, status, processing_step, transcription_job_id")
    .eq("id", id)
    .single();

  if (error || !module) {
    return NextResponse.json({ error: "Module not found" }, { status: 404 });
  }

  // Already done or errored
  if (module.status === "ready" || module.status === "published" || module.status === "error") {
    return NextResponse.json({ status: module.status, step: null });
  }

  // If transcribing, check AssemblyAI status
  if (module.processing_step === "transcribing" && module.transcription_job_id) {
    const aaiStatus = await checkTranscriptionJob(module.transcription_job_id);

    if (aaiStatus.status === "completed" && aaiStatus.text) {
      // Atomically transition from "transcribing" → "analyzing".
      // The .eq("processing_step", "transcribing") filter means only one concurrent
      // request can win this update — prevents duplicate analysis runs.
      const { data: won } = await admin
        .from("modules")
        .update({
          transcript: {
            text: aaiStatus.text,
            words: aaiStatus.words ?? [],
          },
          processing_step: "analyzing",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("processing_step", "transcribing")
        .select("id")
        .single();

      if (won) {
        // This request won the race — run the full analysis in-process.
        // Vercel keeps the function alive until we return, so no fire-and-forget needed.
        try {
          await runModuleAnalysis(id);
          return NextResponse.json({ status: "ready", step: null });
        } catch (err) {
          const reason = err instanceof Error ? err.message : String(err);
          console.error("[status] runModuleAnalysis failed:", reason);
          return NextResponse.json({ status: "error", step: null });
        }
      }

      // Lost the race — another concurrent request is running analysis
      return NextResponse.json({ status: "processing", step: "analyzing" });
    }

    if (aaiStatus.status === "error") {
      await admin
        .from("modules")
        .update({ status: "error", processing_step: null })
        .eq("id", id);
      return NextResponse.json({ status: "error", step: null });
    }

    return NextResponse.json({ status: "processing", step: "transcribing" });
  }

  // Already in analyzing or quizzes step (another concurrent call is handling it)
  return NextResponse.json({
    status: "processing",
    step: module.processing_step ?? "analyzing",
  });
}
