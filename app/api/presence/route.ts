import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const page = (body.page as string | undefined) ?? "/dashboard";

  // Fetch business_name from profile for denormalized display on admin dashboard
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from("profiles")
    .select("business_name")
    .eq("id", user.id)
    .single();

  const businessName = (profile as { business_name: string | null } | null)?.business_name ?? null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from("user_presence").upsert(
    {
      user_id: user.id,
      email: user.email,
      business_name: businessName,
      current_page: page,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  return NextResponse.json({ ok: true });
}
