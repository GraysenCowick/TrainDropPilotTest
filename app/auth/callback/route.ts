import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Handles the redirect from Supabase's confirmation email.
 * Supabase sends the user here with a `code` query param (PKCE flow).
 * We exchange it for a session, then send the user to the confirmed page.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/auth/confirmed`);
    }
  }

  // Something went wrong — send them to login with an error hint
  return NextResponse.redirect(`${origin}/login?message=Email+confirmation+failed.+Please+try+signing+in.`);
}
