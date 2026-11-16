import { BadgeCheck, ImageOff, KeyRound } from "lucide-react";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { MatchPreview } from "@/components/landing/match-preview";
import { Section } from "@/components/landing/section";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Panel } from "@/components/ui/panel";
import { RepoList } from "@/components/ui/repo-list";
import { SkillProofList } from "@/components/ui/skill-proof";
import { cn } from "@/lib/cn";

const trust = [
  { icon: BadgeCheck, text: "Verify once, the first time you post or join" },
  { icon: KeyRound, text: "We never ask for your UMS password" },
  { icon: ImageOff, text: "ID photos are deleted after review" },
];

const problems = [
  {
    title: "Idea owners can't find builders",
    body: "Students with ideas only know their own friends. Skilled people in other departments stay invisible.",
  },
  {
    title: "Builders can't find real projects",
    body: "Students who want real experience have nowhere to find projects that need their skills.",
  },
  {
    title: "Skills can't be checked",
    body: "Anyone can type a skill on a resume. Nobody can tell who has actually built something.",
  },
];

/** `live` marks what works today; the rest is labelled so nobody is promised what isn't built yet. */
const steps = [
  { title: "Sign in with Google", body: "Browse straight away. No forms first.", live: true },
  { title: "Verify once", body: "Your college details and an ID photo, checked by a coordinator.", live: true },
  { title: "Post or ask to join", body: "Owners post an idea and the skills it needs. Builders apply.", live: true },
  { title: "Get matched", body: "Owners see builders ranked by proven skills, with the reason for each.", live: true },
  { title: "Form the team", body: "Accepted teammates see the full project plan and start building.", live: true },
];

/** Illustrative repositories, and what Sandbox does with each. */
const repos = [
  { name: "lab-slot-alerts", lang: "TypeScript", kind: "original", pushed: "6 days ago" },
  { name: "campus-map", lang: "TypeScript", kind: "original", pushed: "3 weeks ago" },
  { name: "attendance-bot", lang: "Python", kind: "original", pushed: "1 month ago" },
  { name: "react", lang: "JavaScript", kind: "fork", pushed: "8 months ago" },
  { name: "untitled-project", lang: "—", kind: "empty", pushed: "1 year ago" },
] as const;

const ledger = [
  {
    what: "Registration number",
    sees: "You and the coordinator",
    keep: "Kept to allow one account per student",
    deleted: "With your account",
  },
  {
    what: "ID card photo",
    sees: "Only the coordinator",
    keep: "Until they approve or reject",
    deleted: "Right after their decision",
  },
  {
    what: "UMS password",
    sees: "Nobody",
    keep: "Never asked for",
    deleted: "Not collected",
  },
  {
    what: "An idea's full plan",
    sees: "Accepted teammates only",
    keep: "Kept with the idea",
    deleted: "When the owner deletes it",
  },
];

