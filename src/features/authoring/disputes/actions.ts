"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { can, requireMember } from "@/lib/access";
import { recordAudit } from "@/lib/audit";
import { db, unwrap } from "@/lib/db";
import { getExam } from "../exams/data";
import { applyKeyFix } from "../marking/key-fix";
import { getDispute, getMyResult, type DisputeDetail } from "./data";
import { listFinishedAttempts } from "../marking/data";
import { reissueResults } from "../marking/results";
import type { Member } from "@/lib/access";
import type { Exam } from "@/lib/exam-types";

const HALF_STEPS = 2;

// No-penalty rule: the new mark must be at least the old one and within the question's marks.
async function raiseWrittenMark(member: Member, exam: Exam, dispute: DisputeDetail, marks: number | undefined, reason: string): Promise<string | null> {
  if (marks === undefined || Number.isNaN(marks)) return "Enter the new mark.";
  if (marks < dispute.awarded) return `A challenge can never lower a mark. The candidate has ${dispute.awarded}.`;
  if (marks > dispute.question.marks) return `This question is worth ${dispute.question.marks} marks.`;
  if (!Number.isInteger(marks * HALF_STEPS)) return "Give marks in steps of 0.5.";
  unwrap(
    await db()
      .from("grades")
      .upsert(
        { user_id: member.user.id, institution_id: member.institution.id, attempt_id: dispute.attemptId, question_id: dispute.question_id, marks_awarded: marks, source: "manual", graded_by: member.user.id, feedback: reason },
        { onConflict: "attempt_id,question_id" },
      ),
  );
  await reissueResults(member, exam, await listFinishedAttempts(member, exam.id), reason);
  return null;
}

export type DisputeFormState = { status: "error"; message: string } | null;

const challengeSchema = z.object({
  question_id: z.uuid({ message: "Choose the question you are challenging." }),
  body: z.string().trim().min(10, "Explain the problem in a sentence or two.").max(2000),
});

export async function sendChallenge(resultId: string, _previous: DisputeFormState, formData: FormData): Promise<DisputeFormState> {
  const member = await requireMember("candidate");
  const result = await getMyResult(member, resultId);
  const parsed = challengeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the challenge and try again." };
  if (!result.breakdown.some((line) => line.question_id === parsed.data.question_id)) return { status: "error", message: "That question is not on your paper." };

  const open: { id: string }[] = unwrap(
    await db().from("disputes").select("id").eq("result_id", result.id).eq("question_id", parsed.data.question_id).eq("status", "open"),
  );
  if (open.length > 0) return { status: "error", message: "You already have an open challenge on this question." };

  unwrap(
    await db().from("disputes").insert({
      user_id: member.user.id,
      institution_id: member.institution.id,
      result_id: result.id,
      candidate_id: result.candidate_id,
      question_id: parsed.data.question_id,
      body: parsed.data.body,
      status: "open",
    }),
  );
  revalidatePath(`/results/${result.id}`);
  redirect(`/results/${result.id}`);
}

const decisionSchema = z.object({
  decision: z.enum(["accept_both", "full_marks", "reject", "raise_mark"]),
  marks: z.coerce.number().optional(),
  option: z.string().max(4).optional(),
  reason: z.string().trim().min(5, "Write a short reason. The candidate will see it."),
});

// No-penalty rule: upholding only ever adds an accepted answer or full marks, so no mark can go down.
export async function decideDispute(disputeId: string, _previous: DisputeFormState, formData: FormData): Promise<DisputeFormState> {
  const member = await requireMember("examiner", "institution_admin");
  const dispute = await getDispute(member, disputeId);
  const exam = await getExam(member, dispute.examId);
  if (!can(member, "exam.edit", exam)) return { status: "error", message: "Only the examiner who set this exam or an institution admin can decide." };
  if (dispute.status !== "open") return { status: "error", message: "This challenge is already decided." };
  const parsed = decisionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the decision and try again." };
  const input = parsed.data;
  if (dispute.question?.variant_key && (input.decision === "accept_both" || input.decision === "full_marks")) {
    return {
      status: "error",
      message: "This candidate had an AI variant of the question, so a question-wide key change would not reach them. Reject with a reason, or change their mark in Marking.",
    };
  }

  if (input.decision === "raise_mark") {
    const problem = await raiseWrittenMark(member, exam, dispute, input.marks, input.reason);
    if (problem) return { status: "error", message: problem };
  } else if (input.decision !== "reject" && dispute.question_id) {
    const problem = await applyKeyFix(member, exam, { question_id: dispute.question_id, choice: input.decision, option: input.option, reason: input.reason });
    if (problem) return { status: "error", message: problem };
  }
  unwrap(
    await db()
      .from("disputes")
      .update({ status: input.decision === "reject" ? "rejected" : "upheld", decision_reason: input.reason, decided_by: member.user.id, decided_at: new Date().toISOString() })
      .eq("id", dispute.id)
      .eq("institution_id", member.institution.id),
  );
  await recordAudit(member, "dispute.decided", dispute.id, { decision: input.decision, reason: input.reason });
  revalidatePath("/disputes");
  redirect("/disputes");
}
