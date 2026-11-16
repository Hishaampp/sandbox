import { Lightbulb, Plus } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { IdeaRow, type IdeaRowData } from "@/components/ideas/idea-row";
import { AppHeader, AppHeaderFallback } from "@/components/site/app-header";
import { Alert } from "@/components/ui/alert";
import { Button, ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Field, Select } from "@/components/ui/field";
import { Panel } from "@/components/ui/panel";
import { requireViewer } from "@/lib/auth";
import { getSkillCatalog, skillNamer, statusLabel, type IdeaStatus } from "@/lib/ideas";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Ideas" };

const statusFilters = { open: "Open ideas", all: "All ideas" } as const;

async function IdeasContent({ searchParams }: { searchParams: PageProps<"/ideas">["searchParams"] }) {
  const viewer = await requireViewer("/ideas");
  const params = await searchParams;
  const skill = typeof params.skill === "string" ? params.skill : "";
  const show = params.show === "all" ? "all" : "open";

  const supabase = await createClient();
  let query = supabase
    .from("ideas")
    .select("id, title, summary, skills_needed, team_size, hours_per_week, status, created_at")
    .order("created_at", { ascending: false })
    .limit(60);
  if (show === "open") query = query.eq("status", "open");
  if (skill) query = query.contains("skills_needed", [skill]);

  const [{ data: ideas, error }, fitRes, mySkillsRes, catalog, name] = await Promise.all([
    query,
    supabase.rpc("ideas_for_me", { p_limit: 100 }),
    supabase.from("skills").select("slug").eq("profile_id", viewer.id),
    getSkillCatalog(),
    skillNamer(),
  ]);

  const ids = (ideas ?? []).map((i) => i.id);
  const { data: memberRows } = ids.length
    ? await supabase.from("team_members").select("idea_id").in("idea_id", ids).eq("role", "member")
    : { data: [] as { idea_id: string }[] };
  const memberCount = new Map<string, number>();
  for (const m of memberRows ?? []) memberCount.set(m.idea_id, (memberCount.get(m.idea_id) ?? 0) + 1);

  const fit = new Map((fitRes.data ?? []).map((f) => [f.idea_id, f.match_pct]));
  const mine = new Set((mySkillsRes.data ?? []).map((s) => s.slug));

  const rows: IdeaRowData[] = (ideas ?? [])
    .map((i) => ({
      id: i.id,
      title: i.title,
      summary: i.summary,
      status: i.status,
      statusLabel: statusLabel[i.status as IdeaStatus],
      skills: i.skills_needed.map((slug) => ({ slug, name: name(slug), mine: mine.has(slug) })),
      teamCount: memberCount.get(i.id) ?? 0,
      teamSize: i.team_size,
      hours: i.hours_per_week,
      fitPct: fit.get(i.id) ?? null,
    }))
    // Ideas that fit your proven skills first, then newest.
    .sort((a, b) => (b.fitPct ?? 0) - (a.fitPct ?? 0));

  const filtered = Boolean(skill) || show === "all";

  return (
    <>
      <AppHeader viewer={viewer} current="ideas" />
      <main id="main" className="flex-1">
        <Container className="py-12 md:py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-heading font-semibold text-ink">Ideas on campus</h1>
              <p className="mt-2 text-body text-muted">
                {mine.size
                  ? "Ideas that fit your proven skills come first."
                  : "Connect GitHub on your dashboard to see which ideas fit you."}
              </p>
            </div>
            {viewer.status === "approved" ? (
              <ButtonLink href="/ideas/new" icon={<Plus className="size-4" aria-hidden="true" />}>
                Post an idea
              </ButtonLink>
            ) : (
              <ButtonLink href="/onboarding" variant="secondary">
                Verify to post an idea
              </ButtonLink>
            )}
          </div>

          <form method="get" className="mt-10 flex flex-wrap items-end gap-3" aria-label="Filter ideas">
            <Field id="skill" label="Skill" className="w-56">
              <Select id="skill" name="skill" defaultValue={skill}>
                <option value="">Any skill</option>
                {catalog.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field id="show" label="Show" className="w-44">
              <Select id="show" name="show" defaultValue={show}>
                {Object.entries(statusFilters).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
            <Button type="submit" variant="secondary" className="mb-6.5">
              Filter
            </Button>
            {filtered && (
              <ButtonLink href="/ideas" variant="ghost" className="mb-6.5">
                Clear
              </ButtonLink>
            )}
          </form>

          <Panel className="mt-2 overflow-hidden">
            {error ? (
              <div className="p-6">
                <Alert tone="danger" title="Ideas couldn't be loaded">
                  Refresh the page.
                </Alert>
              </div>
            ) : rows.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-16 text-center">
                <Lightbulb className="size-6 text-muted" aria-hidden="true" />
                <h2 className="mt-4 font-medium text-ink">{filtered ? "No ideas match these filters" : "No open ideas yet"}</h2>
                <p className="mt-1 text-body-sm text-muted">
                  {filtered ? "Try another skill, or show all ideas." : "Be the first to post one."}
                </p>
                {filtered ? (
                  <ButtonLink href="/ideas" variant="secondary" size="sm" className="mt-6">
                    Clear filters
                  </ButtonLink>
                ) : (
                  viewer.status === "approved" && (
                    <ButtonLink href="/ideas/new" size="sm" className="mt-6">
                      Post an idea
                    </ButtonLink>
                  )
                )}
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {rows.map((r) => (
                  <IdeaRow key={r.id} idea={r} />
                ))}
              </ul>
            )}
          </Panel>
        </Container>
      </main>
    </>
  );
}

function IdeasFallback() {
  const block = "animate-pulse rounded-control bg-sunken motion-reduce:animate-none";
  return (
    <>
      <AppHeaderFallback />
      <main id="main" className="flex-1" aria-busy="true">
        <Container className="py-12 md:py-16">
          <div className={`h-10 w-72 max-w-full ${block}`} />
          <div className={`mt-3 h-6 w-96 max-w-full ${block}`} />
          <div className={`mt-10 h-16 w-md max-w-full ${block}`} />
          <div className={`mt-2 h-96 ${block}`} />
        </Container>
      </main>
    </>
  );
}

export default function IdeasPage({ searchParams }: PageProps<"/ideas">) {
  return (
    <Suspense fallback={<IdeasFallback />}>
      <IdeasContent searchParams={searchParams} />
    </Suspense>
  );
}
