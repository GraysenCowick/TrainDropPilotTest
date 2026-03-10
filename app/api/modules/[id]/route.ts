import { NextRequest, NextResponse, after } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getTranscription } from "@/lib/ai/whisper";
import { analyzeAndFinalize } from "@/lib/video/pipeline";
import type { Module } from "@/lib/supabase/types";

export const maxDuration = 60;

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: module, error } = await supabase
    .from("modules")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !module) {
    return NextResponse.json({ error: "Module not found" }, { status: 404 });
  }

  // If transcription is in progress, check AssemblyAI and advance if ready
  const jobId = (module as unknown as Record<string, unknown>).transcription_job_id as string | null;
  if (module.status === "processing" && module.processing_step === "transcribing" && jobId) {
    try {
      const { status: txStatus, result, errorMessage } = await getTranscription(jobId);

      if (txStatus === "error") {
        const admin = await createAdminClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (admin as any).from("modules").update({
          status: "error",
          processing_step: null,
          updated_at: new Date().toISOString(),
        }).eq("id", id);
        return NextResponse.json({ ...module, status: "error", processing_step: null });
      }

      if (txStatus === "completed" && result) {
        const admin = await createAdminClient();

        // Atomically claim the "analyzing" step — prevents duplicate Claude calls
        // if multiple polls arrive at the same time.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: claimed } = await (admin as any)
          .from("modules")
          .update({ processing_step: "analyzing", updated_at: new Date().toISOString() })
          .eq("id", id)
          .eq("processing_step", "transcribing")
          .select()
          .single();

        if (claimed) {
          // We claimed it. Run Claude + finalize after the response is sent.
          const videoUrl = module.original_video_url ?? "";
          after(async () => {
            await analyzeAndFinalize(id, result, videoUrl);
          });
        }

        // Return "analyzing" so the frontend shows the next progress stage
        return NextResponse.json({ ...module, processing_step: "analyzing" });
      }
    } catch (err) {
      console.error("[modules GET] transcription check failed:", err);
      // Fall through — return current DB state
    }
  }

  return NextResponse.json(module as Module);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if ("title" in body) updates.title = body.title;
  if ("sop_content" in body) updates.sop_content = body.sop_content;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("modules")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data as Module);
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("modules")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return new NextResponse(null, { status: 204 });
}
