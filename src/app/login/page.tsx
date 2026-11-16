import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { LogoMark } from "@/components/site/logo";
import { SlimHeader } from "@/components/site/site-header";
import { Alert } from "@/components/ui/alert";
import { Panel } from "@/components/ui/panel";
import { safeNextPath } from "@/lib/safe-next-path";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Sign in" };

const errors: Record<string, { title: string; body: string }> = {
  cancelled: {
    title: "Sign-in was cancelled",
    body: "You closed the Google window before finishing. Continue with Google to try again.",
  },
  failed: {
    title: "We couldn't sign you in",
    body: "Google didn't confirm your account. Try again, or use a different Google account.",
  },
};

/** Reads the URL and session, so it streams in after the static shell. */
async function SignInActions({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const params = await searchParams;
  const next = safeNextPath(typeof params.next === "string" ? params.next : null);
  const errorKey = typeof params.error === "string" ? params.error : null;
  const error = errorKey ? (errors[errorKey] ?? errors.failed) : null;

  // Already signed in: skip the page.
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims) redirect(next);

  return (
    <>
      {error && (
        <Alert tone="danger" title={error.title} className="mt-6">
          {error.body}
        </Alert>
      )}
      <GoogleSignInButton next={next} className="mt-6" />
    </>
  );
}

/** Same footprint as the button and its reserved message line, so nothing shifts. */
function SignInActionsFallback() {
  return (
    <div className="mt-6" aria-hidden="true">
      <div className="h-12 w-full rounded-control bg-sunken" />
      <div className="min-h-5 pt-2" />
    </div>
  );
}

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <div className="theme-night night-field flex flex-1 flex-col">
      <SlimHeader />
      <main id="main" className="flex flex-1 items-center justify-center px-5 py-16">
        <div className="w-full max-w-sm">
          <Panel className="p-8 backdrop-blur-xl">
            <LogoMark className="size-8 text-ink" />
            <h1 className="mt-6 font-display text-title font-semibold text-ink">Sign in to Sandbox</h1>
            <p className="mt-2 text-body-sm text-muted">
              Use your Google account. You can browse ideas and profiles straight away.
            </p>

            <Suspense fallback={<SignInActionsFallback />}>
              <SignInActions searchParams={searchParams} />
            </Suspense>

            <div className="border-t border-line pt-5">
              <p className="text-body-sm text-ink-soft">
                <span className="font-medium text-ink">Verify once, when you first act.</span> The first time you
                post an idea or ask to join a team, we&rsquo;ll confirm you&rsquo;re a student. You won&rsquo;t be
                asked again.
              </p>
            </div>
          </Panel>
          <p className="mt-6 px-2 text-center text-caption text-muted">
            By continuing you agree to use Sandbox only as yourself, a current student, and to keep other
            students&rsquo; details private.
          </p>
        </div>
      </main>
    </div>
  );
}
