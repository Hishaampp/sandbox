import { Inbox } from "lucide-react";
import { Suspense } from "react";
import { AppHeader, AppHeaderFallback } from "@/components/site/app-header";
import Link from "next/link";
import { CloseReportButtons } from "@/components/safety/safety-controls";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { Panel } from "@/components/ui/panel";
import { requireAdmin } from "@/lib/auth";
import { formatDate, formatDateTime, yearLabel } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { ReviewRow, type QueueItem } from "./review-row";

// No page title: non-admins get "not found", and a title would reveal the page exists.

const PHOTO_URL_SECONDS = 10 * 60;

async function loadQueue(): Promise<QueueItem[] | { error: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("student_verifications")
    .select(
      "id, full_name, department, year, reg_no, submitted_at, card_valid_until, id_card_path, colleges(name), profiles!student_verifications_profile_id_fkey(avatar_url)",
    )
    .eq("status", "pending")
    .order("submitted_at", { ascending: true })
    .limit(50);

  if (error) return { error: error.message };

  const paths = data.map((row) => row.id_card_path).filter((p): p is string => Boolean(p));
  const signed = paths.length
    ? await supabase.storage.from("id-cards").createSignedUrls(paths, PHOTO_URL_SECONDS)
    : { data: [] as { path: string | null; signedUrl: string }[] };
  const urlByPath = new Map((signed.data ?? []).map((s) => [s.path, s.signedUrl]));

  return data.map((row) => ({
    id: row.id,
    fullName: row.full_name,
    department: row.department,
    yearLabel: yearLabel(row.year) ?? "",
    regNo: row.reg_no,
    collegeName: row.colleges?.name ?? "",
    submittedLabel: formatDateTime(row.submitted_at),
    cardValidUntilLabel: row.card_valid_until ? formatDate(row.card_valid_until) : null,
    avatarUrl: row.profiles?.avatar_url ?? null,
    photoUrl: row.id_card_path ? (urlByPath.get(row.id_card_path) ?? null) : null,
  }));
}

type OpenReport = {
  id: string;
  reason: string;
  created_at: string;
  reporter: string;
  target: { kind: "profile" | "idea"; label: string; href: string | null };
};

async function loadReports(): Promise<OpenReport[] | { error: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reports")
    .select(
      "id, reason, created_at, reporter:profiles!reports_reporter_id_fkey(full_name), target:profiles!reports_target_profile_id_fkey(full_name, username), idea:ideas!reports_target_idea_id_fkey(id, title)",
    )
    .eq("status", "open")
    .order("created_at", { ascending: true })
    .limit(50);
  if (error) return { error: error.message };
  return data.map((r) => ({
    id: r.id,
    reason: r.reason,
    created_at: r.created_at,
    reporter: r.reporter?.full_name || "A student",
    target: r.idea
      ? { kind: "idea" as const, label: r.idea.title, href: `/ideas/${r.idea.id}` }
      : {
          kind: "profile" as const,
          label: r.target?.full_name || "A student",
          href: r.target?.username ? `/u/${r.target.username}` : null,
        },
  }));
}

async function AdminContent() {
  const viewer = await requireAdmin("/admin");
  const [queue, reports] = await Promise.all([loadQueue(), loadReports()]);

  return (
    <>
      <AppHeader viewer={viewer} current="admin" />
      <main id="main" className="flex-1">
        <Container className="py-12 md:py-16">
          <h1 className="font-display text-heading font-semibold text-ink">Admin</h1>
          <p className="mt-2 text-body text-muted">Verify students and handle reports.</p>

          <h2 className="mt-10 text-title font-semibold text-ink">Verification queue</h2>
          <p className="mt-1 text-body-sm text-muted">
            Check each ID photo against the details, then approve or reject. Photos are deleted after your decision.
          </p>
          <div className="mt-4">
            {"error" in queue ? (
              <Alert tone="danger" title="The queue couldn't be loaded">
                Refresh the page. If it keeps happening, check that Supabase is running.
              </Alert>
            ) : queue.length === 0 ? (
              <Panel className="flex flex-col items-center px-6 py-16 text-center">
                <Inbox className="size-6 text-muted" aria-hidden="true" />
                <h2 className="mt-4 font-medium text-ink">No one is waiting</h2>
                <p className="mt-1 text-body-sm text-muted">New submissions appear here, oldest first.</p>
              </Panel>
            ) : (
              <Panel>
                <h2 className="border-b border-line px-6 py-3 text-body-sm font-normal text-muted">
                  {queue.length} {queue.length === 1 ? "student is" : "students are"} waiting, oldest first.
                </h2>
                <ul className="divide-y divide-line">
                  {queue.map((item) => (
                    <ReviewRow key={item.id} item={item} />
                  ))}
                </ul>
              </Panel>
            )}
          </div>

          <section aria-labelledby="reports-title" className="mt-16">
            <h2 id="reports-title" className="text-title font-semibold text-ink">
              Reports
            </h2>
            <p className="mt-1 text-body-sm text-muted">
              Students and ideas reported by other students. The reported person never sees who reported them.
            </p>
            <Panel className="mt-4 overflow-hidden">
              {"error" in reports ? (
                <div className="p-6">
                  <Alert tone="danger" title="Reports couldn't be loaded">
                    Refresh the page.
                  </Alert>
                </div>
              ) : reports.length === 0 ? (
                <p className="px-6 py-10 text-center text-body-sm text-muted">No open reports.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {reports.map((r) => (
                    <li key={r.id} className="flex flex-col gap-3 p-6 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-body-sm text-ink">
                          <Badge tone="outline">{r.target.kind === "idea" ? "Idea" : "Student"}</Badge>{" "}
                          {r.target.href ? (
                            <Link href={r.target.href} className="font-medium hover:text-accent">
                              {r.target.label}
                            </Link>
                          ) : (
                            <span className="font-medium">{r.target.label}</span>
                          )}
                        </p>
                        <p className="mt-2 text-body-sm text-ink-soft">{r.reason}</p>
                        <p className="mt-1 text-caption text-muted">
                          Reported by {r.reporter}, {formatDateTime(r.created_at)}
                        </p>
                      </div>
                      <CloseReportButtons reportId={r.id} />
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </section>
        </Container>
      </main>
    </>
  );
}

function AdminFallback() {
  return (
    <>
      <AppHeaderFallback />
      <main id="main" className="flex-1" aria-busy="true">
        <Container className="py-12 md:py-16">
          <div className="h-10 w-72 max-w-full animate-pulse rounded-control bg-sunken motion-reduce:animate-none" />
          <div className="mt-3 h-6 w-96 max-w-full animate-pulse rounded-control bg-sunken motion-reduce:animate-none" />
          <div className="mt-10 h-80 animate-pulse rounded-panel bg-sunken motion-reduce:animate-none" />
        </Container>
      </main>
    </>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<AdminFallback />}>
      <AdminContent />
    </Suspense>
  );
}
