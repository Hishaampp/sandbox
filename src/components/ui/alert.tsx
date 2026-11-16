import { CircleAlert, Info } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "info" | "danger";

const tones: Record<Tone, { box: string; icon: ReactNode }> = {
  info: {
    box: "border-line bg-sunken text-ink-soft",
    icon: <Info className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden="true" />,
  },
  danger: {
    box: "border-danger/30 bg-danger-soft text-ink",
    icon: <CircleAlert className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden="true" />,
  },
};

export function Alert({
  tone = "info",
  title,
  children,
  className,
}: {
  tone?: Tone;
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn("flex gap-3 rounded-control border px-4 py-3 text-body-sm", tones[tone].box, className)}
    >
      {tones[tone].icon}
      <div className="min-w-0">
        {title && <p className="font-medium text-ink">{title}</p>}
        {children && <div className={cn(title && "mt-0.5")}>{children}</div>}
      </div>
    </div>
  );
}
