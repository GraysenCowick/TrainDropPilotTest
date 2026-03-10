import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from("tracks")
    .select("*, track_modules(id)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Attach module count
  const enriched = (data || []).map((t: Record<string, unknown> & { track_modules: unknown[] }) => ({
    ...t,
    module_count: t.track_modules?.length ?? 0,
    track_modules: undefined,
  }));

  return NextResponse.json(enriched);
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { title, description, module_ids } = body as {
    title: string;
    description?: string;
    module_ids?: string[];
  };

  if (!title?.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const admin = await createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any;

  const { data: track, error: trackError } = await adminAny
    .from("tracks")
    .insert({ user_id: user.id, title: title.trim(), description: description?.trim() || null })
    .select()
    .single();

  if (trackError) return NextResponse.json({ error: trackError.message }, { status: 500 });

  if (module_ids && module_ids.length > 0) {
    const rows = module_ids.map((moduleId, i) => ({
      track_id: track.id,
      module_id: moduleId,
      sort_order: i,
    }));
    await adminAny.from("track_modules").insert(rows);
  }

  return NextResponse.json(track, { status: 201 });
}
