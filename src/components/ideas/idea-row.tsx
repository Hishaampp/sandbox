import { Clock, Users } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export type IdeaRowData = {
  id: string;
  title: string;
  summary: string;
  status: string;
  statusLabel: string;
  skills: { slug: string; name: string; mine: boolean }[];
  teamCount: number;
  teamSize: number;
  hours: number;
  fitPct?: number | null;
  note?: string;
};

/** One idea in a ruled list: the title is the link, everything else is the reason to click. */
export function IdeaRow({ idea }: { idea: IdeaRowData }) {
  return (
    <li className="relative px-6 py-5 transition-colors hover:bg-sunken">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <h3 className="min-w-0 flex-1 font-medium text-ink">
          <Link href={`/ideas/${idea.id}`} className="after:absolute after:inset-0">
            {idea.title}
          </Link>
        </h3>
        <div className="flex items-center gap-2">
          {typeof idea.fitPct === "number" && idea.fitPct > 0 && (
            <Badge tone="accent">
              Fits you <span className="font-mono tabular-nums">{idea.fitPct}%</span>
            </Badge>
          )}
          <Badge tone={idea.status === "open" ? "outline" : "neutral"}>{idea.statusLabel}</Badge>
        </div>
      </div>
      <p className="mt-1 line-clamp-2 text-body-sm text-muted">{idea.summary}</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <ul className="flex flex-wrap gap-1.5" aria-label="Skills needed">
          {idea.skills.map((s) => (
            <li key={s.slug}>
              <Badge tone={s.mine ? "solid" : "neutral"}>
                {s.name}
                {s.mine && <span className="sr-only"> (you have this skill)</span>}
              </Badge>
            </li>
          ))}
        </ul>
        <span className="ml-auto flex items-center gap-4 text-caption text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Users className="size-3.5" aria-hidden="true" />
            {idea.teamCount} of {idea.teamSize} joined
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5" aria-hidden="true" />
            {idea.hours} hours a week
          </span>
          {idea.note && <span>{idea.note}</span>}
        </span>
      </div>
    </li>
  );
}
