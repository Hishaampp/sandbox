import { BadgeCheck } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "neutral" | "accent" | "outline" | "danger";

const tones: Record<Tone, string> = {
  neutral: "bg-sunken text-ink-soft",
  accent: "bg-accent-soft text-accent",
  outline: "border border-line text-muted",
  danger: "bg-danger-soft text-danger",
};

export function Badge({
  tone = "neutral",
  icon,
  className,
  children,
}: {
  tone?: Tone;
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-caption font-medium whitespace-nowrap",
        tones[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

/** The one trust signal every profile carries. Never shows the registration number. */
export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <Badge tone="accent" className={className} icon={<BadgeCheck className="size-3.5" aria-hidden="true" />}>
      Verified student
    </Badge>
  );
}
