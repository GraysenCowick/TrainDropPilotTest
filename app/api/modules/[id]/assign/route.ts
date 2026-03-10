import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  const body = await request.json();
  const { employee_email } = body;

  if (!employee_email?.trim()) {
    return NextResponse.json({ error: "employee_email is required" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("assignments")
    .upsert({
      module_id: id,
      user_id: user.id,
      employee_email: employee_email.trim().toLowerCase(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const employee_email = searchParams.get("email");

  if (!employee_email) {
    return NextResponse.json({ error: "email param is required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("assignments")
    .delete()
    .eq("module_id", id)
    .eq("user_id", user.id)
    .eq("employee_email", employee_email.toLowerCase());

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return new NextResponse(null, { status: 204 });
}
