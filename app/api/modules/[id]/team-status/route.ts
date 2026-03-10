import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify module belongs to user
  const { data: module } = await supabase
    .from("modules")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!module) return NextResponse.json({ error: "Module not found" }, { status: 404 });

  // Fetch all module_completions with team_member info
  const { data: completions, error } = await supabase
    .from("module_completions")
    .select("*, team_members(id, name, email)")
    .eq("module_id", id)
    .order("sent_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(completions || []);
}
