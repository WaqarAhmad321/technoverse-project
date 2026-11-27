"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { can, requireMember } from "@/lib/access";
import { recordAudit } from "@/lib/audit";
import { db, unwrap } from "@/lib/db";
import { assessIntegrity, type IntegritySignal } from "@/lib/integrity";
import { loadExamForStaff } from "./data";

const MAX_NOTE_CHARS = 2_000;
const STATUS_BY_DECISION = { dismiss: "dismissed", report: "reported", void: "voided" } as const;

const decisionSchema = z.object({
  examId: z.uuid(),
  attemptId: z.uuid(),
  decision: z.enum(["dismiss", "report", "void"]),
  note: z.string().trim().min(1).max(MAX_NOTE_CHARS),
});

export type DecisionState = { message: string } | null;

export async function decideIntegrityCase(_previous: DecisionState, formData: FormData): Promise<DecisionState> {
  const member = await requireMember("examiner", "institution_admin", "controller");
  const parsed = decisionSchema.safeParse({
    examId: formData.get("examId"),
    attemptId: formData.get("attemptId"),
    decision: formData.get("decision"),
    note: formData.get("note"),
  });
  if (!parsed.success) return { message: "Write a short note on your decision, then choose it again." };
  const { examId, attemptId, decision, note } = parsed.data;
  const exam = await loadExamForStaff(member, examId);
  if (!can(member, "exam.monitor", exam)) return { message: "You cannot decide cases for this exam." };

  const attempt: { id: string; user_id: string; candidate_id: string | null } | null = unwrap(
    await db()
      .from("attempts")
      .select("id, user_id, candidate_id")
      .eq("id", attemptId)
      .eq("exam_id", exam.id)
      .eq("institution_id", member.institution.id)
      .eq("is_sandbox", false)
      .maybeSingle(),
  );
  if (!attempt) return { message: "That attempt could not be found." };

  const signals: IntegritySignal[] = unwrap(
    await db().from("incidents").select("kind, details, occurred_at").eq("attempt_id", attempt.id).order("occurred_at"),
  );
  const assessment = assessIntegrity(signals);
  unwrap(
    await db()
      .from("integrity_cases")
      .upsert(
        {
          user_id: attempt.user_id,
          institution_id: member.institution.id,
          exam_id: exam.id,
          attempt_id: attempt.id,
          candidate_id: attempt.candidate_id,
          level: assessment.level,
          reasons: assessment.reasons,
          status: STATUS_BY_DECISION[decision],
          decision_note: note,
          decided_by: member.user.id,
          decided_at: new Date().toISOString(),
        },
        { onConflict: "attempt_id" },
      ),
  );
  if (decision === "void") unwrap(await db().from("attempts").update({ status: "voided" }).eq("id", attempt.id));
  await recordAudit(member, `integrity.${STATUS_BY_DECISION[decision]}`, attempt.id, { note, level: assessment.level });
  revalidatePath(`/monitor/${exam.id}/integrity`);
  return null;
}
