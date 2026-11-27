"use server";

import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { z } from "zod";
import { can, requireMember } from "@/lib/access";
import { recordAudit } from "@/lib/audit";
import { db, unwrap } from "@/lib/db";
import { getExam } from "../exams/data";
import { autoGradeObjective } from "./auto-grade";
import { listFinishedAttempts } from "./data";

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

  const snapshot: { answer_key: string[] | null } | null = unwrap(
    await db()
      .from("attempt_questions")
      .select("answer_key, attempt:attempts!inner(exam_id)")
      .eq("institution_id", member.institution.id)
      .eq("question_id", input.question_id)
      .eq("attempt.exam_id", exam.id)
      .limit(1)
      .maybeSingle(),
  );
  if (!snapshot) notFound();
  const oldKey = snapshot.answer_key ?? [];
  const option = input.option ? [input.option] : [];
  const decision = input.choice === "keep" ? "change_key" : input.choice;
  const newKey = input.choice === "keep" ? oldKey : input.choice === "change_key" || input.choice === "accept_both" ? option : null;
  if ((input.choice === "change_key" || input.choice === "accept_both") && option.length === 0) {
    return { status: "error", message: "Choose the option to accept." };
  }

  unwrap(
    await db().from("key_fixes").insert({
      user_id: member.user.id,
      institution_id: member.institution.id,
      exam_id: exam.id,
      question_id: input.question_id,
      decision,
      old_key: oldKey,
      new_key: newKey,
      reason: input.reason,
    }),
  );
  await recordAudit(member, "key.fixed", input.question_id, { exam_id: exam.id, decision: input.choice, old_key: oldKey, new_key: newKey, reason: input.reason });
  await autoGradeObjective(member, exam.id, await listFinishedAttempts(member, exam.id));
  revalidatePath(`/marking/${exam.id}`);
  return null;
}
