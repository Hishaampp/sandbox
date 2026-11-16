import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Logo } from "./logo";

const links = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#privacy", label: "Privacy" },
  { href: "/#universities", label: "For universities" },
  { href: "/login", label: "Sign in" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <Container className="flex flex-col gap-6 py-10 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Logo />
          <p className="text-caption text-muted">Built by students, for students. Free for every student.</p>
        </div>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-body-sm text-muted">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition-colors hover:text-ink">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
    </footer>
  );
}
