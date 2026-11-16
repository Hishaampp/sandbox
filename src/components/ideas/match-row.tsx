import Link from "next/link";
import type { ReactNode } from "react";
import { Avatar } from "@/components/ui/avatar";
import { VerifiedBadge } from "@/components/ui/badge";
import { SkillProofList, type SkillProofItem } from "@/components/ui/skill-proof";

export type Match = {
  profileId: string;
  username: string | null;
  name: string;
  avatarUrl: string | null;
  meta: string;
  pct: number;
  matched: number;
  needed: number;
  proof: SkillProofItem[];
};

/** One ranked builder: who, how well they fit, and the proof for each needed skill. Same shape as the landing preview. */
export function MatchRow({ match, action }: { match: Match; action?: ReactNode }) {
  return (
    <li className="p-5">
      <div className="flex items-start gap-3">
        <Avatar name={match.name} src={match.avatarUrl} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {match.username ? (
              <Link href={`/u/${match.username}`} className="font-medium text-ink hover:text-accent">
                {match.name}
              </Link>
            ) : (
              <p className="font-medium text-ink">{match.name}</p>
            )}
            <VerifiedBadge />
          </div>
          {match.meta && <p className="text-caption text-muted">{match.meta}</p>}
        </div>
        <div className="text-right">
          <p className="font-mono text-title font-semibold text-ink tabular-nums">{match.pct}%</p>
          <p className="text-caption text-muted">
            {match.matched} of {match.needed} {match.needed === 1 ? "skill" : "skills"}
          </p>
        </div>
      </div>
      <SkillProofList items={match.proof} className="mt-4 sm:pl-13" />
      {action && <div className="mt-4 sm:pl-13">{action}</div>}
    </li>
  );
}
