import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type IdeaStatus = "open" | "team_formed" | "in_progress" | "completed" | "archived";

export const statusLabel: Record<IdeaStatus, string> = {
  open: "Open",
  team_formed: "Team formed",
  in_progress: "In progress",
  completed: "Completed",
  archived: "Archived",
};

export type SkillCatalogEntry = { slug: string; name: string; students: number };

/** Display names and suggestions for skill tags, from real students' skills. */
export const getSkillCatalog = cache(async (): Promise<SkillCatalogEntry[]> => {
  const supabase = await createClient();
  const { data } = await supabase.rpc("skill_catalog");
  return data ?? [];
});

/** "next.js" -> "Next.js"; falls back to a readable version of the slug. */
export async function skillNamer() {
  const catalog = await getSkillCatalog();
  const names = new Map(catalog.map((c) => [c.slug, c.name]));
  return (slug: string) => names.get(slug) ?? slug.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

/** Pending requests waiting for the viewer's answer: invites to them, applications to their ideas. */
export const getPendingReceivedCount = cache(async (viewerId: string): Promise<number> => {
  const supabase = await createClient();
  const [{ count: invites }, { data: myIdeas }] = await Promise.all([
    supabase
      .from("requests")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", viewerId)
      .eq("type", "invite")
      .eq("status", "pending"),
    supabase.from("ideas").select("id").eq("owner_id", viewerId),
  ]);
  let applications = 0;
  if (myIdeas?.length) {
    const { count } = await supabase
      .from("requests")
      .select("id", { count: "exact", head: true })
      .in(
        "idea_id",
        myIdeas.map((i) => i.id),
      )
      .eq("type", "application")
      .eq("status", "pending");
    applications = count ?? 0;
  }
  return (invites ?? 0) + applications;
});

/** How many builders joined each idea. Counts only, so it is safe to show anyone who can see the idea. */
export async function getTeamCounts(ideaIds: string[]): Promise<Map<string, number>> {
  if (!ideaIds.length) return new Map();
  const supabase = await createClient();
  const { data } = await supabase.rpc("idea_team_counts", { p_idea_ids: ideaIds });
  return new Map((data ?? []).map((row) => [row.idea_id, row.members]));
}
