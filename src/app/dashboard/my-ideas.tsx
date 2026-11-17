import { Lightbulb, Plus } from "lucide-react";
import { IdeaRow, type IdeaRowData } from "@/components/ideas/idea-row";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import type { Viewer } from "@/lib/auth";
import { getTeamCounts, skillNamer, statusLabel, type IdeaStatus } from "@/lib/ideas";
import { createClient } from "@/lib/supabase/server";

/** Ideas the student owns, and teams they've joined. */
export async function MyIdeas({ viewer }: { viewer: Viewer }) {
  const supabase = await createClient();
  const { data: memberships, error } = await supabase
    .from("team_members")
    .select("role, ideas(id, title, summary, skills_needed, team_size, hours_per_week, status)")
    .eq("profile_id", viewer.id)
    .order("joined_at", { ascending: false });

  const ideas = (memberships ?? []).flatMap((m) => (m.ideas ? [{ role: m.role, idea: m.ideas }] : []));
  const ids = ideas.map((i) => i.idea.id);
  const [counts, { data: mySkills }, name] = await Promise.all([
    getTeamCounts(ids),
    supabase.from("skills").select("slug").eq("profile_id", viewer.id),
    skillNamer(),
  ]);
  const mine = new Set((mySkills ?? []).map((s) => s.slug));

  const toRow = ({ idea }: (typeof ideas)[number]): IdeaRowData => ({
    id: idea.id,
    title: idea.title,
    summary: idea.summary,
    status: idea.status,
    statusLabel: statusLabel[idea.status as IdeaStatus],
    skills: idea.skills_needed.map((slug) => ({ slug, name: name(slug), mine: mine.has(slug) })),
    teamCount: counts.get(idea.id) ?? 0,
    teamSize: idea.team_size,
    hours: idea.hours_per_week,
  });

  const owned = ideas.filter((i) => i.role === "owner").map(toRow);
  const joined = ideas.filter((i) => i.role === "member").map(toRow);

  return (
    <section aria-labelledby="my-ideas-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="my-ideas-title" className="text-title font-semibold text-ink">
          Your ideas and teams
        </h2>
        {viewer.status === "approved" && (
          <ButtonLink href="/ideas/new" size="sm" variant="secondary" icon={<Plus className="size-4" aria-hidden="true" />}>
            Post an idea
          </ButtonLink>
        )}
      </div>
      <Panel className="mt-4 overflow-hidden">
        {error ? (
          <div className="p-6">
            <Alert tone="danger" title="Your ideas couldn't be loaded">
              Refresh the page.
            </Alert>
          </div>
        ) : owned.length + joined.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-10 text-center">
            <Lightbulb className="size-6 text-muted" aria-hidden="true" />
            <h3 className="mt-3 font-medium text-ink">No ideas or teams yet</h3>
            <p className="mt-1 text-body-sm text-muted">Post an idea, or find one that fits your skills.</p>
            <ButtonLink href="/ideas" variant="secondary" size="sm" className="mt-5">
              Browse ideas
            </ButtonLink>
          </div>
        ) : (
          <>
            {owned.length > 0 && (
              <>
                <h3 className="border-b border-line bg-sunken px-6 py-2.5 text-caption text-muted">You own</h3>
                <ul className="divide-y divide-line">
                  {owned.map((r) => (
                    <IdeaRow key={r.id} idea={r} />
                  ))}
                </ul>
              </>
            )}
            {joined.length > 0 && (
              <>
                <h3 className="border-y border-line bg-sunken px-6 py-2.5 text-caption text-muted">Teams you&rsquo;re on</h3>
                <ul className="divide-y divide-line">
                  {joined.map((r) => (
                    <IdeaRow key={r.id} idea={r} />
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </Panel>
    </section>
  );
}
