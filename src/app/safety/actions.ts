"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { getViewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type SafetyState = { error?: string; done?: boolean };

/** Block or unblock a student. Blocks stop invites and requests both ways and hide each other from matches. */
export async function toggleBlock(_prev: SafetyState, formData: FormData): Promise<SafetyState> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Your session ended. Sign in again." };
  const target = z.uuid().safeParse(formData.get("profileId"));
  const action = z.enum(["block", "unblock"]).safeParse(formData.get("action"));
  if (!target.success || target.data === viewer.id) return { error: "That student couldn't be found." };
  if (!action.success) return { error: "Choose block or unblock." };

  const supabase = await createClient();
  const { error } =
    action.data === "unblock"
      ? await supabase.from("blocks").delete().eq("blocker_id", viewer.id).eq("blocked_id", target.data)
      : await supabase.from("blocks").insert({ blocker_id: viewer.id, blocked_id: target.data });
  if (error && error.code !== "23505") return { error: "That wasn't saved. Try again." };
  refresh();
  return { done: true };
}

const reportSchema = z.object({
  kind: z.enum(["profile", "idea"]),
  targetId: z.uuid(),
  reason: z
    .string()
    .trim()
    .min(5, "Say briefly what's wrong, so the coordinator can check.")
    .max(600, "Keep the report under 600 characters."),
});

/** Send a report to the coordinator. The reported student never sees it. */
export async function sendReport(_prev: SafetyState, formData: FormData): Promise<SafetyState> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Your session ended. Sign in again." };
  const parsed = reportSchema.safeParse({
    kind: formData.get("kind"),
    targetId: formData.get("targetId"),
    reason: formData.get("reason"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const supabase = await createClient();
  const { error } = await supabase.from("reports").insert({
    reporter_id: viewer.id,
    reason: parsed.data.reason,
    target_profile_id: parsed.data.kind === "profile" ? parsed.data.targetId : null,
    target_idea_id: parsed.data.kind === "idea" ? parsed.data.targetId : null,
  });
  if (error) {
    if (error.code === "23505") return { error: "You've already reported this. The coordinator will review it." };
    if (error.code === "P0001") return { error: error.message };
    return { error: "The report wasn't sent. Try again." };
  }
  return { done: true };
}

/** Admin: close a report as resolved (action taken) or dismissed (nothing wrong). */
export async function closeReport(_prev: SafetyState, formData: FormData): Promise<SafetyState> {
  const viewer = await getViewer();
  if (!viewer?.isAdmin) return { error: "Only admins can close reports." };
  const id = z.uuid().safeParse(formData.get("reportId"));
  const status = z.enum(["resolved", "dismissed"]).safeParse(formData.get("status"));
  if (!id.success || !status.success) return { error: "Choose resolve or dismiss." };

  const supabase = await createClient();
  const { error, count } = await supabase
    .from("reports")
    .update({ status: status.data, resolved_by: viewer.id, resolved_at: new Date().toISOString() }, { count: "exact" })
    .eq("id", id.data)
    .eq("status", "open");
  if (error || !count) return { error: "That report was already closed, or the change wasn't saved." };
  refresh();
  return { done: true };
}
