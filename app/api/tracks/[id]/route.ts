import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

interface Params {
  params: Promise<{ id: string }>;
}

async function verifyOwner(trackId: string, userId: string) {
  const admin = await createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (admin as any)
    .from("tracks")
    .select("id")
    .eq("id", trackId)
    .eq("user_id", userId)
    .single();
  return !!data;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const admin = await createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any)
    .from("tracks")
    .select(`
      *,
      track_modules (
        id,
        sort_order,
        module_id,
        modules ( id, title, status, input_type, share_slug )
      )
    `)
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Sort track_modules by sort_order
  data.track_modules = (data.track_modules || []).sort(
    (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
  );

  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const owned = await verifyOwner(id, user.id);
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Block edits on published tracks
  const admin2 = await createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: trackCheck } = await (admin2 as any).from("tracks").select("status").eq("id", id).single();
  if (trackCheck?.status === "published") {
    return NextResponse.json({ error: "Cannot edit a published track. Unpublish it first." }, { status: 409 });
  }

  const body = await request.json();
  const { title, description, module_ids } = body as {
    title?: string;
    description?: string;
    module_ids?: string[];
  };

  const admin = await createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any;

  // Update track metadata
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (title !== undefined) updates.title = title.trim();
  if (description !== undefined) updates.description = description?.trim() || null;

  const { data: track, error } = await adminAny
    .from("tracks")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Replace track_modules if provided
  if (module_ids !== undefined) {
    await adminAny.from("track_modules").delete().eq("track_id", id);
    if (module_ids.length > 0) {
      const rows = module_ids.map((moduleId, i) => ({
        track_id: id,
        module_id: moduleId,
        sort_order: i,
      }));
      await adminAny.from("track_modules").insert(rows);
    }
  }

  return NextResponse.json(track);
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const owned = await verifyOwner(id, user.id);
  if (!owned) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const admin = await createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any).from("tracks").delete().eq("id", id);

  return new NextResponse(null, { status: 204 });
}
