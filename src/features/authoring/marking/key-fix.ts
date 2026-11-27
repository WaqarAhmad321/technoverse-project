import "server-only";
import { notFound } from "next/navigation";
import type { Member } from "@/lib/access";
import { recordAudit } from "@/lib/audit";
import { db, unwrap } from "@/lib/db";
import type { Exam } from "@/lib/exam-types";
import { autoGradeObjective } from "./auto-grade";
import { listFinishedAttempts } from "./data";
import { reissueResults } from "./results";

export type KeyFixInput = { question_id: string; choice: "change_key" | "accept_both" | "full_marks" | "drop" | "keep"; option?: string; reason: string };

// Writes the fix, audits it, regrades every attempt and issues new result versions. Returns a problem or null.
export async function applyKeyFix(member: Member, exam: Exam, fix: KeyFixInput): Promise<string | null> {
  const snapshot: { answer_key: string[] | null } | null = unwrap(
    await db()
      .from("attempt_questions")
      .select("answer_key, attempt:attempts!inner(exam_id)")
      .eq("institution_id", member.institution.id)
      .eq("question_id", fix.question_id)
      .eq("attempt.exam_id", exam.id)
      .limit(1)
      .maybeSingle(),
  );
  if (!snapshot) notFound();
  const oldKey = snapshot.answer_key ?? [];
  const option = fix.option ? [fix.option] : [];
  const decision = fix.choice === "keep" ? "change_key" : fix.choice;
  const newKey = fix.choice === "keep" ? oldKey : fix.choice === "change_key" || fix.choice === "accept_both" ? option : null;
  if ((fix.choice === "change_key" || fix.choice === "accept_both") && option.length === 0) {
    return "Choose the option to accept.";
  }

  unwrap(
    await db().from("key_fixes").insert({
      user_id: member.user.id,
      institution_id: member.institution.id,
      exam_id: exam.id,
      question_id: fix.question_id,
      decision,
      old_key: oldKey,
      new_key: newKey,
      reason: fix.reason,
    }),
  );
  await recordAudit(member, "key.fixed", fix.question_id, { exam_id: exam.id, decision: fix.choice, old_key: oldKey, new_key: newKey, reason: fix.reason });
  const attempts = await listFinishedAttempts(member, exam.id);
  await autoGradeObjective(member, exam.id, attempts);
  await reissueResults(member, exam, attempts, fix.reason);
  return null;
}
