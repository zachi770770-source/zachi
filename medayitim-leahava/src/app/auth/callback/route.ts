import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeRedirect } from "@/lib/redirect";

/**
 * Handles the redirect from Supabase email confirmation / magic links.
 * Exchanges the one-time code for a session, then sends the user to a
 * sanitised internal path (defaults to /dashboard).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeRedirect(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Code missing or exchange failed — send to login with a gentle notice.
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
