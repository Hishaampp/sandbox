import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Logo } from "./logo";

const links = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#proof", label: "Proof of skill" },
  { href: "/#privacy", label: "Privacy" },
  { href: "/#universities", label: "For universities" },
];

export function SiteHeader() {
  return (
    <header className="theme-night sticky top-0 z-30 border-b border-line bg-navy">
      <Container className="flex h-16 items-center justify-between gap-6">
        <Logo />
        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="rounded-control px-3 py-2 text-body-sm text-muted transition-colors duration-150 hover:text-ink"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <ButtonLink href="/login" variant="secondary" size="sm">
          Sign in
        </ButtonLink>
      </Container>
    </header>
  );
}

/** Slim header for focused pages (sign-in, onboarding): logo and a way back. */
export function SlimHeader({ backHref = "/", backLabel = "Back to home" }: { backHref?: string; backLabel?: string }) {
  return (
    <header className="border-b border-line">
      <Container className="flex h-16 items-center justify-between">
        <Logo />
        <Link href={backHref} className="text-body-sm text-muted transition-colors hover:text-ink">
          {backLabel}
        </Link>
      </Container>
    </header>
  );
}
