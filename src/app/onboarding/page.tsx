import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SlimHeader } from "@/components/site/site-header";
import { Alert } from "@/components/ui/alert";
import { Container } from "@/components/ui/container";
import { Panel } from "@/components/ui/panel";
import { requireViewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { VerifyForm } from "./verify-form";

export const metadata: Metadata = { title: "Verify you're a student" };

async function VerifyFormLoader() {
  const viewer = await requireViewer("/onboarding");
  if (viewer.status === "approved" || viewer.status === "pending") redirect("/dashboard");

  const supabase = await createClient();
  const { data: colleges, error } = await supabase.from("colleges").select("id, name").eq("active", true).order("name");

  if (error) {
    return (
      <Alert tone="danger" title="Verification is unavailable right now" className="mt-8">
        We couldn&rsquo;t load the list of colleges. Refresh the page in a minute.
      </Alert>
    );
  }
  if (!colleges?.length) {
    return (
      <Alert title="No colleges are open for verification yet" className="mt-8">
        Sandbox is opening college by college. You can keep browsing until yours is added.
      </Alert>
    );
  }

  return (
    <VerifyForm
      colleges={colleges}
      defaults={{
        fullName: viewer.fullName === "Student" ? "" : viewer.fullName,
        department: viewer.department ?? "",
        year: viewer.year,
      }}
    />
  );
}

/** Same footprint as the whole form (fields, photo, submit) while the student's details load. */
function VerifyFormFallback() {
  const block = "animate-pulse rounded-control bg-sunken motion-reduce:animate-none";
  const field = (wide: boolean, key: string) => (
    <div key={key} className={wide ? "sm:col-span-2" : undefined}>
      <div className={`h-5 w-32 ${block}`} />
      <div className={`mt-1.5 h-10 ${block}`} />
      <div className="min-h-5 pt-1.5" />
    </div>
  );
  return (
    <div className="mt-8" aria-busy="true">
      <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
        {field(true, "college")}
        {field(true, "name")}
        {field(false, "department")}
        {field(false, "year")}
        {field(false, "reg")}
        {field(false, "valid")}
        <div className="sm:col-span-2">
          <div className={`h-5 w-32 ${block}`} />
          <div className={`mt-1.5 h-32 ${block}`} />
        </div>
      </div>
      <div className="mt-4 border-t border-line pt-6">
        <div className={`h-12 ${block}`} />
      </div>
    </div>
  );
}

const nextSteps = [
  { title: "You submit", body: "Your details and the ID photo are saved privately." },
  { title: "A coordinator checks", body: "They compare the photo with your details and approve or reject it." },
  { title: "Your photo is deleted", body: "As soon as they decide. If approved, you get the Verified student badge." },
];

export default function OnboardingPage() {
  return (
    <>
      <SlimHeader backHref="/dashboard" backLabel="Back to dashboard" />
      <main id="main" className="flex-1">
        <Container className="grid grid-cols-1 justify-center gap-12 py-12 md:py-16 lg:grid-cols-[minmax(0,34rem)_minmax(0,22rem)] xl:gap-20">
          <div className="min-w-0">
            <Panel className="p-6 sm:p-8">
              <h1 className="text-title font-semibold text-ink">Verify you&rsquo;re a student</h1>
              <p className="mt-2 text-body-sm text-muted">
                You only do this once. Your registration number and ID photo are seen only by the coordinator who checks
                them, and the photo is deleted after their decision.
              </p>
              <Suspense fallback={<VerifyFormFallback />}>
                <VerifyFormLoader />
              </Suspense>
            </Panel>
          </div>
          <aside aria-label="What happens next" className="lg:pt-8">
            <h2 className="font-medium text-ink">What happens next</h2>
            <ol className="mt-4 space-y-5">
              {nextSteps.map((step, i) => (
                <li key={step.title} className="flex gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-line-strong font-sans text-caption text-ink tabular-nums">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-body-sm font-medium text-ink">{step.title}</p>
                    <p className="mt-0.5 text-body-sm text-muted">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-8 border-t border-line pt-6">
              <h2 className="font-medium text-ink">Who sees what</h2>
              <ul className="mt-3 space-y-2 text-body-sm text-muted">
                <li>Other students see only a Verified student badge.</li>
                <li>Your registration number is never shown on your profile.</li>
                <li>Only the coordinator can open your ID photo.</li>
              </ul>
            </div>
          </aside>
        </Container>
      </main>
    </>
  );
}
