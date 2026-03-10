import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

interface Params {
  params: Promise<{ token: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  const { token } = await params;
  const admin = await createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any;

  const body = await request.json();
  const { module_id } = body as { module_id: string };
  if (!module_id) {
    return NextResponse.json({ error: "module_id required" }, { status: 400 });
  }

  // Fetch assignment
  const { data: assignment, error: assignError } = await adminAny
    .from("track_assignments")
    .select("id, track_id, completed_at")
    .eq("unique_token", token)
    .single();

  if (assignError || !assignment) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }

  // Upsert module completion
  await adminAny
    .from("track_module_completions")
    .upsert(
      {
        track_assignment_id: assignment.id,
        module_id,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "track_assignment_id,module_id" }
    );

  // Count total modules in track vs completions
  const { data: trackModules } = await adminAny
    .from("track_modules")
    .select("module_id")
    .eq("track_id", assignment.track_id);

  const { data: completions } = await adminAny
    .from("track_module_completions")
    .select("module_id")
    .eq("track_assignment_id", assignment.id);

  const totalModules = (trackModules || []).length;
  const completedCount = (completions || []).length;
  const allComplete = completedCount >= totalModules && totalModules > 0;

  let trackCompletedAt = assignment.completed_at;
  if (allComplete && !assignment.completed_at) {
    trackCompletedAt = new Date().toISOString();
    await adminAny
      .from("track_assignments")
      .update({ completed_at: trackCompletedAt })
      .eq("id", assignment.id);
  }

  return NextResponse.json({ success: true, allComplete, trackCompletedAt });
}
