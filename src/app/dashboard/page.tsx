import { CheckCircle2, Circle, Clock, FolderGit2, Lightbulb, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { AppHeader, AppHeaderFallback } from "@/components/site/app-header";
import { Alert } from "@/components/ui/alert";
import { Badge, VerifiedBadge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Panel } from "@/components/ui/panel";
import { firstName, requireViewer, type Viewer } from "@/lib/auth";
import { formatDate, formatDateTime, yearLabel } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Dashboard" };

type LatestSubmission = { submitted_at: string; status: string; rejection_reason: string | null } | null;

async function latestSubmission(viewerId: string): Promise<LatestSubmission> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("student_verifications")
    .select("submitted_at, status, rejection_reason")
    .eq("profile_id", viewerId)
    .order("submitted_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Could not load your verification: ${error.message}`);
  return data;
}

function VerificationPanel({ viewer, submission }: { viewer: Viewer; submission: LatestSubmission }) {
  if (viewer.status === "approved") {
    return (
      <Panel className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <VerifiedBadge />
          <p className="mt-3 text-body-sm text-ink-soft">
            You can post ideas and join teams.
            {viewer.verifiedUntil && <> Your verification is valid until {formatDate(viewer.verifiedUntil)}.</>}
          </p>
        </div>
      </Panel>
    );
  }

  if (viewer.status === "pending") {
    return (
      <Panel className="p-6">
        <div className="flex items-start gap-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-control border border-line bg-sunken">
            <Clock className="size-5 text-ink" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-title font-semibold text-ink">We&rsquo;re checking your ID</h2>
            <p className="mt-1 text-body-sm text-muted">
              {submission ? <>Submitted {formatDateTime(submission.submitted_at)}. </> : null}A coordinator compares
              your ID photo with your details. You can keep browsing while you wait.
            </p>
          </div>
        </div>
      </Panel>
    );
  }

  if (viewer.status === "rejected") {
    return (
      <div className="space-y-4">
        <Alert tone="danger" title="Your verification wasn't approved">
          {submission?.rejection_reason ? <>Reason: {submission.rejection_reason}. </> : null}
          Fix the details or upload a clearer photo, then send it again.
        </Alert>
        <ButtonLink href="/onboarding" variant="primary">
          Upload again
        </ButtonLink>
      </div>
    );
  }

  return (
    <Panel className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-control border border-line bg-sunken">
          <ShieldCheck className="size-5 text-ink" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-title font-semibold text-ink">Verify you&rsquo;re a student</h2>
          <p className="mt-1 text-body-sm text-muted">
            Takes about two minutes, and you only do it once. You need it to post ideas or join a team.
          </p>
        </div>
      </div>
      <ButtonLink href="/onboarding" className="sm:shrink-0">
        Verify now
      </ButtonLink>
    </Panel>
  );
}

function Step({
  done,
  icon,
  title,
  body,
  state,
}: {
  done: boolean;
  icon: ReactNode;
  title: string;
  body: string;
  state: ReactNode;
}) {
  return (
    <li className="flex items-start gap-4 px-6 py-5">
      <span className="mt-0.5 shrink-0">
        {done ? (
          <CheckCircle2 className="size-5 text-accent" role="img" aria-label="Done" />
        ) : (
          <Circle className="size-5 text-line-strong" role="img" aria-label="Not done yet" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="flex items-center gap-2 font-medium text-ink">
          <span className="hidden text-muted sm:inline" aria-hidden="true">
            {icon}
          </span>
          {title}
        </h3>
        <p className="mt-1 text-body-sm text-muted">{body}</p>
      </div>
      <div className="shrink-0">{state}</div>
    </li>
  );
}

async function DashboardContent() {
  const viewer = await requireViewer("/dashboard");
  const submission = await latestSubmission(viewer.id);
  const verified = viewer.status === "approved";
  const context = [viewer.collegeName, viewer.department, yearLabel(viewer.year)].filter(Boolean).join(", ");

  return (
    <>
      <AppHeader viewer={viewer} current="dashboard" />
      <main id="main" className="flex-1">
        <Container className="py-12 md:py-16">
          <h1 className="font-display text-heading font-semibold text-ink">Welcome, {firstName(viewer.fullName)}</h1>
          <p className="mt-2 text-body text-muted">
            {context || "Browse freely. Verify once when you're ready to post or join."}
          </p>

          <div className="mt-10 grid grid-cols-1 items-start gap-10 lg:grid-cols-12">
            <div className="space-y-12 lg:col-span-8">
              <section aria-label="Verification">
                <VerificationPanel viewer={viewer} submission={submission} />
              </section>

              <section aria-labelledby="next-title">
                <h2 id="next-title" className="text-title font-semibold text-ink">
                  What&rsquo;s next
                </h2>
                <Panel className="mt-4">
                  <ol className="divide-y divide-line">
                    <Step
                      done={verified}
                      icon={<ShieldCheck className="size-4" />}
                      title="Verify you're a student"
                      body="Confirms one account per student. Your registration number stays private."
                      state={
                        verified ? null : viewer.status === "pending" ? (
                          <Badge icon={<Clock className="size-3.5" aria-hidden="true" />}>In review</Badge>
                        ) : (
                          <ButtonLink href="/onboarding" variant="secondary" size="sm">
                            Start
                          </ButtonLink>
                        )
                      }
                    />
                    <Step
                      done={false}
                      icon={<FolderGit2 className="size-4" />}
                      title="Connect GitHub"
                      body="Your skills build themselves from your own repositories, with proof."
                      state={<Badge tone="outline">Coming soon</Badge>}
                    />
                    <Step
                      done={false}
                      icon={<Lightbulb className="size-4" />}
                      title="Post an idea or join one"
                      body="Find teammates by what they've built, or join a project that fits your skills."
                      state={<Badge tone="outline">Coming soon</Badge>}
                    />
                  </ol>
                </Panel>
              </section>
            </div>

            <aside className="space-y-6 lg:col-span-4" aria-label="Your account">
              <Panel className="p-6">
                <div className="flex items-center gap-4">
                  <Avatar name={viewer.fullName} src={viewer.avatarUrl} size="lg" />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{viewer.fullName}</p>
                    {viewer.email && <p className="truncate text-body-sm text-muted">{viewer.email}</p>}
                  </div>
                </div>
                <dl className="mt-6 space-y-3 border-t border-line pt-5 text-body-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">Status</dt>
                    <dd className="text-right text-ink">{statusLabel[viewer.status]}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted">College</dt>
                    <dd className="truncate text-right text-ink">{viewer.collegeName ?? "Not added yet"}</dd>
                  </div>
                  {viewer.verifiedUntil && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted">Verified until</dt>
                      <dd className="text-right text-ink">{formatDate(viewer.verifiedUntil)}</dd>
                    </div>
                  )}
                </dl>
              </Panel>

              <Panel className="p-6">
                <h2 className="font-medium text-ink">How verification works</h2>
                <ol className="mt-4 space-y-4">
                  {verificationSteps.map((step, i) => (
                    <li key={step} className="flex gap-3 text-body-sm text-muted">
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-line-strong font-sans text-caption text-ink tabular-nums">
                        {i + 1}
                      </span>
                      <span className="pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </Panel>
            </aside>
          </div>
        </Container>
      </main>
    </>
  );
}

const statusLabel: Record<Viewer["status"], string> = {
  unverified: "Not verified yet",
  pending: "In review",
  approved: "Verified student",
  rejected: "Needs attention",
};

const verificationSteps = [
  "You send your college details and a photo of your ID card.",
  "A coordinator checks the photo against your details.",
  "The photo is deleted, and you get the Verified student badge.",
];

function DashboardFallback() {
  return (
    <>
      <AppHeaderFallback />
      <main id="main" className="flex-1" aria-busy="true">
        <Container className="py-12 md:py-16">
          <div className="h-10 w-64 max-w-full animate-pulse rounded-control bg-sunken motion-reduce:animate-none" />
          <div className="mt-3 h-6 w-80 max-w-full animate-pulse rounded-control bg-sunken motion-reduce:animate-none" />
          <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-12">
            <div className="space-y-12 lg:col-span-8">
              <div className="h-28 animate-pulse rounded-panel bg-sunken motion-reduce:animate-none" />
              <div className="h-80 animate-pulse rounded-panel bg-sunken motion-reduce:animate-none" />
            </div>
            <div className="h-64 animate-pulse rounded-panel bg-sunken motion-reduce:animate-none lg:col-span-4" />
          </div>
        </Container>
      </main>
    </>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <DashboardContent />
    </Suspense>
  );
}
