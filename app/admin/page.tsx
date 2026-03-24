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

  const users: any[] = (usersData as any)?.users ?? [];
  const totalUsers = users.length;

  // Active today = managers who signed in since midnight (calendar day)
  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);
  const todayStart = todayMidnight.toISOString();
  const activeToday = users.filter(
    (u: any) => u.last_sign_in_at && u.last_sign_in_at >= todayStart
  ).length;

  return {
    totalUsers,
    totalModules: totalModules ?? 0,
    totalTracks: totalTracks ?? 0,
    totalCompletions: totalCompletions ?? 0,
    activeToday,
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
