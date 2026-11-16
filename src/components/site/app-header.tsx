import { CircleDashed, Clock, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Badge, VerifiedBadge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import type { Viewer } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { Logo } from "./logo";
import { UserMenu } from "./user-menu";

type Section = "dashboard" | "admin";

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
export function AppHeader({ viewer, current }: { viewer: Viewer; current: Section }) {
  const links: { href: string; label: string; section: Section }[] = [
    { href: "/dashboard", label: "Dashboard", section: "dashboard" },
    ...(viewer.isAdmin ? [{ href: "/admin", label: "Admin", section: "admin" as const }] : []),
  ];

  return (
    <header className="border-b border-line bg-canvas">
      <Container className="flex h-16 items-center gap-6">
        <Logo />
        <nav aria-label="Main" className="min-w-0 flex-1">
          <ul className="flex items-center gap-1">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={link.section === current ? "page" : undefined}
                  className={cn(
                    "rounded-control px-3 py-2 text-body-sm transition-colors hover:text-ink",
                    link.section === current ? "font-medium text-ink" : "text-muted",
                  )}
                >
                  {link.label}
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
