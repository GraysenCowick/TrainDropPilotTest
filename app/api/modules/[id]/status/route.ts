import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { checkTranscriptionJob } from "@/lib/video/pipeline";

export const maxDuration = 30;

export async function GET(
  request: NextRequest,
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
      // Store transcript and trigger analysis
      await admin
        .from("modules")
        .update({
          transcript: {
            text: aaiStatus.text,
            words: aaiStatus.words ?? [],
          },
          processing_step: "analyzing",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      // Fire-and-forget: trigger run-analysis as independent request
      const proto = request.headers.get("x-forwarded-proto") || "http";
      const host =
        request.headers.get("x-forwarded-host") ||
        request.headers.get("host") ||
        "localhost:3000";
      const baseUrl = `${proto}://${host}`;

      void fetch(`${baseUrl}/api/modules/${id}/run-analysis`, {
        method: "POST",
        headers: {
          "x-internal-key": process.env.SUPABASE_SERVICE_ROLE_KEY!,
          "Content-Type": "application/json",
        },
      }).catch((err) => {
        console.error("[status] run-analysis trigger failed:", err);
      });

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

  // Already in analyzing or quizzes step
  return NextResponse.json({
    status: "processing",
    step: module.processing_step ?? "analyzing",
  });
}
