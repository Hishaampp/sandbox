import { ExternalLink, Lock, UserX } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { AppHeader, AppHeaderFallback } from "@/components/site/app-header";
import { BlockButton, ReportForm } from "@/components/safety/safety-controls";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { VerifiedBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Panel } from "@/components/ui/panel";
import { RepoList } from "@/components/ui/repo-list";
import { SkillProofList } from "@/components/ui/skill-proof";
import { requireViewer } from "@/lib/auth";
import { timeAgo, yearLabel } from "@/lib/format";
import { displayLanguage } from "@/lib/github/detect";
import { toProofItem, type SkillRow } from "@/lib/skills";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Student profile" };

async function ProfileContent({ params }: { params: PageProps<"/u/[username]">["params"] }) {
  const { username } = await params;
  const viewer = await requireViewer(`/u/${encodeURIComponent(username)}`);

  // Student profiles are visible only to verified students on the same campus (enforced by RLS).
  // Say so, rather than letting the empty result read as "no such student".
  const ownProfile = viewer.username?.toLowerCase() === username.toLowerCase();
  if (!ownProfile && !viewer.isAdmin && viewer.status !== "approved") {
    return (
      <>
        <AppHeader viewer={viewer} />
        <main id="main" className="flex-1">
          <Container className="py-16 md:py-24">
            <Panel className="mx-auto flex max-w-md flex-col items-center px-6 py-14 text-center">
              <Lock className="size-6 text-muted" aria-hidden="true" />
              <h1 className="mt-4 text-title font-semibold text-ink">Verify to see student profiles</h1>
              <p className="mt-1 text-body-sm text-muted">
                Profiles are visible only to verified students on the same campus, to keep students&rsquo; details
                private.
              </p>
              <ButtonLink href={viewer.status === "pending" ? "/dashboard" : "/onboarding"} size="sm" className="mt-6">
                {viewer.status === "pending" ? "See verification status" : "Verify now"}
              </ButtonLink>
            </Panel>
          </Container>
        </main>
      </>
    );
  }
  const supabase = await createClient();

  // Public face only: no email, no registration number (those never live on profiles).
  const { data: student, error } = await supabase
    .from("profiles")
    .select(
      "id, username, full_name, avatar_url, department, year, verification_status, github_username, portfolio_url, colleges(name)",
    )
    .eq("username", username.toLowerCase())
    .maybeSingle();

  if (error) throw new Error(`Could not load this profile: ${error.message}`);

  if (!student) {
    return (
      <>
        <AppHeader viewer={viewer} />
        <main id="main" className="flex-1">
          <Container className="py-16 md:py-24">
            <Panel className="mx-auto flex max-w-md flex-col items-center px-6 py-14 text-center">
              <UserX className="size-6 text-muted" aria-hidden="true" />
              <h1 className="mt-4 text-title font-semibold text-ink">No student with that username</h1>
              <p className="mt-1 text-body-sm text-muted">
                Check the link, or find students through an idea&rsquo;s matches.
              </p>
              <ButtonLink href="/dashboard" variant="secondary" size="sm" className="mt-6">
                Back to dashboard
              </ButtonLink>
            </Panel>
          </Container>
        </main>
      </>
    );
  }

  const [{ data: skillRows, error: skillsError }, { data: repoRows, error: reposError }] = await Promise.all([
    supabase
      .from("skills")
      .select("id, name, source, evidence, last_pushed_at, score")
      .eq("profile_id", student.id)
      .order("source", { ascending: true })
      .order("score", { ascending: false }),
    supabase
      .from("repos")
      .select("name, url, main_language, pushed_at")
      .eq("profile_id", student.id)
      .order("pushed_at", { ascending: false })
      .limit(12),
  ]);

  const skills = (skillRows ?? []) as SkillRow[];
  const repos = repoRows ?? [];
  const isMe = student.id === viewer.id;
  const { data: blockRow, error: blockError } = isMe
    ? { data: null }
    : await supabase
        .from("blocks")
        .select("blocked_id")
        .eq("blocker_id", viewer.id)
        .eq("blocked_id", student.id)
        .maybeSingle();
  if (blockError) throw new Error("Could not load this profile's block status");
  const blocked = Boolean(blockRow);
  const meta = [student.department, yearLabel(student.year), student.colleges?.name].filter(Boolean).join(", ");

  return (
    <>
      <AppHeader viewer={viewer} />
      <main id="main" className="flex-1">
        <Container className="py-12 md:py-16">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <Avatar name={student.full_name || student.username || "Student"} src={student.avatar_url} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <h1 className="font-display text-heading font-semibold text-ink">
                  {student.full_name || `@${student.username}`}
                </h1>
                {student.verification_status === "approved" && <VerifiedBadge />}
              </div>
              {meta && <p className="mt-1 text-body text-muted">{meta}</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              {student.github_username && (
                <ButtonLink
                  href={`https://github.com/${student.github_username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="secondary"
                  size="sm"
                  icon={<ExternalLink className="size-4" aria-hidden="true" />}
                >
                  @{student.github_username} on GitHub
                </ButtonLink>
              )}
              {student.portfolio_url && (
                <ButtonLink
                  href={student.portfolio_url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  variant="secondary"
                  size="sm"
                  icon={<ExternalLink className="size-4" aria-hidden="true" />}
                >
                  Portfolio
                </ButtonLink>
              )}
              {isMe && (
                <ButtonLink href="/dashboard#skills-title" variant="ghost" size="sm">
                  Edit skills
                </ButtonLink>
              )}
            </div>
          </div>

          {!isMe && (
            <div className="mt-4 flex flex-wrap items-start gap-2 border-t border-line pt-4">
              {blocked && (
                <p className="w-full text-body-sm text-muted">
                  You blocked this student. They can&rsquo;t invite you or ask to join your ideas.
                </p>
              )}
              <BlockButton profileId={student.id} blocked={blocked} name={student.full_name || "this student"} />
              <ReportForm kind="profile" targetId={student.id} label="Report this student" />
            </div>
          )}

          <div className="mt-12 grid grid-cols-1 items-start gap-10 lg:grid-cols-12">
            <section aria-labelledby="skills-heading" className="lg:col-span-5">
              <h2 id="skills-heading" className="text-title font-semibold text-ink">
                Skills and their proof
              </h2>
              <Panel className="mt-4 p-6">
                {skillsError ? (
                  <Alert tone="danger" title="Skills couldn't be loaded">
                    Refresh the page.
                  </Alert>
                ) : skills.length ? (
                  <SkillProofList items={skills.map(toProofItem)} />
                ) : (
                  <p className="text-body-sm text-muted">
                    {isMe ? "Connect GitHub or add skills on your dashboard." : "No skills yet."}
                  </p>
                )}
              </Panel>
            </section>

            <section aria-labelledby="repos-heading" className="lg:col-span-7">
              <h2 id="repos-heading" className="text-title font-semibold text-ink">
                Original repositories
              </h2>
              <Panel className="mt-4 overflow-hidden">
                {reposError ? (
                  <div className="p-5">
                    <Alert tone="danger" title="Repositories couldn't be loaded">
                      Refresh the page.
                    </Alert>
                  </div>
                ) : repos.length ? (
                  <RepoList
                    items={repos.map((r) => ({
                      name: r.name,
                      href: r.url,
                      language: displayLanguage(r.main_language),
                      detail: r.pushed_at ? timeAgo(r.pushed_at) : "",
                    }))}
                  />
                ) : (
                  <p className="px-5 py-6 text-body-sm text-muted">
                    {student.github_username ? "No original public repositories yet." : "GitHub isn't connected yet."}
                  </p>
                )}
              </Panel>
              <p className="mt-3 text-caption text-muted">
                Public, original repositories only. Forks and empty repositories never count.
              </p>
            </section>
          </div>
        </Container>
      </main>
    </>
  );
}

function ProfileFallback() {
  const block = "animate-pulse rounded-control bg-sunken motion-reduce:animate-none";
  return (
    <>
      <AppHeaderFallback />
      <main id="main" className="flex-1" aria-busy="true">
        <Container className="py-12 md:py-16">
          <div className="flex items-center gap-6">
            <div className="size-14 animate-pulse rounded-full bg-sunken motion-reduce:animate-none" />
            <div className="flex-1 space-y-2">
              <div className={`h-10 w-64 max-w-full ${block}`} />
              <div className={`h-6 w-80 max-w-full ${block}`} />
            </div>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-12">
            <div className={`h-64 lg:col-span-5 ${block}`} />
            <div className={`h-80 lg:col-span-7 ${block}`} />
          </div>
        </Container>
      </main>
    </>
  );
}

export default function ProfilePage({ params }: PageProps<"/u/[username]">) {
  return (
    <Suspense fallback={<ProfileFallback />}>
      <ProfileContent params={params} />
    </Suspense>
  );
}
