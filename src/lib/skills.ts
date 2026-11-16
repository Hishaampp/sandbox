import type { SkillProofItem } from "@/components/ui/skill-proof";
import { timeAgo } from "./format";

export type SkillRow = {
  id: string;
  name: string;
  source: "github" | "self";
  evidence: string | null;
  last_pushed_at: string | null;
  score: number;
};

/** Stored evidence has no date ("4 original repos"); the date is added at view time so it never goes stale. */
export function toProofItem(skill: SkillRow): SkillProofItem {
  if (skill.source === "self") {
    return { skill: skill.name, source: "self", evidence: "Self-added" };
  }
  const when = skill.last_pushed_at ? `, ${timeAgo(skill.last_pushed_at)}` : "";
  return { skill: skill.name, source: "github", evidence: `${skill.evidence ?? "From GitHub"}${when}` };
}
