import type React from "react";
import { cn } from "@/lib/cn";

/**
 * Commit-graph pieces of the night world. Cells are dark when idle and coral
 * when they carry activity; the values here are illustrative.
 */

/** Twelve weeks of activity as one row of cells, read like a GitHub strip. */
export function ActivityStrip({
  weeks,
  startMs,
  label,
}: {
  /** 0 = no commits that week, 1 = busiest week. */
  weeks: number[];
  startMs: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1" role="img" aria-label={label}>
      {weeks.map((level, i) => (
        <span
          key={i}
          className={cn("commit-cell size-2.5", level > 0 && "animate-lit")}
          data-lit={level > 0 ? "" : undefined}
          style={
            level > 0
              ? ({ "--lit-rest": 0.25 + level * 0.75, animationDelay: `${startMs + i * 45}ms` } as React.CSSProperties)
              : undefined
          }
        />
      ))}
    </div>
  );
}

const cluster: number[][] = [
  [0, 0, 0.3, 0, 0, 0.5, 0],
  [0, 0.6, 0, 0.9, 0.4, 0, 0.3],
  [0.35, 0, 0.8, 0.5, 0, 0.7, 0],
  [0, 0.45, 0, 0.3, 0.85, 0, 0.5],
];

/** A loose patch of lit commits glowing beside the card, over the coral light. */
export function CommitCluster({ className, startMs = 200 }: { className?: string; startMs?: number }) {
  let order = 0;
  return (
    <div aria-hidden="true" className={cn("pointer-events-none grid grid-cols-7 gap-1.5", className)}>
      {cluster.flatMap((row, r) =>
        row.map((level, c) => {
          const lit = level > 0;
          const delay = lit ? startMs + order++ * 80 : 0;
          return (
            <span
              key={`${r}-${c}`}
              className={cn("commit-cell size-2.5 lg:size-4", lit && "animate-lit")}
              data-lit={lit ? "" : undefined}
              data-glow={level > 0.6 ? "" : undefined}
              style={lit ? ({ "--lit-rest": level, animationDelay: `${delay}ms` } as React.CSSProperties) : undefined}
            />
          );
        }),
      )}
    </div>
  );
}
