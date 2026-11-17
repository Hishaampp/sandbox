import { NextResponse, type NextRequest } from "next/server";
import { syncGitHubSkills } from "@/lib/github/sync";
import { safeNextPath } from "@/lib/safe-next-path";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth return point: swaps the one-time code for a session, then continues.
 * With ?link=github (Connect GitHub / Refresh), the GitHub token that comes back
 * once is used here, on the server, to read the student's public repos; it is
 * never stored or sent to the browser.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));
  const linkingGitHub = searchParams.get("link") === "github";

  if (searchParams.get("error")) {
    if (linkingGitHub) {
      const reason =
        searchParams.get("error_code") === "identity_already_exists"
          ? "taken"
          : searchParams.get("error") === "access_denied"
            ? "cancelled"
            : "github";
      return NextResponse.redirect(new URL(`/dashboard?github=${reason}`, origin));
    }
    const reason = searchParams.get("error") === "access_denied" ? "cancelled" : "failed";
    return NextResponse.redirect(new URL(`/login?error=${reason}`, origin));
  }

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.session) {
      if (linkingGitHub) {
        const token = data.session.provider_token;
        if (!token) return NextResponse.redirect(new URL("/dashboard?github=github", origin));
        const result = await syncGitHubSkills(data.user, token);
        const target = result.ok
          ? `/dashboard?github=connected&leftout=${result.leftOut}`
          : `/dashboard?github=${result.reason}`;
        return NextResponse.redirect(new URL(target, origin));
      }
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  return NextResponse.redirect(new URL(linkingGitHub ? "/dashboard?github=github" : "/login?error=failed", origin));
}