const gains = [
  {
    title: "More student projects get built",
    body: "Ideas that used to stall can find a team and reach a working prototype.",
    planned: false,
  },
  {
    title: "Teams across departments",
    body: "Computer science, design and management students meet in one place.",
    planned: false,
  },
  {
    title: "Faculty can find skilled students",
    body: "Search verified students by proven skill for research and department projects.",
    planned: true,
  },
  {
    title: "A record of student innovation",
    body: "Teams and finished projects logged for reports and accreditation.",
    planned: true,
  },
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="flex-1">
        {/* Hero: the night field */}
        <div className="theme-night night-field">
          <Container className="grid grid-cols-1 items-center gap-16 pt-16 pb-24 md:pt-24 md:pb-32 lg:grid-cols-2 lg:gap-16 xl:gap-24">
            <div className="max-w-prose">
              <h1 className="font-display text-display-sm font-semibold text-balance text-ink md:text-display xl:text-display-lg">
                Find teammates by what they&rsquo;ve built, not what they claim.
              </h1>
              <p className="mt-6 text-lead text-pretty text-muted">
                Sandbox is where verified students on your campus post project ideas and find people whose skills are
                proven by their real GitHub work.
              </p>
              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-start">
                <GoogleSignInButton className="sm:w-auto" />
                <ButtonLink href="#how-it-works" variant="ghost" size="lg" className="border border-line-strong">
                  How it works
                </ButtonLink>
              </div>
              <ul className="mt-8 space-y-2.5">
                {trust.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-2.5 text-body-sm text-ink-soft">
                    <Icon className="size-4 shrink-0 text-ink-soft" aria-hidden="true" />
                    {text}
                  </li>
                ))}
              </ul>
            </div>
            <MatchPreview />
          </Container>
        </div>

        {/* Problem */}
        <Section id="problem" layout="split" title="Good student ideas stall without a team.">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-0 md:divide-x md:divide-line">
            {problems.map((p) => (
              <div key={p.title} className="md:px-8 md:first:pl-0 md:last:pr-0">
                <h3 className="text-title font-semibold text-ink">{p.title}</h3>
                <p className="mt-3 text-body text-muted">{p.body}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* How it works */}
        <Section
          id="how-it-works"
          title="From idea to team in five steps"
          intro="All five steps work today, starting at LPU. Browsing is open; you verify only when you first post or join."
        >
          <ol className="grid grid-cols-1 gap-8 md:grid-cols-5 md:gap-6">
            {steps.map((s, i) => (
              <li key={s.title} className="relative md:pt-10">
                <span
                  className="hidden md:absolute md:inset-x-0 md:top-3.5 md:block md:h-px md:bg-line"
                  aria-hidden="true"
                />
                <span
                  className={cn(
                    "relative flex size-7 items-center justify-center rounded-full border text-caption font-medium tabular-nums md:absolute md:top-0 md:left-0",
                    s.live ? "border-ink bg-ink text-canvas" : "border-line-strong bg-canvas text-ink",
                  )}
                >
                  {i + 1}
                </span>
                <h3 className="mt-3 font-medium text-ink md:mt-0">{s.title}</h3>
                <p className="mt-1.5 text-body-sm text-muted">{s.body}</p>
                <p className="mt-3">
                  {s.live ? <Badge tone="solid">Live now</Badge> : <Badge tone="outline">Coming next</Badge>}
                </p>
              </li>
            ))}
          </ol>
        </Section>

        {/* Proof of skill: the derivation, shown */}
        <Section
          id="proof"
          tone="night"
          className="night-field-left"
          title="Skills come from real code, not claims"
          intro="Connect GitHub through GitHub's own sign-in, and Sandbox reads your own public projects and turns them into skills with proof."
        >
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-10">
            <figure aria-label="Example: repositories Sandbox reads">
              <Panel className="overflow-hidden backdrop-blur-xl">
                <p className="border-b border-line px-5 py-3 text-caption text-muted">Repositories read</p>
                <RepoList
                  items={repos.map((r) => ({
                    name: r.name,
                    language: r.lang === "—" ? null : r.lang,
                    detail: r.pushed,
                    excluded: r.kind === "fork" ? "Fork, left out" : r.kind === "empty" ? "Empty, left out" : undefined,
                  }))}
                />
              </Panel>
              <figcaption className="mt-3 text-caption text-muted">
                Only original, non-empty repositories count. A fork is someone else&rsquo;s code.
              </figcaption>
            </figure>

            <figure aria-label="Example: the skills those repositories become">
              <Panel className="p-5 backdrop-blur-xl">
                <p className="mb-4 text-caption text-muted">Skills with proof</p>
                <SkillProofList
                  items={[
                    { skill: "TypeScript", source: "github", evidence: "2 original repos, 6 days ago" },
                    { skill: "Python", source: "github", evidence: "1 original repo, 1 month ago" },
                    { skill: "UI design", source: "self", evidence: "Self-added, Figma portfolio" },
                  ]}
                />
                <dl className="mt-6 space-y-3 border-t border-line pt-5 text-body-sm">
                  <div>
                    <dt className="font-medium text-ink">Recent work counts for more</dt>
                    <dd className="text-muted">A push in the last 90 days scores higher than an old one.</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-ink">Typed skills are labelled</dt>
                    <dd className="text-muted">Added by hand, shown as self-added, and counted less.</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-ink">Nobody can claim your work</dt>
                    <dd className="text-muted">GitHub is linked through its own sign-in, never a typed username.</dd>
                  </div>
                </dl>
              </Panel>
              <figcaption className="mt-3 text-caption text-muted">Illustrative repositories and skills.</figcaption>
            </figure>
          </div>
        </Section>

        {/* Privacy: a ledger, not a list of promises */}
        <Section
          id="privacy"
          layout="split"
          title="Built to protect students"
          intro="Today you verify with an ID photo. University sign-in arrives once LPU approves it. Every rule here is enforced by the database, not just the page."
        >
          <div role="table" aria-label="What Sandbox sees, keeps and deletes" className="border-t border-ink">
            <div role="row" className="hidden grid-cols-4 gap-6 border-b border-line py-3 text-caption text-muted md:grid">
              <span role="columnheader">Data</span>
              <span role="columnheader">Who sees it</span>
              <span role="columnheader">What we keep</span>
              <span role="columnheader">When it&rsquo;s deleted</span>
            </div>
            {ledger.map((row) => (
              <div
                key={row.what}
                role="row"
                className="grid grid-cols-1 gap-1 border-b border-line py-4 md:grid-cols-4 md:gap-6"
              >
                <span role="cell" className="font-medium text-ink">
                  {row.what}
                </span>
                <span role="cell" className="text-body-sm text-ink-soft">
                  <span className="text-muted md:sr-only">Who sees it: </span>
                  {row.sees}
                </span>
                <span role="cell" className="text-body-sm text-ink-soft">
                  <span className="text-muted md:sr-only">What we keep: </span>
                  {row.keep}
                </span>
                <span role="cell" className="text-body-sm text-ink-soft">
                  <span className="text-muted md:sr-only">Deleted: </span>
                  {row.deleted}
                </span>
              </div>
            ))}
          </div>
        </Section>

        {/* For universities */}
        <Section
          id="universities"
          layout="split"
          title="What the university gains"
          intro="Sandbox is always free for students: verification, posting ideas and matching. No data selling, no ads."
        >
          <ul className="border-t border-ink">
            {gains.map((g) => (
              <li
                key={g.title}
                className="grid grid-cols-1 gap-1 border-b border-line py-4 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_6rem] md:items-baseline md:gap-6"
              >
                <span className="font-medium text-ink">{g.title}</span>
                <span className="text-body-sm text-muted">{g.body}</span>
                <span>{g.planned && <Badge tone="outline">Planned</Badge>}</span>
              </li>
            ))}
          </ul>
        </Section>

        {/* Closing */}
        <section aria-labelledby="closing-title" className="theme-night night-field night-field-low">
          <Container className="flex flex-col items-start justify-between gap-10 py-24 md:flex-row md:items-end md:py-32">
            <div className="max-w-2xl">
              <h2
                id="closing-title"
                className="font-display text-display-sm font-semibold text-balance text-ink md:text-display"
              >
                Your next teammate is already on campus.
              </h2>
              <p className="mt-4 text-lead text-muted">
                Sign in, look around, and verify only when you&rsquo;re ready to act.
              </p>
            </div>
            <GoogleSignInButton className="md:w-auto" />
          </Container>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
