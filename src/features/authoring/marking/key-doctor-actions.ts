"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { can, requireMember } from "@/lib/access";
import { getExam } from "../exams/data";
import { applyKeyFix } from "./key-fix";

export type KeyFixState = { status: "error"; message: string } | null;

const fixSchema = z.object({
  question_id: z.uuid(),
  choice: z.enum(["change_key", "accept_both", "full_marks", "drop", "keep"]),
  option: z.string().max(4).optional(),
  reason: z.string().trim().min(5, "Write a short reason. Candidates and auditors will see it."),
});

// "Keep the key" is stored as a change_key to the same key, so scoring never needs a sixth rule.
export async function fixKey(examId: string, _previous: KeyFixState, formData: FormData): Promise<KeyFixState> {
  const member = await requireMember("examiner", "institution_admin");
  const exam = await getExam(member, examId);
  if (!can(member, "exam.edit", exam)) return { status: "error", message: "Only the examiner who set this exam or an institution admin can fix its key." };
  const parsed = fixSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the fix and try again." };
  const input = parsed.data;

  const problem = await applyKeyFix(member, exam, input);
  if (problem) return { status: "error", message: problem };
  revalidatePath(`/marking/${exam.id}`);
  return null;
}
