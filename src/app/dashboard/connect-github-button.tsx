"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

function GitHubMark() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4 fill-current">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

/**
 * First time: links GitHub to this account through GitHub's own sign-in.
 * Later: signs in through GitHub again to get a fresh one-time token for a re-read.
 * Either way the server reads the repos in the callback; the token never reaches this page.
 */
export function ConnectGitHubButton({ connected }: { connected: boolean }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    setPending(true);
    setError(null);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?link=github`;
    const { error } = connected
      ? await supabase.auth.signInWithOAuth({ provider: "github", options: { redirectTo } })
      : await supabase.auth.linkIdentity({ provider: "github", options: { redirectTo } });
    if (error) {
      setPending(false);
      setError("GitHub couldn't be opened. Check your connection and try again.");
    }
  }

  return (
    <div>
      <Button
        variant={connected ? "secondary" : "primary"}
        size="sm"
        loading={pending}
        disabled={pending}
        icon={<GitHubMark />}
        onClick={go}
      >
        {pending ? "Opening GitHub…" : connected ? "Refresh from GitHub" : "Connect GitHub"}
      </Button>
      <p role="alert" aria-live="polite" className="min-h-5 pt-1.5 text-caption text-danger">
        {error}
      </p>
    </div>
  );
}
