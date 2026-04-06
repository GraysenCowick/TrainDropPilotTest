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

  // Text/PDF module awaiting SOP generation — trigger Claude in-process.
  // Atomically transition "pending-analysis" → "analyzing" so only one request wins.
  if (module.processing_step === "pending-analysis" && !module.transcription_job_id) {
    const { data: won } = await admin
      .from("modules")
      .update({ processing_step: "analyzing", updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("processing_step", "pending-analysis")
      .select("id")
      .single();

    if (won) {
      try {
        await runModuleAnalysis(id);
        return NextResponse.json({ status: "ready", step: null });
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        console.error("[status] PDF SOP generation failed:", reason);
        return NextResponse.json({ status: "error", step: null });
      }
    }
    return NextResponse.json({ status: "processing", step: "analyzing" });
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

  // Module is stuck in "analyzing" or "quizzes" — transcript is already stored.
  // Re-trigger analysis. Use an atomic no-op update to win the race against
  // concurrent polls: only proceed if updated_at hasn't changed in 3+ minutes
  // (i.e., no other request is actively running analysis).
  const staleAt = new Date(Date.now() - 3 * 60 * 1000).toISOString();
  const { data: wonStuck } = await admin
    .from("modules")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "processing")
    .lt("updated_at", staleAt)
    .select("id")
    .single();

  if (wonStuck) {
    try {
      await runModuleAnalysis(id);
      return NextResponse.json({ status: "ready", step: null });
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      console.error("[status] re-triggered analysis failed:", reason);
      return NextResponse.json({ status: "error", step: null });
    }
  }

  return NextResponse.json({
    status: "processing",
    step: module.processing_step ?? "analyzing",
  });
}
