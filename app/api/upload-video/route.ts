import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export const maxDuration = 10;

export async function POST(request: NextRequest) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { filename } = body;
  if (!filename) return NextResponse.json({ error: "filename required" }, { status: 400 });

  const ext = (filename as string).split(".").pop()?.toLowerCase() || "mp4";
  const filePath = `videos/${user.id}/${randomUUID()}.${ext}`;

  const admin = getAdminClient();

  // Generate a presigned upload URL — the browser uploads the file directly
  // to Supabase storage, bypassing Vercel's 4.5 MB request-body limit.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (admin as any).storage
    .from("processed")
    .createSignedUploadUrl(filePath);

  if (error || !data?.signedUrl) {
    console.error("[upload-video] createSignedUploadUrl failed:", error?.message);
    return NextResponse.json(
      { error: error?.message || "Failed to create upload URL" },
      { status: 500 }
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: urlData } = (admin as any).storage
    .from("processed")
    .getPublicUrl(filePath);

  return NextResponse.json({
    uploadUrl: data.signedUrl,
    publicUrl: urlData.publicUrl,
  });
}
