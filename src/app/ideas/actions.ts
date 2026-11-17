"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getViewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type IdeaFormState = { errors?: Partial<Record<IdeaField, string>>; formError?: string };
type IdeaField = "title" | "summary" | "skills" | "teamSize" | "hours" | "reward" | "details";
export type SimpleState = { error?: string; done?: boolean };

/** Database rule messages are already written for students; anything else gets a calm generic line. */
function readable(error: { code?: string; message: string } | null, fallback: string) {
  if (!error) return fallback;
  if (error.code === "23505") return "You've already sent a request for this idea.";
  if (error.code === "P0001" || error.code === "42501" || error.code === "P0002") return error.message;
  return fallback;
}

const ideaSchema = z.object({
  title: z
    .string()
    .trim()
    .min(4, "Give the idea a title of at least 4 characters.")
    .max(90, "Keep the title under 90 characters."),
  summary: z
    .string()
    .trim()
    .min(20, "Write at least 20 characters so builders know what it is.")
    .max(400, "Keep the summary under 400 characters. Put the rest in the full plan."),
  skills: z
    .array(z.string().trim().min(1).max(40))
    .min(1, "Add at least one skill the idea needs.")
    .max(8, "Pick up to 8 skills."),
  teamSize: z.coerce.number().int().min(1, "Choose a team size.").max(12, "Teams can have up to 12 builders."),
  hours: z.coerce.number().int().min(1, "Choose hours per week.").max(40, "Up to 40 hours a week."),
  reward: z.string().trim().max(120, "Keep this under 120 characters.").optional(),
  details: z.string().trim().max(10000, "Keep the plan under 10,000 characters.").optional(),
});

export async function createIdea(_prev: IdeaFormState, formData: FormData): Promise<IdeaFormState> {
  const viewer = await getViewer();
  if (!viewer) return { formError: "Your session ended. Sign in again." };
  if (viewer.status !== "approved") return { formError: "Verify you're a student before posting an idea." };

  const parsed = ideaSchema.safeParse({
    title: formData.get("title"),
    summary: formData.get("summary"),
    skills: formData.getAll("skills"),
    teamSize: formData.get("teamSize"),
    hours: formData.get("hours"),
    reward: formData.get("reward") || undefined,
    details: formData.get("details") || undefined,
  });
  if (!parsed.success) {
    const errors: IdeaFormState["errors"] = {};
    for (const issue of parsed.error.issues) errors[issue.path[0] as IdeaField] ??= issue.message;
    return { errors };
  }

  const supabase = await createClient();
  const { data: me } = await supabase.from("profiles").select("college_id").eq("id", viewer.id).single();
  if (!me?.college_id) return { formError: "Your college isn't set. Verify again or contact the coordinator." };

  const { data: idea, error } = await supabase
    .from("ideas")
    .insert({
      owner_id: viewer.id,
      college_id: me.college_id,
      title: parsed.data.title,
      summary: parsed.data.summary,
      skills_needed: parsed.data.skills,
      team_size: parsed.data.teamSize,
      hours_per_week: parsed.data.hours,
      reward: parsed.data.reward ?? null,
    })
    .select("id")
    .single();
  if (error || !idea) return { formError: readable(error, "The idea wasn't posted. Try again.") };

  if (parsed.data.details) {
    const { error: planError } = await supabase
      .from("idea_details")
      .update({ details: parsed.data.details })
      .eq("idea_id", idea.id);
    if (planError) redirect(`/ideas/${idea.id}?posted=1&plan=failed`);
  }
  redirect(`/ideas/${idea.id}?posted=1`);
}

const messageSchema = z.string().trim().max(600, "Keep the message under 600 characters.");

export async function applyToIdea(_prev: SimpleState, formData: FormData): Promise<SimpleState> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Your session ended. Sign in again." };
  const ideaId = z.uuid().safeParse(formData.get("ideaId"));
  const message = messageSchema.safeParse(formData.get("message") ?? "");
  if (!ideaId.success) return { error: "This idea couldn't be found." };
  if (!message.success) return { error: message.error.issues[0]?.message };
  if (formData.get("agree") !== "on") return { error: "Tick the team agreement to ask to join." };

  const supabase = await createClient();
  const { error } = await supabase.from("requests").insert({
    idea_id: ideaId.data,
    profile_id: viewer.id,
    type: "application",
    message: message.data || null,
    // The database replaces this with its own clock and refuses a request without it.
    builder_agreed_at: new Date().toISOString(),
  });
  if (error) return { error: readable(error, "Your request wasn't sent. Try again.") };
  refresh();
  return { done: true };
}

