"use server";

import { revalidatePath } from "next/cache";
import { requireMember } from "@/lib/access";
import { db } from "@/lib/db";
import { candidateSchema, maskCnic, readCandidateForm } from "./schema";

export type CandidateFormState = { status: "error"; message: string } | { status: "saved"; name: string; email: string } | null;

const UNIQUE_VIOLATION = "23505";

export async function addCandidate(_previous: CandidateFormState, formData: FormData): Promise<CandidateFormState> {
  const member = await requireMember("examiner", "institution_admin");
  const parsed = candidateSchema.safeParse(readCandidateForm(formData));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the candidate and try again." };
  const input = parsed.data;

  const { error } = await db().from("candidates").insert({
    user_id: member.user.id,
    institution_id: member.institution.id,
    full_name: input.full_name,
    roll_number: input.roll_number,
    email: input.email,
    cnic_masked: maskCnic(input.cnic),
    extra_time_pct: input.extra_time_pct,
  });
  if (error?.code === UNIQUE_VIOLATION) return { status: "error", message: `Roll number ${input.roll_number} is already on the roster.` };
  if (error) throw new Error(`Database request failed: ${error.message}`);

  revalidatePath("/roster");
  return { status: "saved", name: input.full_name, email: input.email };
}
