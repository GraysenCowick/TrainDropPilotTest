import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "graysencowick67@gmail.com";

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

  const users: any[] = (usersData as any)?.users ?? [];
  const totalUsers = users.length;

  // Active today = managers who signed in since midnight (calendar day)
  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);
  const todayStart = todayMidnight.toISOString();
  const activeToday = users.filter(
    (u: any) => u.last_sign_in_at && u.last_sign_in_at >= todayStart
  ).length;

  return NextResponse.json({
    totalUsers,
    totalModules: totalModules ?? 0,
    totalTracks: totalTracks ?? 0,
    totalCompletions: totalCompletions ?? 0,
    activeToday,
  });
}