export async function inviteBuilder(_prev: SimpleState, formData: FormData): Promise<SimpleState> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Your session ended. Sign in again." };
  const ideaId = z.uuid().safeParse(formData.get("ideaId"));
  const builderId = z.uuid().safeParse(formData.get("builderId"));
  if (!ideaId.success || !builderId.success) return { error: "That invite couldn't be sent." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("requests")
    .insert({ idea_id: ideaId.data, profile_id: builderId.data, type: "invite" });
  if (error) return { error: readable(error, "The invite wasn't sent. Try again.") };
  refresh();
  return { done: true };
}

export async function respondToRequest(_prev: SimpleState, formData: FormData): Promise<SimpleState> {
  if (!(await getViewer())) return { error: "Your session ended. Sign in again." };
  const id = z.uuid().safeParse(formData.get("requestId"));
  const decision = z.enum(["accept", "decline"]).safeParse(formData.get("decision"));
  if (!id.success) return { error: "This request couldn't be found." };
  if (!decision.success) return { error: "Choose accept or decline." };
  const accept = decision.data === "accept";
  const agreed = formData.get("agree") === "on";
  if (accept && formData.get("needsAgreement") === "1" && !agreed) {
    return { error: "Tick the team agreement to accept." };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("respond_to_request", {
    p_request_id: id.data,
    p_accept: accept,
    p_agreed: agreed,
  });
  if (error) return { error: readable(error, "Your answer wasn't saved. Try again.") };
  refresh();
  return { done: true };
}

export async function withdrawRequest(_prev: SimpleState, formData: FormData): Promise<SimpleState> {
  if (!(await getViewer())) return { error: "Your session ended. Sign in again." };
  const id = z.uuid().safeParse(formData.get("requestId"));
  if (!id.success) return { error: "This request couldn't be found." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("withdraw_request", { p_request_id: id.data });
  if (error) return { error: readable(error, "The request wasn't withdrawn. Try again.") };
  refresh();
  return { done: true };
}

const ownerStatuses = ["open", "in_progress", "completed"] as const;

export async function updateIdeaStatus(_prev: SimpleState, formData: FormData): Promise<SimpleState> {
  if (!(await getViewer())) return { error: "Your session ended. Sign in again." };
  const ideaId = z.uuid().safeParse(formData.get("ideaId"));
  const status = z.enum(ownerStatuses).safeParse(formData.get("status"));
  if (!ideaId.success || !status.success) return { error: "Choose a status." };
  const supabase = await createClient();
  // RLS lets only the owner (or an admin) update the idea.
  const { error, count } = await supabase
    .from("ideas")
    .update({ status: status.data }, { count: "exact" })
    .eq("id", ideaId.data);
  if (error || !count) return { error: "The status wasn't changed. Only the owner can change it." };
  refresh();
  return { done: true };
}

export async function saveIdeaPlan(_prev: SimpleState, formData: FormData): Promise<SimpleState> {
  if (!(await getViewer())) return { error: "Your session ended. Sign in again." };
  const ideaId = z.uuid().safeParse(formData.get("ideaId"));
  const details = z
    .string()
    .max(10000, "Keep the plan under 10,000 characters.")
    .safeParse(formData.get("details") ?? "");
  if (!ideaId.success) return { error: "This idea couldn't be found." };
  if (!details.success) return { error: details.error.issues[0]?.message };
  const supabase = await createClient();
  const { error, count } = await supabase
    .from("idea_details")
    .update({ details: details.data.trim() }, { count: "exact" })
    .eq("idea_id", ideaId.data);
  if (error || !count) return { error: "The plan wasn't saved. Only the owner can edit it." };
  refresh();
  return { done: true };
}

/** The owner removes a builder, or a builder leaves. RLS allows only those two cases. */
export async function removeTeamMember(_prev: SimpleState, formData: FormData): Promise<SimpleState> {
  const viewer = await getViewer();
  if (!viewer) return { error: "Your session ended. Sign in again." };
  const ideaId = z.uuid().safeParse(formData.get("ideaId"));
  const profileId = z.uuid().safeParse(formData.get("profileId"));
  if (!ideaId.success || !profileId.success) return { error: "That teammate couldn't be found." };
  const supabase = await createClient();
  const { error, count } = await supabase
    .from("team_members")
    .delete({ count: "exact" })
    .eq("idea_id", ideaId.data)
    .eq("profile_id", profileId.data)
    .eq("role", "member");
  if (error || !count) return { error: "That change wasn't saved. Try again." };
  if (profileId.data === viewer.id) redirect(`/ideas/${ideaId.data}?left=1`);
  refresh();
  return { done: true };
}
