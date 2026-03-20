import { createAdminClient } from "@/lib/supabase/server";
import AdminDashboard from "./admin-dashboard";

export const dynamic = "force-dynamic";

async function getStats() {
  const admin = await createAdminClient();

  const [
    { data: usersData },
    { count: totalModules },
    { count: totalTracks },
    { count: totalCompletions },
  ] = await Promise.all([
    (admin as any).auth.admin.listUsers({ perPage: 1000 }),
    (admin as any).from("modules").select("*", { count: "exact", head: true }),
    (admin as any).from("tracks").select("*", { count: "exact", head: true }),
    (admin as any)
      .from("module_completions")
      .select("*", { count: "exact", head: true })
      .not("completed_at", "is", null),
  ]);

  const totalUsers = (usersData as any)?.users?.length ?? (usersData as any)?.total ?? 0;

  // Active today: distinct user_ids from modules + tracks created in last 24h
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const [{ data: recentModules }, { data: recentTracks }] = await Promise.all([
    (admin as any)
      .from("modules")
      .select("user_id")
      .gte("created_at", since),
    (admin as any)
      .from("tracks")
      .select("user_id")
      .gte("created_at", since),
  ]);

  const activeSet = new Set([
    ...((recentModules || []) as any[]).map((r) => r.user_id),
    ...((recentTracks || []) as any[]).map((r) => r.user_id),
  ]);

  return {
    totalUsers: totalUsers ?? 0,
    totalModules: totalModules ?? 0,
    totalTracks: totalTracks ?? 0,
    totalCompletions: totalCompletions ?? 0,
    activeToday: activeSet.size,
  };
}

async function getRecentEvents() {
  const admin = await createAdminClient();
  const { data } = await (admin as any)
    .from("admin_event_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  return (data || []) as any[];
}

export default async function AdminPage() {
  const [stats, initialEvents] = await Promise.all([
    getStats(),
    getRecentEvents(),
  ]);

  return <AdminDashboard initialStats={stats} initialEvents={initialEvents} />;
}
