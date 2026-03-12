import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { refineSOP } from "@/lib/ai/claude";
import type { Module } from "@/lib/supabase/types";

export const maxDuration = 120;

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const instruction = typeof body.instruction === "string" ? body.instruction.trim() : "";
  if (!instruction) {
    return NextResponse.json({ error: "instruction is required" }, { status: 400 });
  }

  const { data: rawModule } = await supabase
    .from("modules")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  const mod = rawModule as Module | null;
  if (!mod) return NextResponse.json({ error: "Module not found" }, { status: 404 });
  if (!mod.sop_content) {
    return NextResponse.json({ error: "No SOP content to refine" }, { status: 400 });
  }

  try {
    const updatedSOP = await refineSOP(mod.sop_content, instruction);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("modules")
      .update({ sop_content: updatedSOP, updated_at: new Date().toISOString() })
      .eq("id", id);

    return NextResponse.json({ sop_content: updatedSOP });
  } catch (err) {
    console.error("SOP refinement failed:", err);
    return NextResponse.json({ error: "Failed to refine SOP" }, { status: 500 });
  }
}
