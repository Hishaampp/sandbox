import "server-only";
import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { GitHubReadError, readGitHubWithToken } from "./read";

export type SyncResult = { ok: true; login: string; skills: number } | { ok: false; reason: "not_linked" | "mismatch" | "taken" | "github" };

/** The GitHub account id linked to this Sandbox user through GitHub's own sign-in, if any. */
export function linkedGitHubId(user: User): number | null {
  const identity = user.identities?.find((i) => i.provider === "github");
  const raw = identity?.identity_data?.provider_id ?? identity?.identity_data?.sub ?? identity?.id;
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? id : null;
}

/**
 * Reads the student's own public repositories with the GitHub token from the
 * sign-in that just happened, checks the token belongs to the GitHub account
 * linked to this Sandbox user, and stores repos and skills. The token is used
 * once and never stored.
 */
export async function syncGitHubSkills(user: User, providerToken: string): Promise<SyncResult> {
  const linkedId = linkedGitHubId(user);
  if (!linkedId) return { ok: false, reason: "not_linked" };

  let data: Awaited<ReturnType<typeof readGitHubWithToken>>;
  try {
    data = await readGitHubWithToken(providerToken);
  } catch (error) {
    if (error instanceof GitHubReadError || error instanceof Error) {
      console.error("GitHub read failed:", error.message);
    }
    return { ok: false, reason: "github" };
  }

  // The token must belong to the account the student linked, never another one.
  if (data.githubId !== linkedId) return { ok: false, reason: "mismatch" };

  const admin = createAdminClient();
  const { data: count, error } = await admin.rpc("sync_github_profile", {
    p_profile_id: user.id,
    p_github_id: data.githubId,
    p_github_username: data.login,
    p_repos: data.repos,
    p_skills: data.skills,
  });
  if (error) {
    console.error("GitHub sync failed:", error.message);
    return { ok: false, reason: error.code === "23505" ? "taken" : "github" };
  }
  return { ok: true, login: data.login, skills: count ?? 0 };
}
