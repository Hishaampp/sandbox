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
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-6">
        <Logo />
        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="rounded-control px-3 py-2 text-body-sm text-muted transition-colors hover:text-ink"
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
export function SlimHeader() {
  return (
    <header className="border-b border-line">
      <Container className="flex h-16 items-center justify-between">
        <Logo />
        <Link href="/" className="text-body-sm text-muted transition-colors hover:text-ink">
          Back to home
        </Link>
      </Container>
    </header>
  );
}
