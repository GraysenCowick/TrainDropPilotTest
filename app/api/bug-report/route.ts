import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendBugReport, sendErrorReport } from "@/lib/email";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const body = await request.json();
  const {
    description,
    note,
    errorMessage,
    stackTrace,
    pageUrl,
  } = body as {
    description?: string;
    note?: string;
    errorMessage?: string;
    stackTrace?: string;
    pageUrl?: string;
  };

  const isAutomatic = !!errorMessage;

  // For manual reports, require description
  if (!isAutomatic && !description?.trim()) {
    return NextResponse.json({ error: "Description is required" }, { status: 400 });
  }

  // Look up user info if authenticated
  let userEmail = "anonymous";
  let businessName: string | null = null;
  let userId = "unknown";

  if (user) {
    userId = user.id;
    userEmail = user.email ?? "unknown";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase as any)
      .from("profiles")
      .select("business_name")
      .eq("id", user.id)
      .single();
    businessName = (profile as { business_name: string | null } | null)?.business_name ?? null;
  }

  if (!user && !isAutomatic) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isAutomatic) {
    await sendErrorReport({
      errorMessage: errorMessage!,
      stackTrace: stackTrace ?? null,
      pageUrl: pageUrl ?? null,
      note: note?.trim() ?? null,
      userEmail,
      businessName,
      userId,
    });
  } else {
    await sendBugReport({
      description: description!.trim(),
      userEmail,
      businessName,
      userId,
    });
  }

  return NextResponse.json({ success: true });
}
