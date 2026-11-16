import { CircleDashed, Clock, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Badge, VerifiedBadge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import type { Viewer } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { getPendingReceivedCount } from "@/lib/ideas";
import { Logo } from "./logo";
import { UserMenu } from "./user-menu";

type Section = "dashboard" | "ideas" | "requests" | "admin";

function StatusBadge({ status }: { status: Viewer["status"] }) {
  switch (status) {
    case "approved":
      return <VerifiedBadge />;
    case "pending":
      return <Badge icon={<Clock className="size-3.5" aria-hidden="true" />}>Verification pending</Badge>;
    case "rejected":
      return (
        <Badge tone="danger" icon={<ShieldAlert className="size-3.5" aria-hidden="true" />}>
          Verification needs attention
        </Badge>
      );
    default:
      return (
        <Badge tone="outline" icon={<CircleDashed className="size-3.5" aria-hidden="true" />}>
          Not verified yet
        </Badge>
      );
  }
}

/** Header for signed-in pages: where you are, your status, your account. */
export async function AppHeader({ viewer, current }: { viewer: Viewer; current?: Section }) {
  const waiting = await getPendingReceivedCount(viewer.id);
  const links: { href: string; label: string; section: Section; count?: number }[] = [
    { href: "/dashboard", label: "Dashboard", section: "dashboard" },
    { href: "/ideas", label: "Ideas", section: "ideas" },
    { href: "/requests", label: "Requests", section: "requests", count: waiting },
    ...(viewer.isAdmin ? [{ href: "/admin", label: "Admin", section: "admin" as const }] : []),
  ];

  return (
    <header className="border-b border-line bg-canvas">
      <Container className="flex h-16 items-center gap-3 sm:gap-6">
        <Logo compact />
        <nav aria-label="Main" className="min-w-0 flex-1">
          <ul className="scroll-row -my-2 flex items-center gap-1 py-2">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={link.section === current ? "page" : undefined}
                  className={cn(
                    "inline-flex items-center rounded-control px-2.5 py-2 text-body-sm whitespace-nowrap transition-colors hover:text-ink sm:px-3",
                    link.section === current ? "font-medium text-ink" : "text-muted",
                  )}
                >
                  {link.label}
                  {link.count ? (
                    <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-action px-1.5 text-caption font-medium text-action-ink tabular-nums">
                      {link.count}
                      <span className="sr-only"> waiting</span>
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex items-center gap-3">
          <span className="hidden sm:block">
            <StatusBadge status={viewer.status} />
          </span>
          <UserMenu name={viewer.fullName} email={viewer.email} avatarUrl={viewer.avatarUrl} />
        </div>
      </Container>
    </header>
  );
}

/** Same footprint as AppHeader while the viewer loads. */
export function AppHeaderFallback() {
  return (
    <header className="border-b border-line bg-canvas">
      <Container className="flex h-16 items-center gap-6">
        <Logo />
        <div className="flex-1" />
        <div className="size-8 rounded-full bg-sunken" aria-hidden="true" />
      </Container>
    </header>
  );
}
