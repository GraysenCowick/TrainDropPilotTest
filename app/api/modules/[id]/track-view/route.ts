import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

interface Params {
  params: Promise<{ id: string }>;
}

// Public endpoint — called by employee page when they open a link with a token
export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const { token } = await request.json();
  if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 });

  const supabase = await createAdminClient();

  // Only set viewed_at if not already set
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: completion } = await (supabase as any)
    .from("module_completions")
    .select("id, viewed_at")
    .eq("unique_token", token)
    .eq("module_id", id)
    .single();

  if (!completion) {
    return NextResponse.json({ error: "Invalid token" }, { status: 404 });
  }

  if (!completion.viewed_at) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("module_completions")
      .update({ viewed_at: new Date().toISOString() })
      .eq("id", completion.id);
  }

  // Return team_member info for pre-filling
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: full } = await (supabase as any)
    .from("module_completions")
    .select("id, completed_at, team_members(id, name, email)")
    .eq("id", completion.id)
    .single();

  return NextResponse.json(full);
}
