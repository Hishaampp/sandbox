import { Inbox } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { RespondButtons, WithdrawButton } from "@/app/ideas/[id]/idea-controls";
import { AppHeader, AppHeaderFallback } from "@/components/site/app-header";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Panel } from "@/components/ui/panel";
import { TabLinks } from "@/components/ui/tabs";
import { requireViewer } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { getPendingReceivedCount } from "@/lib/ideas";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Requests" };

type Row = {
  id: string;
  type: "invite" | "application";
  status: "pending" | "accepted" | "declined" | "withdrawn";
  message: string | null;
  created_at: string;
  idea: { id: string; title: string; owner_id: string } | null;
  person: { full_name: string; username: string | null; avatar_url: string | null } | null;
};

const statusBadge: Record<Row["status"], { tone: "outline" | "solid" | "neutral"; label: string }> = {
  pending: { tone: "outline", label: "Waiting" },
  accepted: { tone: "solid", label: "Accepted" },
  declined: { tone: "neutral", label: "Declined" },
  withdrawn: { tone: "neutral", label: "Withdrawn" },
};

async function RequestsContent({ searchParams }: { searchParams: PageProps<"/requests">["searchParams"] }) {
  const viewer = await requireViewer("/requests");
  const tab = (await searchParams).tab === "sent" ? "sent" : "received";
  const supabase = await createClient();

  // RLS returns only requests where the viewer is the builder or owns the idea.
  const { data, error } = await supabase
    .from("requests")
    .select(
      "id, type, status, message, created_at, profile_id, ideas(id, title, owner_id, profiles!ideas_owner_id_fkey(full_name, username, avatar_url)), profiles(full_name, username, avatar_url)",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const all = data ?? [];
  // Received: invites to me, or applications to my ideas. Sent: the opposite.
  const rows: (Row & { counterpartLabel: string })[] = all
    .map((r) => {
      const ownerIsMe = r.ideas?.owner_id === viewer.id;
      const received = (r.type === "invite" && r.profile_id === viewer.id) || (r.type === "application" && ownerIsMe);
      const person = ownerIsMe ? r.profiles : (r.ideas?.profiles ?? null);
      return {
        received,
        id: r.id,
        type: r.type,
        status: r.status,
        message: r.message,
        created_at: r.created_at,
        idea: r.ideas ? { id: r.ideas.id, title: r.ideas.title, owner_id: r.ideas.owner_id } : null,
        person,
        counterpartLabel:
          r.type === "invite"
            ? ownerIsMe
              ? "You invited"
              : "Invited you"
            : ownerIsMe
              ? "Asked to join"
              : "You asked the owner",
      };
    })
    .filter((r) => (tab === "received" ? r.received : !r.received))
    // Waiting ones first, then newest.
    .sort((a, b) => Number(b.status === "pending") - Number(a.status === "pending"));

  const pendingReceived = await getPendingReceivedCount(viewer.id);

  return (
    <>
      <AppHeader viewer={viewer} current="requests" />
      <main id="main" className="flex-1">
        <Container className="py-12 md:py-16">
          <h1 className="font-display text-heading font-semibold text-ink">Requests</h1>
          <p className="mt-2 text-body text-muted">Invites and requests to join, and your answers.</p>

          <TabLinks
            label="Request type"
            className="mt-8"
            current={tab}
            tabs={[
              { key: "received", label: "Received", href: "/requests", count: pendingReceived },
              { key: "sent", label: "Sent", href: "/requests?tab=sent" },
            ]}
          />

          <Panel className="mt-6 overflow-hidden">
            {error ? (
              <div className="p-6">
                <Alert tone="danger" title="Requests couldn't be loaded">
                  Refresh the page.
                </Alert>
              </div>
            ) : rows.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-16 text-center">
                <Inbox className="size-6 text-muted" aria-hidden="true" />
                <h2 className="mt-4 font-medium text-ink">
                  {tab === "received" ? "Nothing waiting for you" : "You haven't sent any requests"}
                </h2>
                <p className="mt-1 text-body-sm text-muted">
                  {tab === "received"
                    ? "Invites from idea owners and requests to join your ideas appear here."
                    : "Ask to join an idea, or invite builders from your idea's matches."}
                </p>
                <ButtonLink href="/ideas" variant="secondary" size="sm" className="mt-6">
                  Browse ideas
                </ButtonLink>
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {rows.map((r) => {
                  const badge = statusBadge[r.status];
                  const personName = r.person?.full_name || "A student";
                  return (
                    <li key={r.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
                      <Avatar name={personName} src={r.person?.avatar_url} />
                      <div className="min-w-0 flex-1">
                        <p className="text-body-sm text-ink">
                          {r.person?.username ? (
                            <Link href={`/u/${r.person.username}`} className="font-medium hover:text-accent">
                              {personName}
                            </Link>
                          ) : (
                            <span className="font-medium">{personName}</span>
                          )}
                          <span className="text-muted"> · {r.counterpartLabel} · </span>
                          {r.idea ? (
                            <Link href={`/ideas/${r.idea.id}`} className="font-medium hover:text-accent">
                              {r.idea.title}
                            </Link>
                          ) : (
                            <span className="text-muted">a removed idea</span>
                          )}
                        </p>
                        <p className="mt-0.5 text-caption text-muted">{formatDateTime(r.created_at)}</p>
                        {r.message && <p className="mt-2 text-body-sm text-ink-soft">{r.message}</p>}
                        {r.status === "accepted" && r.idea && (
                          <p className="mt-2 text-body-sm text-ink">
                            {r.type === "invite" && tab === "received"
                              ? "You're on the team. "
                              : r.type === "application" && tab === "sent"
                                ? "You're on the team. "
                                : `${personName} joined the team. `}
                            <Link href={`/ideas/${r.idea.id}`} className="font-medium text-accent hover:underline">
                              Open the idea
                            </Link>
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-start gap-3 sm:max-w-xs sm:shrink-0 sm:items-end">
                        <Badge tone={badge.tone}>{badge.label}</Badge>
                        {r.status === "pending" && tab === "received" && (
                          <RespondButtons
                            requestId={r.id}
                            label={`${personName}, ${r.idea?.title ?? "idea"}`}
                            needsAgreement={r.type === "invite"}
                          />
                        )}
                        {r.status === "pending" && tab === "sent" && <WithdrawButton requestId={r.id} />}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </Container>
      </main>
    </>
  );
}

function RequestsFallback() {
  const block = "animate-pulse rounded-control bg-sunken motion-reduce:animate-none";
  return (
    <>
      <AppHeaderFallback />
      <main id="main" className="flex-1" aria-busy="true">
        <Container className="py-12 md:py-16">
          <div className={`h-10 w-48 ${block}`} />
          <div className={`mt-3 h-6 w-80 max-w-full ${block}`} />
          <div className={`mt-8 h-11 w-56 ${block}`} />
          <div className={`mt-6 h-72 ${block}`} />
        </Container>
      </main>
    </>
  );
}

export default function RequestsPage({ searchParams }: PageProps<"/requests">) {
  return (
    <Suspense fallback={<RequestsFallback />}>
      <RequestsContent searchParams={searchParams} />
    </Suspense>
  );
}
