"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { getViewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type ReviewState = { error?: string; done?: "approved" | "rejected" };

const reviewSchema = z.discriminatedUnion("decision", [
  z.object({ id: z.uuid(), decision: z.literal("approved") }),
  z.object({
    id: z.uuid(),
    decision: z.literal("rejected"),
    reason: z.string().trim().min(3, "Write a short reason the student will see.").max(300, "Keep the reason under 300 characters."),
  }),
]);

/**
 * Approve or reject one submission, then delete the ID photo.
 * The database function re-checks that the caller is an admin.
 */
export async function reviewVerification(_prev: ReviewState, formData: FormData): Promise<ReviewState> {
  const viewer = await getViewer();
  if (!viewer?.isAdmin) return { error: "Only admins can review verifications." };

  const parsed = reviewSchema.safeParse({
    id: formData.get("id"),
    decision: formData.get("decision"),
    reason: formData.get("reason") ?? undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };

  const supabase = await createClient();
  const { data: reviewed, error } = await supabase
    .rpc("review_verification", {
      p_verification_id: parsed.data.id,
      p_decision: parsed.data.decision,
      p_reason: parsed.data.decision === "rejected" ? parsed.data.reason : undefined,
    });

  if (error) {
    return {
      error: error.message.includes("already reviewed")
        ? "Someone already reviewed this student. Refresh the queue."
        : "The decision wasn't saved. Try again.",
    };
  }

  // The decision is saved. Now remove the photo; if this fails the path stays
  // set, so the photo can be cleaned up later and nothing is lost.
  if (reviewed?.id_card_path) {
    const removed = await supabase.storage.from("id-cards").remove([reviewed.id_card_path]);
    if (!removed.error) {
      await supabase.rpc("clear_id_card_path", { p_verification_id: reviewed.id });
    }
  }

  refresh();
  return { done: parsed.data.decision };
}
