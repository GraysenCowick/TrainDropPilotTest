import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any;

  // Verify track belongs to user and get module list
  const { data: track, error: trackError } = await adminAny
    .from("tracks")
    .select("id, title, track_modules(id, module_id, sort_order, modules(id, title))")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (trackError || !track) {
    return NextResponse.json({ error: "Track not found" }, { status: 404 });
  }

  const sortedModules = ((track.track_modules || []) as Array<{
    id: string;
    module_id: string;
    sort_order: number;
    modules: { id: string; title: string };
  }>)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((tm) => ({ id: tm.module_id, title: tm.modules?.title ?? "Untitled" }));

  // Fetch all assignments for this track with per-module completions
  const { data: assignments, error } = await adminAny
    .from("track_assignments")
    .select(
      "id, employee_name, employee_email, assigned_at, completed_at, track_module_completions(module_id, completed_at)"
    )
    .eq("track_id", id)
    .order("assigned_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    assignments: assignments || [],
    modules: sortedModules,
    totalModules: sortedModules.length,
  });
}
