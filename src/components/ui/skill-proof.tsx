import { cn } from "@/lib/cn";

export type SkillProofItem = {
  skill: string;
  /** "github" skills carry evidence from real repos; "self" skills are labelled and count less. */
  source: "github" | "self";
  evidence: string;
  /** Whether the idea being matched needs this skill. */
  matched?: boolean;
};

/**
 * One line of proof under a student's name: the skill, then where it comes from.
 * Mono type marks evidence read from code; self-added skills are visibly quieter.
 */
export function SkillProof({ item, className }: { item: SkillProofItem; className?: string }) {
  return (
    // On phones the evidence stacks under the skill and wraps, so proof is never cut off.
    <div className={cn("flex min-w-0 flex-col text-caption sm:flex-row sm:items-baseline sm:gap-3", className)}>
      <span
        className={cn(
          "shrink-0 font-medium sm:w-24 sm:truncate",
          item.source === "self" ? "text-muted" : "text-ink",
        )}
      >
        {item.skill}
      </span>
      <span
        className={cn(
          "min-w-0 break-words sm:truncate",
          item.source === "github" ? "font-mono text-ink-soft" : "text-muted italic",
        )}
      >
        {item.evidence}
      </span>
    </div>
  );
}

export function SkillProofList({
  items,
  className,
  revealFromMs,
}: {
  items: SkillProofItem[];
  className?: string;
  /** When set, each line is read in left to right, one after another, starting at this delay. */
  revealFromMs?: number;
}) {
  return (
    <ul className={cn("space-y-1.5", className)}>
      {items.map((item, i) => (
        <li
          key={item.skill}
          className={revealFromMs !== undefined ? "animate-reveal" : undefined}
          style={revealFromMs !== undefined ? { animationDelay: `${revealFromMs + i * 110}ms` } : undefined}
        >
          <SkillProof item={item} />
        </li>
      ))}
    </ul>
  );
}
