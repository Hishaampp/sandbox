"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MAX_ID_PHOTO_BYTES, verificationSchema, type VerificationFormState } from "./schema";

/** Identify the image by its first bytes, not by what the browser claims. */
function sniffImage(bytes: Uint8Array): { ext: string; type: string } | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { ext: "jpg", type: "image/jpeg" };
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return { ext: "png", type: "image/png" };
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return { ext: "webp", type: "image/webp" };
  return null;
}

export async function submitVerification(
  _prev: VerificationFormState,
  formData: FormData,
): Promise<VerificationFormState> {
  const viewer = await getViewer();
  if (!viewer) return { formError: "Your session ended. Sign in again, then resubmit." };
  if (viewer.status === "approved" || viewer.status === "pending") redirect("/dashboard");

  const parsed = verificationSchema.safeParse({
    collegeId: formData.get("collegeId"),
    fullName: formData.get("fullName"),
    department: formData.get("department"),
    year: formData.get("year"),
    regNo: formData.get("regNo"),
    cardValidUntil: formData.get("cardValidUntil") ?? undefined,
  });

  const errors: VerificationFormState["errors"] = {};
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof typeof errors;
      errors[key] ??= issue.message;
    }
  }

  const file = formData.get("idCard");
  let image: { ext: string; type: string } | null = null;
  let bytes: Uint8Array | null = null;
  if (!(file instanceof File) || file.size === 0) {
    errors.idCard = "Add a photo of the front of your ID card.";
  } else if (file.size > MAX_ID_PHOTO_BYTES) {
    errors.idCard = "This photo is larger than 5 MB. Use a smaller photo.";
  } else {
    bytes = new Uint8Array(await file.arrayBuffer());
    image = sniffImage(bytes);
    if (!image) errors.idCard = "This file isn't a JPG, PNG or WebP photo.";
  }

  if (!parsed.success || Object.keys(errors).length > 0 || !image || !bytes) {
    return { errors };
  }

  const supabase = await createClient();
  const path = `${viewer.id}/${randomUUID()}.${image.ext}`;

  const upload = await supabase.storage.from("id-cards").upload(path, bytes, {
    contentType: image.type,
    upsert: false,
  });
  if (upload.error) {
    return { formError: "Your photo couldn't be uploaded. Check your connection and try again." };
  }

  const { data } = parsed;
  const insert = await supabase.from("student_verifications").insert({
    profile_id: viewer.id,
    college_id: data.collegeId,
    full_name: data.fullName,
    department: data.department,
    year: data.year,
    reg_no: data.regNo,
    card_valid_until: data.cardValidUntil ?? null,
    id_card_path: path,
  });

  if (insert.error) {
    // Don't leave an orphaned ID photo behind. Storage policy allows this delete only
    // because no submission refers to the photo.
    await supabase.storage.from("id-cards").remove([path]);
    if (insert.error.code === "23505") {
      return {
        errors: {
          regNo:
            "This registration number is already linked to another account. If that isn't you, contact the coordinator.",
        },
      };
    }
    return { formError: "We couldn't save your details. Try again in a moment." };
  }

  redirect("/dashboard");
}
