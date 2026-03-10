import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Verify module belongs to user
  const { data: module } = await supabase
    .from("modules")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!module) return NextResponse.json({ error: "Module not found" }, { status: 404 });

  const [completionsRes, assignmentsRes] = await Promise.all([
    supabase
      .from("completions")
      .select("*")
      .eq("module_id", id)
      .order("completed_at", { ascending: false }),
    supabase
      .from("assignments")
      .select("*")
      .eq("module_id", id)
      .order("assigned_at", { ascending: true }),
  ]);

  return NextResponse.json({
    completions: completionsRes.data || [],
    assignments: assignmentsRes.data || [],
  });
}
