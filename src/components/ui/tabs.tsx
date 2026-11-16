import Link from "next/link";
import { cn } from "@/lib/cn";

/** Link tabs: each tab is a real URL, so it works without JavaScript and can be shared. */
export function TabLinks({
  label,
  tabs,
  current,
  className,
}: {
  label: string;
  tabs: { key: string; label: string; href: string; count?: number }[];
  current: string;
  className?: string;
}) {
  return (
    <nav aria-label={label} className={cn("border-b border-line", className)}>
      <ul className="-mb-px flex gap-6">
        {tabs.map((tab) => {
          const active = tab.key === current;
          return (
            <li key={tab.key}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "inline-flex h-11 items-center gap-2 border-b-2 text-body-sm transition-colors",
                  active ? "border-ink font-medium text-ink" : "border-transparent text-muted hover:text-ink",
                )}
              >
                {tab.label}
                {tab.count ? (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-action px-1.5 text-caption font-medium text-action-ink tabular-nums">
                    {tab.count}
                    <span className="sr-only"> waiting</span>
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
