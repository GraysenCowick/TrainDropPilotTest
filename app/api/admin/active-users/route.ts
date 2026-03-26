import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "graysencowick67@gmail.com";
const ACTIVE_THRESHOLD_SECONDS = 90;

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = (await createAdminClient()) as any;
  const threshold = new Date(Date.now() - ACTIVE_THRESHOLD_SECONDS * 1000).toISOString();

  const { data, error } = await admin
    .from("user_presence")
    .select("user_id, email, business_name, current_page, last_seen_at")
    .gte("last_seen_at", threshold)
    .order("last_seen_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data || []);
}
