import { Clock, Users } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge, VerifiedBadge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import { SkillProofList, type SkillProofItem } from "@/components/ui/skill-proof";

type Match = {
  name: string;
  meta: string;
  pct: number;
  matched: string;
  proof: SkillProofItem[];
};

const matches: Match[] = [
  {
    name: "Simran Kaur",
    meta: "Computer Science, 3rd year",
    pct: 92,
    matched: "3 of 3 skills",
    proof: [
      { skill: "React", source: "github", evidence: "4 original repos, 6 days ago" },
      { skill: "Python", source: "github", evidence: "2 original repos, 1 month ago" },
      { skill: "UI design", source: "self", evidence: "Self-added, Figma portfolio" },
    ],
  },
  {
    name: "Aarav Mehta",
    meta: "Electronics, 2nd year",
    pct: 71,
    matched: "2 of 3 skills",
    proof: [
      { skill: "Python", source: "github", evidence: "5 original repos, 2 days ago" },
      { skill: "React", source: "github", evidence: "1 original repo, 4 months ago" },
    ],
  },
];

/** Illustrative preview of what an idea owner sees. Static content; no real students. */
export function MatchPreview() {
  return (
    <figure aria-label="Example: ranked matches for an idea" className="relative">
      <Panel className="overflow-hidden">
        <div className="border-b border-line p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-caption text-muted">Your idea</p>
              <p className="mt-0.5 text-title font-semibold text-ink">Lab slot alerts</p>
            </div>
            <Badge tone="outline">Open</Badge>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge>React</Badge>
            <Badge>Python</Badge>
            <Badge>UI design</Badge>
            <span className="ml-auto flex items-center gap-4 text-caption text-muted">
              <span className="inline-flex items-center gap-1.5">
                <Users className="size-3.5" aria-hidden="true" />
                Team of 3
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-3.5" aria-hidden="true" />6 h a week
              </span>
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between bg-sunken px-5 py-2.5 text-caption text-muted">
          <span>Best matches</span>
          <span>Why they fit</span>
        </div>

        <ol className="divide-y divide-line">
          {matches.map((m, i) => (
            <li key={m.name} className="p-5">
              <div className="flex items-start gap-3">
                <Avatar name={m.name} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="font-medium text-ink">{m.name}</p>
                    <VerifiedBadge />
                  </div>
                  <p className="text-caption text-muted">{m.meta}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-title font-semibold text-accent tabular-nums">{m.pct}%</p>
                  <p className="text-caption text-muted">{m.matched}</p>
                </div>
              </div>
              <SkillProofList items={m.proof} className="mt-4 sm:pl-13" />
              {i === 0 && (
                <div className="mt-4 flex gap-2 sm:pl-13">
                  <span className="inline-flex h-8 items-center rounded-control bg-ink px-3 text-caption font-medium text-canvas">
                    Invite to team
                  </span>
                  <span className="inline-flex h-8 items-center rounded-control border border-line-strong px-3 text-caption font-medium text-ink">
                    View profile
                  </span>
                </div>
              )}
            </li>
          ))}
        </ol>
      </Panel>
      <figcaption className="mt-3 text-caption text-muted">
        An example of what an idea owner sees. Names and repos are illustrative.
      </figcaption>
    </figure>
  );
}
