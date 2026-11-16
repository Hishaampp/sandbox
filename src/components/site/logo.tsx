import Link from "next/link";
import { cn } from "@/lib/cn";

/** The mark: an open box with one block set inside it, something being built. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={cn("size-6", className)}>
      <path d="M3 7v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <rect x="13" y="12" width="5" height="6" rx="1" className="fill-accent" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn("inline-flex items-center gap-2 text-ink", className)}
      aria-label="Sandbox home"
    >
      <LogoMark />
      <span className="text-body font-semibold tracking-tight">Sandbox</span>
    </Link>
  );
}
