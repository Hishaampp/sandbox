"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { getViewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; saved?: boolean };

const MAX_SELF_SKILLS = 12;

const skillSchema = z
  .string()
  .trim()
  .min(1, "Type a skill, for example UI design.")
  .max(40, "Keep a skill under 40 characters.")
  .regex(/^[\p{L}\p{N} .+#/&-]+$/u, "Use letters, numbers, spaces and . + # / & - only.");

/** Self-added skills are labelled and count less; the database sets their score. */
export async function addSkill(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Your session ended. Sign in again." };

  const parsed = skillSchema.safeParse(formData.get("skill"));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { count } = await supabase
    .from("skills")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", viewer.id)
    .eq("source", "self");
  if ((count ?? 0) >= MAX_SELF_SKILLS) {
    return { error: `You can add up to ${MAX_SELF_SKILLS} skills by hand. Remove one first.` };
  }

  // slug and score are set by the database for self-added skills.
  const { error } = await supabase
    .from("skills")
    .insert({ profile_id: viewer.id, name: parsed.data, slug: "pending", source: "self" });
  if (error) {
    return {
      error: error.code === "23505" ? "You already have this skill." : "The skill wasn't saved. Try again.",
    };
  }
  refresh();
  return { saved: true };
}

export async function removeSkill(formData: FormData) {
  const viewer = await getViewer();
  const id = z.uuid().safeParse(formData.get("id"));
  if (!viewer || !id.success) return;
  const supabase = await createClient();
  // RLS allows deleting only your own self-added skills.
  await supabase.from("skills").delete().eq("id", id.data).eq("source", "self");
  refresh();
}

const portfolioSchema = z
  .string()
  .trim()
  .max(300, "Keep the link under 300 characters.")
  .refine((v) => v === "" || /^https:\/\/[^\s]+\.[^\s]+$/.test(v), "Use a full https:// link, for example your Behance or Figma page.");

export async function savePortfolio(_prev: FormState, formData: FormData): Promise<FormState> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Your session ended. Sign in again." };
  const parsed = portfolioSchema.safeParse(formData.get("portfolio") ?? "");
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ portfolio_url: parsed.data || null })
    .eq("id", viewer.id);
  if (error) return { error: "The link wasn't saved. Try again." };
  refresh();
  return { saved: true };
}
