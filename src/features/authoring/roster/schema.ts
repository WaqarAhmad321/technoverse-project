import { z } from "zod";

const CNIC = /^(\d{5})-?(\d{7})-?(\d)$/;
export const EXTRA_TIME_MAX_PCT = 100;

export const candidateSchema = z.object({
  full_name: z.string().trim().min(2, "Enter the candidate's full name.").max(80),
  roll_number: z
    .string()
    .trim()
    .min(1, "Enter a roll number.")
    .max(20, "Roll numbers are at most 20 characters.")
    .regex(/^[A-Za-z0-9-/]+$/, "Roll numbers use letters, digits, dashes and slashes only."),
  email: z.string().trim().toLowerCase().pipe(z.email("Email is not a valid address, such as hamza.riaz@example.pk.")),
  cnic: z
    .string()
    .trim()
    .regex(CNIC, "CNIC must have 13 digits, such as 35202-1234567-3."),
  section: z.string().trim().max(60, "Section names are at most 60 characters."),
  extra_time_pct: z.coerce
    .number({ message: "Extra time must be a whole number from 0 to 100." })
    .int("Extra time must be a whole number from 0 to 100.")
    .min(0, "Extra time must be a whole number from 0 to 100.")
    .max(EXTRA_TIME_MAX_PCT, "Extra time must be a whole number from 0 to 100."),
});

export type CandidateInput = z.infer<typeof candidateSchema>;

// Only the district prefix and the check digit are kept; the full number never reaches the database.
export function maskCnic(cnic: string): string {
  const match = cnic.match(CNIC);
  if (!match) return "";
  return `${match[1]}-•••••••-${match[3]}`;
}

export function readCandidateForm(formData: FormData): unknown {
  return {
    full_name: formData.get("full_name") ?? "",
    roll_number: formData.get("roll_number") ?? "",
    email: formData.get("email") ?? "",
    cnic: formData.get("cnic") ?? "",
    section: formData.get("section") ?? "",
    extra_time_pct: formData.get("extra_time_pct") || "0",
  };
}
