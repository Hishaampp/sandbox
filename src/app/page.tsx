import {
  BadgeCheck,
  Building2,
  EyeOff,
  FolderGit2,
  GitFork,
  ImageOff,
  KeyRound,
  LockKeyhole,
  ScrollText,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { MatchPreview } from "@/components/landing/match-preview";
import { Section } from "@/components/landing/section";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { Avatar } from "@/components/ui/avatar";
import { VerifiedBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Panel } from "@/components/ui/panel";
import { SkillProofList } from "@/components/ui/skill-proof";

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

const steps = [
  { title: "Sign in with Google", body: "Browse ideas and profiles straight away." },
  { title: "Post or ask to join", body: "Owners post an idea and the skills it needs. Builders apply." },
  { title: "Verify once", body: "Confirm you're a student the first time you post or join. Never again." },
  { title: "Get matched", body: "Owners see builders ranked by proven skills, with the reason for each." },
  { title: "Form the team", body: "Accepted teammates see the full project plan and start building." },
];

const proofPoints = [
  {
    icon: FolderGit2,
    title: "Connected through GitHub's own sign-in",
    body: "Nobody can type in a username and claim someone else's work.",
  },
  {
    icon: GitFork,
    title: "Only original projects count",
    body: "Forks and empty repos are left out. Recent work counts for more.",
  },
  {
    icon: ScrollText,
    title: "Every skill shows its proof",
    body: "Owners see why someone fits. Skills added by hand are labelled and count less.",
  },
];

const privacy = [
  {
    icon: KeyRound,
    title: "No passwords collected",
    body: "University login happens on the university's own page. We only receive a confirmation.",
  },
  {
    icon: EyeOff,
    title: "Registration numbers stay hidden",
    body: "We check them to keep one account per student. Others only see a Verified student badge.",
  },
  {
    icon: ImageOff,
    title: "ID photos are deleted",
    body: "A coordinator reviews your ID card photo once. The photo is removed as soon as they decide.",
  },
  {
    icon: LockKeyhole,
    title: "Ideas stay protected",
    body: "Only a short summary is public. The full plan is shared with accepted teammates only.",
  },
];

const gains = [
  {
    icon: Building2,
    title: "More student projects get built",
    body: "Ideas that used to stall find a team and reach a working prototype.",
  },
  {
    icon: Users,
    title: "Teams across departments",
    body: "Computer science, design and management students meet in one place.",
  },
  {
    icon: Search,
    title: "Faculty can find skilled students",
    body: "Search verified students by proven skill for research and department projects.",
  },
  {
    icon: ShieldCheck,
    title: "A record of student innovation",
    body: "Every team and finished project is logged, ready for reports and accreditation.",
  },
];

function IconItem({ icon: Icon, title, children }: { icon: typeof Users; title: string; children: ReactNode }) {
  return (
    <div className="flex gap-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-control border border-line bg-paper text-ink">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div>
        <h3 className="font-medium text-ink">{title}</h3>
        <p className="mt-1 text-body-sm text-muted">{children}</p>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="flex-1">
        {/* Hero */}
        <Container className="grid grid-cols-1 items-center gap-14 pt-16 pb-20 md:pt-24 md:pb-28 lg:grid-cols-[1fr_minmax(0,30rem)] lg:gap-16">
          <div className="max-w-prose">
            <h1 className="text-display-sm font-semibold text-balance text-ink md:text-display">
              Find teammates by what they&rsquo;ve built, not what they claim.
            </h1>
            <p className="mt-6 text-lead text-pretty text-muted">
              Sandbox is where verified students on your campus post project ideas and find people whose skills
              are proven by their real GitHub work.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-start">
              <GoogleSignInButton className="sm:w-auto" />
              <ButtonLink href="#how-it-works" variant="secondary" size="lg">
                How it works
              </ButtonLink>
            </div>
            <ul className="mt-8 space-y-2.5">
              {trust.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-2.5 text-body-sm text-ink-soft">
                  <Icon className="size-4 shrink-0 text-accent" aria-hidden="true" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
          <MatchPreview />
        </Container>

        {/* Problem */}
        <Section id="problem" title="Good student ideas stall without a team.">
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
          intro="Browsing is open to everyone. Verification happens only when you first post an idea or ask to join one."
        >
          <ol className="grid grid-cols-1 gap-8 md:grid-cols-5 md:gap-6">
            {steps.map((s, i) => (
              <li key={s.title} className="relative md:pt-10">
                <span className="hidden md:absolute md:inset-x-0 md:top-3.5 md:block md:h-px md:bg-line" aria-hidden="true" />
                <span className="relative flex size-7 items-center justify-center rounded-full border border-line-strong bg-canvas font-mono text-caption font-medium text-ink md:absolute md:top-0 md:left-0">
                  {i + 1}
                </span>
                <h3 className="mt-3 font-medium text-ink md:mt-0">{s.title}</h3>
                <p className="mt-1.5 text-body-sm text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </Section>

        {/* Proof of skill */}
        <Section
          id="proof"
          title="Skills come from real code, not claims"
          intro="When a student connects GitHub, Sandbox reads their own projects once and turns them into skills with proof."
        >
          <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="space-y-8">
              {proofPoints.map((p) => (
                <IconItem key={p.title} icon={p.icon} title={p.title}>
                  {p.body}
                </IconItem>
              ))}
            </div>
            <figure aria-label="Example student profile">
              <Panel className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar name="Simran Kaur" size="lg" />
                  <div className="min-w-0">
                    <p className="text-title font-semibold text-ink">Simran Kaur</p>
                    <p className="text-body-sm text-muted">Computer Science, 3rd year</p>
                    <VerifiedBadge className="mt-2" />
                  </div>
                </div>
                <div className="mt-6 border-t border-line pt-5">
                  <p className="mb-3 text-caption text-muted">Skills and their proof</p>
                  <SkillProofList
                    items={[
                      { skill: "React", source: "github", evidence: "4 original repos, 6 days ago" },
                      { skill: "TypeScript", source: "github", evidence: "3 original repos, 6 days ago" },
                      { skill: "Python", source: "github", evidence: "2 original repos, 1 month ago" },
                      { skill: "UI design", source: "self", evidence: "Self-added, Figma portfolio" },
                    ]}
                  />
                </div>
                <div className="mt-6 border-t border-line pt-5">
                  <p className="text-caption text-muted">Built on Sandbox</p>
                  <p className="mt-1 text-body-sm text-ink">Built Lab slot alerts with React and Python</p>
                </div>
              </Panel>
              <figcaption className="mt-3 text-caption text-muted">An illustrative profile.</figcaption>
            </figure>
          </div>
        </Section>

        {/* Privacy */}
        <Section
          id="privacy"
          title="Built to protect students"
          intro="Trust is the product. Every rule below is enforced by the database, not just the page."
        >
          <div className="grid grid-cols-1 gap-x-16 gap-y-10 md:grid-cols-2">
            {privacy.map((p) => (
              <IconItem key={p.title} icon={p.icon} title={p.title}>
                {p.body}
              </IconItem>
            ))}
          </div>
        </Section>

        {/* For universities */}
        <Section
          id="universities"
          title="What the university gains"
          intro="Sandbox is always free for students: verification, posting ideas and matching. No data selling, no ads."
        >
          <div className="grid grid-cols-1 gap-x-16 gap-y-10 md:grid-cols-2">
            {gains.map((g) => (
              <IconItem key={g.title} icon={g.icon} title={g.title}>
                {g.body}
              </IconItem>
            ))}
          </div>
        </Section>

        {/* Closing */}
        <section aria-labelledby="closing-title" className="border-t border-line">
          <Container className="flex flex-col items-start justify-between gap-8 py-20 md:flex-row md:items-center md:py-24">
            <div className="max-w-prose">
              <h2 id="closing-title" className="text-heading font-semibold text-balance text-ink">
                Your next teammate is already on campus.
              </h2>
              <p className="mt-3 text-lead text-muted">Sign in, look around, and verify only when you&rsquo;re ready to act.</p>
            </div>
            <GoogleSignInButton className="md:w-auto" />
          </Container>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
