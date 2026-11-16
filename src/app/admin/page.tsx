import { Inbox } from "lucide-react";
import { Suspense } from "react";
import { AppHeader, AppHeaderFallback } from "@/components/site/app-header";
import { Alert } from "@/components/ui/alert";
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

async function AdminContent() {
  const viewer = await requireAdmin("/admin");
  const queue = await loadQueue();

  return (
    <>
      <AppHeader viewer={viewer} current="admin" />
      <main id="main" className="flex-1">
        <Container className="py-12 md:py-16">
          <h1 className="font-display text-heading font-semibold text-ink">Verification queue</h1>
          <p className="mt-2 text-body text-muted">
            Check each ID photo against the details, then approve or reject. Photos are deleted after your decision.
          </p>

          <div className="mt-10">
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
