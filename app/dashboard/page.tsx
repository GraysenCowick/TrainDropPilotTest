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

  // Fetch completion + assignment counts
  const moduleIds = modules.map((m) => m.id);
  const completionCounts: Record<string, number> = {};
  const assignmentCounts: Record<string, number> = {};

  if (moduleIds.length > 0) {
    const [completionRes, assignmentRes] = await Promise.all([
      supabase
        .from("completions")
        .select("module_id")
        .in("module_id", moduleIds),
      supabase
        .from("assignments")
        .select("module_id")
        .in("module_id", moduleIds),
    ]);

    (completionRes.data as { module_id: string }[] | null)?.forEach((c) => {
      completionCounts[c.module_id] = (completionCounts[c.module_id] || 0) + 1;
    });
    (assignmentRes.data as { module_id: string }[] | null)?.forEach((a) => {
      assignmentCounts[a.module_id] = (assignmentCounts[a.module_id] || 0) + 1;
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
  const admin = await createAdminClient();
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

  return <DashboardContent modules={enrichedModules} tracks={tracks} teamMemberCount={teamMemberCount} />;
}
