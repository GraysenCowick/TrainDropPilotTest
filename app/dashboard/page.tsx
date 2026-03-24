import { redirect } from "next/navigation";
import { DashboardContent } from "@/components/dashboard-content";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { Module } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: rawModules } = await supabase
    .from("modules")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const modules = (rawModules || []) as Module[];

  const admin = await createAdminClient();

  // Fetch completion + assignment counts from module_completions
  const moduleIds = modules.map((m) => m.id);
  const completionCounts: Record<string, number> = {};
  const assignmentCounts: Record<string, number> = {};

  if (moduleIds.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: mcData } = await (admin as any)
      .from("module_completions")
      .select("module_id, completed_at")
      .in("module_id", moduleIds);

    (mcData as { module_id: string; completed_at: string | null }[] | null)?.forEach((row) => {
      assignmentCounts[row.module_id] = (assignmentCounts[row.module_id] || 0) + 1;
      if (row.completed_at) {
        completionCounts[row.module_id] = (completionCounts[row.module_id] || 0) + 1;
      }
    });
  }

  const enrichedModules = modules.map((m) => ({
    ...m,
    completion_count: completionCounts[m.id] || 0,
    assignment_count: assignmentCounts[m.id] || 0,
  }));

  // Fetch team member count for the badge
  const { data: teamData } = await supabase
    .from("team_members")
    .select("id")
    .eq("user_id", user.id);
  const teamMemberCount = (teamData as { id: string }[] | null)?.length ?? 0;

  // Fetch tracks with module count
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rawTracks } = await (admin as any)
    .from("tracks")
    .select("*, track_modules(id)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const tracks = (rawTracks || []).map((t: Record<string, unknown> & { track_modules: unknown[] }) => ({
    ...t,
    module_count: t.track_modules?.length ?? 0,
    track_modules: undefined,
  }));

  return <DashboardContent modules={enrichedModules} tracks={tracks} teamMemberCount={teamMemberCount} userId={user.id} />;
}
