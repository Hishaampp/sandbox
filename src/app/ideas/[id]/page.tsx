import { Clock, Gift, Lock, SearchX, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { MatchRow, type Match } from "@/components/ideas/match-row";
import { AppHeader, AppHeaderFallback } from "@/components/site/app-header";
import { ReportForm } from "@/components/safety/safety-controls";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Panel } from "@/components/ui/panel";
import { requireViewer } from "@/lib/auth";
import { formatDateTime, timeAgo, yearLabel } from "@/lib/format";
import { getTeamCounts, skillNamer, statusLabel, type IdeaStatus } from "@/lib/ideas";
import { createClient } from "@/lib/supabase/server";
import {
  ApplyForm,
  InviteButton,
  RemoveMemberButton,
  PlanForm,
  PostedNotice,
  RespondButtons,
  StatusForm,
  WithdrawButton,
} from "./idea-controls";

export const metadata: Metadata = { title: "Idea" };

type Evidence = { skill: string; source: "github" | "self"; evidence: string | null; last_pushed_at: string | null };

const requestState: Record<string, string> = {
  pending: "Waiting",
  accepted: "Accepted",
  declined: "Declined",
  withdrawn: "Withdrawn",
};

async function IdeaContent({
  params,
  searchParams,
}: {
  params: PageProps<"/ideas/[id]">["params"];
  searchParams: PageProps<"/ideas/[id]">["searchParams"];
}) {
  const { id } = await params;
  const viewer = await requireViewer(`/ideas/${id}`);
  const query = await searchParams;
  const posted = query.posted === "1";
  const planFailed = query.plan === "failed";
  const leftTeam = query.left === "1";
  const supabase = await createClient();

  const validId = /^[0-9a-f-]{36}$/i.test(id);
  const { data: idea, error: ideaError } = validId
    ? await supabase
        .from("ideas")
        .select(
          "id, title, summary, skills_needed, team_size, hours_per_week, reward, status, created_at, owner_id, profiles!ideas_owner_id_fkey(full_name, username, avatar_url, department, year)",
        )
        .eq("id", id)
        .maybeSingle()
    : { data: null, error: null };
  // A failed load is not "not found": let the error screen offer a retry.
  if (ideaError) throw new Error(`Could not load this idea: ${ideaError.message}`);

  if (!idea) {
    return (
      <>
        <AppHeader viewer={viewer} current="ideas" />
        <main id="main" className="flex-1">
          <Container className="py-16 md:py-24">
            <Panel className="mx-auto flex max-w-md flex-col items-center px-6 py-14 text-center">
              <SearchX className="size-6 text-muted" aria-hidden="true" />
              <h1 className="mt-4 text-title font-semibold text-ink">This idea isn&rsquo;t here</h1>
              <p className="mt-1 text-body-sm text-muted">It may have been removed, or the link is wrong.</p>
              <ButtonLink href="/ideas" variant="secondary" size="sm" className="mt-6">
                Browse ideas
              </ButtonLink>
            </Panel>
          </Container>
        </main>
      </>
    );
  }

  const isOwner = idea.owner_id === viewer.id;
  const name = await skillNamer();

  const [teamRes, detailsRes, myRequestRes, mySkillsRes, teamCounts] = await Promise.all([
    supabase
      .from("team_members")
      .select("profile_id, role, joined_at, profiles(full_name, username, avatar_url, department, year)")
      .eq("idea_id", idea.id)
      .order("joined_at"),
    supabase.from("idea_details").select("details").eq("idea_id", idea.id).maybeSingle(),
    supabase
      .from("requests")
      .select("id, type, status")
      .eq("idea_id", idea.id)
      .eq("profile_id", viewer.id)
      .maybeSingle(),
    supabase.from("skills").select("slug").eq("profile_id", viewer.id),
    getTeamCounts([idea.id]),
  ]);

  if (teamRes.error || detailsRes.error || myRequestRes.error) {
    throw new Error("Could not load this idea's team");
  }
  const team = teamRes.data ?? [];
  // The count is public with the idea; who is on the team is visible only on campus (RLS).
  const members = teamCounts.get(idea.id) ?? 0;
  const canSeePeople = viewer.isAdmin || viewer.status === "approved";
  const onTeam = team.some((t) => t.profile_id === viewer.id);
  const details = detailsRes.data?.details ?? null; // RLS: only team members (and admins) get a row
  const myRequest = myRequestRes.data;
  const mySlugs = new Set((mySkillsRes.data ?? []).map((s) => s.slug));
  const owner = idea.profiles;
  const status = idea.status as IdeaStatus;

  let matches: Match[] = [];
  let pendingApplications: {
    id: string;
    message: string | null;
    created_at: string;
    name: string;
    username: string | null;
    avatar: string | null;
  }[] = [];
  let matchesFailed = false;
  let planVersions: { id: string; details: string; created_at: string }[] = [];
  if (isOwner) {
    const { data: versions, error: versionsError } = await supabase
      .from("idea_plan_versions")
      .select("id, details, created_at")
      .eq("idea_id", idea.id)
      .order("created_at", { ascending: false })
      .limit(20);
    if (versionsError) throw new Error("Could not load the plan history");
    planVersions = versions ?? [];
    const [matchRes, appRes] = await Promise.all([
      supabase.rpc("idea_matches", { p_idea_id: idea.id, p_limit: 20 }),
      supabase
        .from("requests")
        .select("id, message, created_at, profiles(full_name, username, avatar_url)")
        .eq("idea_id", idea.id)
        .eq("type", "application")
        .eq("status", "pending")
        .order("created_at"),
    ]);
    matchesFailed = Boolean(matchRes.error);
    matches = (matchRes.data ?? [])
      .filter((m) => m.request_status === null)
      .map((m) => ({
        profileId: m.profile_id,
        username: m.username,
        name: m.full_name || "Student",
        avatarUrl: m.avatar_url,
        meta: [m.department, yearLabel(m.year)].filter(Boolean).join(", "),
        pct: m.match_pct,
        matched: m.matched_count,
        needed: m.needed_count,
        proof: ((m.evidence as Evidence[]) ?? []).map((e) => ({
          skill: e.skill,
          source: e.source,
          evidence:
            e.source === "self"
              ? "Self-added"
              : `${e.evidence ?? "From GitHub"}${e.last_pushed_at ? `, ${timeAgo(e.last_pushed_at)}` : ""}`,
        })),
      }));
    pendingApplications = (appRes.data ?? []).map((a) => ({
      id: a.id,
      message: a.message,
      created_at: a.created_at,
      name: a.profiles?.full_name || "Student",
      username: a.profiles?.username ?? null,
      avatar: a.profiles?.avatar_url ?? null,
    }));
  }

  return (
    <>
      <AppHeader viewer={viewer} current="ideas" />
      <main id="main" className="flex-1">
        <Container className="py-12 md:py-16">
          <Link href="/ideas" className="text-body-sm text-muted hover:text-ink">
            All ideas
          </Link>
          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <h1 className="font-display text-heading font-semibold text-balance text-ink">{idea.title}</h1>
            <Badge tone={status === "open" ? "outline" : "neutral"}>{statusLabel[status]}</Badge>
          </div>
          {posted && <PostedNotice />}
          {leftTeam && (
            <Alert title="You left the team" className="mt-4">
              The owner has been told. You can no longer read the full plan.
            </Alert>
          )}
          {planFailed && (
            <Alert tone="danger" title="Your plan wasn't saved" className="mt-4">
              The idea is posted. Add the full plan again below.
            </Alert>
          )}

          <div className="mt-10 grid grid-cols-1 items-start gap-10 lg:grid-cols-12">
            <div className="space-y-12 lg:col-span-8">
              <section aria-labelledby="about-title">
                <h2 id="about-title" className="sr-only">
                  About this idea
                </h2>
                <p className="text-lead text-pretty text-ink-soft">{idea.summary}</p>
                <ul className="mt-5 flex flex-wrap gap-1.5" aria-label="Skills needed">
                  {idea.skills_needed.map((slug) => (
                    <li key={slug}>
                      <Badge tone={mySlugs.has(slug) ? "solid" : "neutral"}>
                        {name(slug)}
                        {mySlugs.has(slug) && <span className="sr-only"> (you have this skill)</span>}
                      </Badge>
                    </li>
                  ))}
                </ul>
                <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-body-sm">
                  <div className="flex items-center gap-2">
                    <Users className="size-4 text-muted" aria-hidden="true" />
                    <dt className="sr-only">Team</dt>
                    <dd className="text-ink">
                      {members} of {idea.team_size} builders joined
                    </dd>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-muted" aria-hidden="true" />
                    <dt className="sr-only">Time</dt>
                    <dd className="text-ink">About {idea.hours_per_week} hours a week</dd>
                  </div>
                  {idea.reward && (
                    <div className="flex items-center gap-2">
                      <Gift className="size-4 text-muted" aria-hidden="true" />
                      <dt className="sr-only">Builders get</dt>
                      <dd className="text-ink">{idea.reward}</dd>
                    </div>
                  )}
                </dl>
              </section>

              <section aria-labelledby="plan-title">
                <h2 id="plan-title" className="text-title font-semibold text-ink">
                  Full plan
                </h2>
                <Panel className="mt-4 p-6">
                  {isOwner ? (
                    <>
                      <PlanForm ideaId={idea.id} details={details ?? ""} />
                      {planVersions.length > 0 && (
                        <details className="mt-6 border-t border-line pt-4">
                          <summary className="cursor-pointer text-body-sm font-medium text-ink">
                            Plan history: {planVersions.length} saved{" "}
                            {planVersions.length === 1 ? "version" : "versions"}, first on{" "}
                            {formatDateTime(planVersions[planVersions.length - 1].created_at)}
                          </summary>
                          <p className="mt-2 text-caption text-muted">
                            Dated proof of what you wrote and when. Only you can see this.
                          </p>
                          <ol className="mt-4 space-y-4">
                            {planVersions.map((v) => (
                              <li key={v.id} className="border-l-2 border-line pl-4">
                                <p className="text-caption text-muted">{formatDateTime(v.created_at)}</p>
                                <p className="mt-1 line-clamp-3 text-body-sm whitespace-pre-line text-ink-soft">
                                  {v.details}
                                </p>
                              </li>
                            ))}
                          </ol>
                        </details>
                      )}
                    </>
                  ) : details !== null && onTeam ? (
                    details ? (
                      <p className="text-body whitespace-pre-line text-ink-soft">{details}</p>
                    ) : (
                      <p className="text-body-sm text-muted">The owner hasn&rsquo;t written the plan yet.</p>
                    )
                  ) : (
                    <div className="flex items-start gap-3">
                      <Lock className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden="true" />
                      <p className="text-body-sm text-muted">
                        Only the team can read the full plan. It opens for you once the owner accepts you.
                      </p>
                    </div>
                  )}
                </Panel>
              </section>

              {isOwner && (
                <>
                  {pendingApplications.length > 0 && (
                    <section aria-labelledby="applications-title">
                      <h2 id="applications-title" className="text-title font-semibold text-ink">
                        Asking to join
                      </h2>
                      <Panel className="mt-4">
                        <ul className="divide-y divide-line">
                          {pendingApplications.map((a) => (
                            <li key={a.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start">
                              <Avatar name={a.name} src={a.avatar} />
                              <div className="min-w-0 flex-1">
                                {a.username ? (
                                  <Link href={`/u/${a.username}`} className="font-medium text-ink hover:text-accent">
                                    {a.name}
                                  </Link>
                                ) : (
                                  <p className="font-medium text-ink">{a.name}</p>
                                )}
                                <p className="text-caption text-muted">Asked {formatDateTime(a.created_at)}</p>
                                {a.message && <p className="mt-2 text-body-sm text-ink-soft">{a.message}</p>}
                              </div>
                              <RespondButtons requestId={a.id} label={`${a.name}'s request`} />
                            </li>
                          ))}
                        </ul>
                      </Panel>
                    </section>
                  )}

                  <section aria-labelledby="matches-title">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                      <div>
                        <h2 id="matches-title" className="text-title font-semibold text-ink">
                          Best matches
                        </h2>
                        <p className="mt-1 text-body-sm text-muted">
                          Verified students ranked by proven skill, with the proof for each.
                        </p>
                      </div>
                    </div>
                    <Panel className="mt-4">
                      {matchesFailed ? (
                        <div className="p-5">
                          <Alert tone="danger" title="Matches couldn't be loaded">
                            Refresh the page.
                          </Alert>
                        </div>
                      ) : matches.length === 0 ? (
                        <p className="px-5 py-8 text-center text-body-sm text-muted">
                          {status === "open"
                            ? "No verified students have these skills yet. Matches appear as students connect GitHub."
                            : "This idea isn't open, so it isn't matching new builders."}
                        </p>
                      ) : (
                        <ol className="divide-y divide-line">
                          {matches.map((m) => (
                            <MatchRow
                              key={m.profileId}
                              match={m}
                              action={
                                status === "open" ? (
                                  <InviteButton ideaId={idea.id} builderId={m.profileId} name={m.name} />
                                ) : undefined
                              }
                            />
                          ))}
                        </ol>
                      )}
                    </Panel>
                  </section>
                </>
              )}
            </div>

            <aside className="space-y-6 lg:col-span-4" aria-label="Team and actions">
              {!isOwner && (
                <Panel className="p-6">
                  {onTeam ? (
                    <>
                      <Badge tone="solid">You&rsquo;re on the team</Badge>
                      <p className="mt-3 text-body-sm text-muted">You can read the full plan.</p>
                    </>
                  ) : myRequest ? (
                    <>
                      <p className="text-body-sm font-medium text-ink">
                        {myRequest.type === "invite" ? "You were invited" : "You asked to join"}
                      </p>
                      <p className="mt-1 text-body-sm text-muted">{requestState[myRequest.status]}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {myRequest.status === "pending" && myRequest.type === "invite" && (
                          <RespondButtons requestId={myRequest.id} label="invite" needsAgreement />
                        )}
                        {myRequest.status === "pending" && myRequest.type === "application" && (
                          <WithdrawButton requestId={myRequest.id} />
                        )}
                      </div>
                    </>
                  ) : status !== "open" ? (
                    <p className="text-body-sm text-muted">This team isn&rsquo;t taking new builders.</p>
                  ) : viewer.status !== "approved" ? (
                    <>
                      <p className="text-body-sm text-ink">Verify once to ask to join.</p>
                      <ButtonLink href="/onboarding" size="sm" className="mt-4">
                        Verify now
                      </ButtonLink>
                    </>
                  ) : (
                    <ApplyForm ideaId={idea.id} />
                  )}
                </Panel>
              )}

              {isOwner && (
                <Panel className="p-6">
                  <StatusForm ideaId={idea.id} current={status} />
                  <p className="text-caption text-muted">
                    The idea closes to new builders automatically when the team is full.
                  </p>
                </Panel>
              )}

              <Panel className="p-6">
                <h2 className="font-medium text-ink">Team</h2>
                {!canSeePeople && (
                  <p className="mt-2 text-body-sm text-muted">
                    {members} {members === 1 ? "builder has" : "builders have"} joined. Verify to see who&rsquo;s on the
                    team; students are visible only to verified students on campus.
                  </p>
                )}
                {canSeePeople && (
                  <ul className="mt-4 space-y-4">
                    {team.map((t) => (
                      <li key={t.profile_id} className="flex items-center gap-3">
                        <Avatar name={t.profiles?.full_name || "Student"} src={t.profiles?.avatar_url} size="sm" />
                        <div className="min-w-0 flex-1">
                          {t.profiles?.username ? (
                            <Link
                              href={`/u/${t.profiles.username}`}
                              className="truncate text-body-sm font-medium text-ink hover:text-accent"
                            >
                              {t.profiles.full_name || `@${t.profiles.username}`}
                            </Link>
                          ) : (
                            <p className="truncate text-body-sm font-medium text-ink">
                              {t.profiles?.full_name || "Student"}
                            </p>
                          )}
                          <p className="text-caption text-muted">{t.role === "owner" ? "Owner" : "Builder"}</p>
                        </div>
                        {t.role === "member" && (isOwner || t.profile_id === viewer.id) && (
                          <RemoveMemberButton
                            ideaId={idea.id}
                            profileId={t.profile_id}
                            self={t.profile_id === viewer.id}
                            name={t.profiles?.full_name || "this builder"}
                          />
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                {members < idea.team_size && (
                  <p className="mt-4 text-caption text-muted">
                    {idea.team_size - members} {idea.team_size - members === 1 ? "place" : "places"} left
                  </p>
                )}
              </Panel>

              {!isOwner && (
                <p className="text-caption text-muted">
                  {/* The owner's name is visible only on campus; otherwise just say when. */}
                  Posted by {owner?.full_name || "a verified student"} {timeAgo(idea.created_at)}.
                </p>
              )}
              {!isOwner && <ReportForm kind="idea" targetId={idea.id} label="Report this idea" />}
            </aside>
          </div>
        </Container>
      </main>
    </>
  );
}

function IdeaFallback() {
  const block = "animate-pulse rounded-control bg-sunken motion-reduce:animate-none";
  return (
    <>
      <AppHeaderFallback />
      <main id="main" className="flex-1" aria-busy="true">
        <Container className="py-12 md:py-16">
          <div className={`h-5 w-20 ${block}`} />
          <div className={`mt-4 h-10 w-96 max-w-full ${block}`} />
          <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-8">
              <div className={`h-24 ${block}`} />
              <div className={`h-48 ${block}`} />
            </div>
            <div className={`h-64 lg:col-span-4 ${block}`} />
          </div>
        </Container>
      </main>
    </>
  );
}

export default function IdeaPage({ params, searchParams }: PageProps<"/ideas/[id]">) {
  return (
    <Suspense fallback={<IdeaFallback />}>
      <IdeaContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}
