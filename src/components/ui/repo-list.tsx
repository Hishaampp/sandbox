import { ExternalLink } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Badge } from "./badge";

export type RepoListItem = {
  name: string;
  /** Link to the repository on GitHub; omitted for illustrative rows. */
  href?: string;
  language: string | null;
  /** Right-hand detail: when the repository was last pushed, e.g. "6 days ago". */
  detail: ReactNode;
  /** Shown struck through with a reason badge: forks and empty repos never count. */
  excluded?: string;
};

/** A ruled list of repositories: name in mono (it is code), language, last push. */
export function RepoList({ items, className }: { items: RepoListItem[]; className?: string }) {
  return (
    <ul className={cn("divide-y divide-line", className)}>
      {items.map((r) => (
        <li
          key={r.name}
          className={cn(
            "grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-1 px-5 py-3 sm:grid-cols-[minmax(0,1fr)_7rem_10rem]",
            r.excluded && "text-muted",
          )}
        >
          {r.href && !r.excluded ? (
            <a
              href={r.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex min-w-0 items-center gap-1.5 font-mono text-body-sm text-ink hover:text-accent"
            >
              <span className="truncate">{r.name}</span>
              <ExternalLink className="size-3.5 shrink-0 text-muted group-hover:text-accent" aria-hidden="true" />
              <span className="sr-only">(opens GitHub)</span>
            </a>
          ) : (
            <span className={cn("truncate font-mono text-body-sm", r.excluded ? "line-through" : "text-ink")}>
              {r.name}
            </span>
          )}
          <span className="hidden text-caption sm:block">{r.language ?? "—"}</span>
          <span className="text-right text-caption whitespace-nowrap">
            {r.excluded ? <Badge tone="outline">{r.excluded}</Badge> : r.detail}
          </span>
        </li>
      ))}
    </ul>
  );
}
