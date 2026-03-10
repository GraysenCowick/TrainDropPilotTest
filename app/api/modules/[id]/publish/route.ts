import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateSlug } from "@/lib/server-utils";

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

  // Verify module belongs to user and is ready
  const { data: rawModule } = await supabase
    .from("modules")
    .select("id, status, share_slug")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  const existingModule = rawModule as { id: string; status: string; share_slug: string | null } | null;

  if (!existingModule) return NextResponse.json({ error: "Module not found" }, { status: 404 });
  if (existingModule.status === "processing") {
    return NextResponse.json({ error: "Module is still processing" }, { status: 400 });
  }

  // Reuse existing slug or generate new one
  const slug = existingModule.share_slug || (await generateSlug());

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("modules")
    .update({
      status: "published",
      share_slug: slug,
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ slug: (data as { share_slug: string }).share_slug });
}
