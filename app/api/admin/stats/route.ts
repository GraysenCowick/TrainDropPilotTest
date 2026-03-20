import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

const ADMIN_EMAIL = "graysencowick67@gmail.com";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const totalUsers =
    (usersData as any)?.users?.length ?? (usersData as any)?.total ?? 0;

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const [{ data: recentModules }, { data: recentTracks }] = await Promise.all([
    (admin as any).from("modules").select("user_id").gte("created_at", since),
    (admin as any).from("tracks").select("user_id").gte("created_at", since),
  ]);

  const activeSet = new Set([
    ...((recentModules || []) as any[]).map((r: any) => r.user_id),
    ...((recentTracks || []) as any[]).map((r: any) => r.user_id),
  ]);

  return NextResponse.json({
    totalUsers,
    totalModules: totalModules ?? 0,
    totalTracks: totalTracks ?? 0,
    totalCompletions: totalCompletions ?? 0,
    activeToday: activeSet.size,
  });
}
