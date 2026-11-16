import "server-only";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type VerificationStatus = "unverified" | "pending" | "approved" | "rejected";

export type Viewer = {
  id: string;
  email: string | null;
  fullName: string;
  avatarUrl: string | null;
  status: VerificationStatus;
  verifiedUntil: string | null;
  isAdmin: boolean;
  collegeName: string | null;
  department: string | null;
  year: number | null;
  username: string | null;
  githubUsername: string | null;
  githubSyncedAt: string | null;
  portfolioUrl: string | null;
};

/**
 * The signed-in student, or null. Cached per request so the header and the page
 * share one lookup. Reads through RLS with the student's own session.
 */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  // Per-request data: never prerendered (the session check reads the clock).
  await connection();
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  if (!claims?.sub) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, avatar_url, verification_status, verified_until, is_admin, department, year, username, github_username, github_synced_at, portfolio_url, colleges(name)",
    )
    .eq("id", claims.sub)
    .maybeSingle();

  if (error) throw new Error(`Could not load your profile: ${error.message}`);
  if (!profile) return null;

  return {
    id: profile.id,
    email: typeof claims.email === "string" ? claims.email : null,
    fullName: profile.full_name || "Student",
    avatarUrl: profile.avatar_url,
    status: profile.verification_status,
    verifiedUntil: profile.verified_until,
    isAdmin: profile.is_admin,
    collegeName: profile.colleges?.name ?? null,
    department: profile.department,
    year: profile.year,
    username: profile.username,
    githubUsername: profile.github_username,
    githubSyncedAt: profile.github_synced_at,
    portfolioUrl: profile.portfolio_url,
  };
});

/** For pages that need a signed-in student: sends everyone else to sign in, then back. */
export async function requireViewer(returnTo: string): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  return viewer;
}

/** Admin pages answer "not found" to everyone else, so they reveal nothing. */
export async function requireAdmin(returnTo: string): Promise<Viewer> {
  const viewer = await requireViewer(returnTo);
  if (!viewer.isAdmin) notFound();
  return viewer;
}

export function firstName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] || "there";
}
