import { z } from "zod";

export const MAX_ID_PHOTO_BYTES = 5 * 1024 * 1024;

export const verificationSchema = z.object({
  collegeId: z.uuid("Choose your college."),
  fullName: z
    .string()
    .trim()
    .min(2, "Enter your full name as it appears on your ID card.")
    .max(120, "Keep your name under 120 characters."),
  department: z
    .string()
    .trim()
    .min(2, "Enter your department, for example Computer Science.")
    .max(120, "Keep the department under 120 characters."),
  year: z.coerce
    .number({ error: "Choose your year of study." })
    .int()
    .min(1, "Choose your year of study.")
    .max(6, "Choose your year of study."),
  regNo: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9/-]{4,24}$/, "Enter your registration number: 4 to 24 letters, digits, / or -."),
  cardValidUntil: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : undefined))
    .refine((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), "Enter a valid date.")
    .refine((v) => !v || v >= new Date().toISOString().slice(0, 10), "This card has expired. Use a valid ID card."),
});

export type VerificationField = keyof z.infer<typeof verificationSchema> | "idCard";

export type VerificationFormState = {
  errors?: Partial<Record<VerificationField, string>>;
  formError?: string;
};
