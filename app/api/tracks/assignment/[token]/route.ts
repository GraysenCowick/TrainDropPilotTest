import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

interface Params {
  params: Promise<{ token: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { token } = await params;
  const admin = await createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any;

  // Fetch assignment by token
  const { data: assignment, error: assignError } = await adminAny
    .from("track_assignments")
    .select("id, employee_name, employee_email, assigned_at, completed_at, track_id, track_module_completions(module_id, completed_at)")
    .eq("unique_token", token)
    .single();

  if (assignError || !assignment) {
    return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
  }

  // Fetch track with ordered modules + content
  const { data: track, error: trackError } = await adminAny
    .from("tracks")
    .select("id, title, description, track_modules(id, module_id, sort_order, modules(id, title, sop_content, processed_video_url, vtt_content, chapters))")
    .eq("id", assignment.track_id)
    .single();

  if (trackError || !track) {
    return NextResponse.json({ error: "Track not found" }, { status: 404 });
  }

  // Sort modules by sort_order and annotate with completion
  const completionMap = new Map<string, string>(
    (assignment.track_module_completions || []).map(
      (c: { module_id: string; completed_at: string }) => [c.module_id, c.completed_at]
    )
  );

  const modules = ((track.track_modules || []) as Array<{
    module_id: string;
    sort_order: number;
    modules: {
      id: string;
      title: string;
      sop_content: string | null;
      processed_video_url: string | null;
      vtt_content: string | null;
      chapters: unknown;
    };
  }>)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((tm) => ({
      ...tm.modules,
      completed_at: completionMap.get(tm.module_id) ?? null,
    }));

  return NextResponse.json({
    assignment: {
      id: assignment.id,
      employee_name: assignment.employee_name,
      employee_email: assignment.employee_email,
      assigned_at: assignment.assigned_at,
      completed_at: assignment.completed_at,
    },
    track: {
      id: track.id,
      title: track.title,
      description: track.description,
    },
    modules,
  });
}
