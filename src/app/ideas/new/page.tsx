import { Eye, Lock } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { SlimHeader } from "@/components/site/site-header";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Panel } from "@/components/ui/panel";
import { requireViewer } from "@/lib/auth";
import { getSkillCatalog } from "@/lib/ideas";
import { IdeaForm } from "./idea-form";

export const metadata: Metadata = { title: "Post an idea" };

async function IdeaFormLoader() {
  const viewer = await requireViewer("/ideas/new");
  if (viewer.status !== "approved") {
    return (
      <div className="mt-8">
        <Alert title="Verify once to post an idea">
          Posting is for verified students, so builders know every idea comes from someone on campus.
        </Alert>
        <ButtonLink href={viewer.status === "pending" ? "/dashboard" : "/onboarding"} className="mt-6">
          {viewer.status === "pending" ? "See verification status" : "Verify now"}
        </ButtonLink>
      </div>
    );
  }
  const catalog = await getSkillCatalog();
  return <IdeaForm suggestions={catalog.map((c) => c.name)} />;
}

function IdeaFormFallback() {
  const block = "animate-pulse rounded-control bg-sunken motion-reduce:animate-none";
  return (
    <div className="mt-8 space-y-5" aria-busy="true">
      {[10, 20, 10, 10, 10, 32].map((h, i) => (
        <div key={i}>
          <div className={`h-5 w-32 ${block}`} />
          <div className={`mt-1.5 ${h === 32 ? "h-32" : h === 20 ? "h-20" : "h-10"} ${block}`} />
        </div>
      ))}
      <div className={`h-12 ${block}`} />
    </div>
  );
}

export default function NewIdeaPage() {
  return (
    <>
      <SlimHeader backHref="/ideas" backLabel="Back to ideas" />
      <main id="main" className="flex-1">
        <Container className="grid grid-cols-1 justify-center gap-12 py-12 md:py-16 lg:grid-cols-[minmax(0,36rem)_minmax(0,20rem)] xl:gap-20">
          <div className="min-w-0">
            <Panel className="p-6 sm:p-8">
              <h1 className="text-title font-semibold text-ink">Post an idea</h1>
              <p className="mt-2 text-body-sm text-muted">
                Say what you want to build and the skills it needs. Builders with proven skills will show up ranked
                on your idea&rsquo;s page.
              </p>
              <Suspense fallback={<IdeaFormFallback />}>
                <IdeaFormLoader />
              </Suspense>
            </Panel>
          </div>
          <aside aria-label="Who sees what" className="space-y-6 lg:pt-8">
            <div className="flex gap-3">
              <Eye className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden="true" />
              <div>
                <h2 className="text-body-sm font-medium text-ink">Public to verified students</h2>
                <p className="mt-0.5 text-body-sm text-muted">Title, summary, skills, team size, hours and what builders get.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Lock className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden="true" />
              <div>
                <h2 className="text-body-sm font-medium text-ink">Team only</h2>
                <p className="mt-0.5 text-body-sm text-muted">
                  The full plan. Only you and builders you accept can read it, enforced by the database.
                </p>
              </div>
            </div>
          </aside>
        </Container>
      </main>
    </>
  );
}
