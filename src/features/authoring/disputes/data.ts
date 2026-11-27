import "server-only";
import { notFound } from "next/navigation";
import { myCandidateIds, type Member } from "@/lib/access";
import { db, unwrap } from "@/lib/db";
import type { AttemptQuestion, Dispute, Result } from "@/lib/exam-types";

const UUID = /^[0-9a-f-]{36}$/i;

export type DisputeRow = Dispute & { position: number; examTitle: string; roll: string };

export async function getMyResult(member: Member, resultId: string): Promise<Result & { examTitle: string }> {
  if (!UUID.test(resultId)) notFound();
  const mine = await myCandidateIds(member);
  const result: (Result & { exam: { title: string } | null }) | null = unwrap(
    await db().from("results").select("*, exam:exams(title)").eq("id", resultId).eq("institution_id", member.institution.id).in("candidate_id", mine).not("published_at", "is", null).maybeSingle(),
  );
  if (!result) notFound();
  return { ...result, examTitle: result.exam?.title ?? "Exam" };
}

export async function listDisputes(member: Member): Promise<DisputeRow[]> {
  const rows: (Dispute & { result: { breakdown: Result["breakdown"]; exam: { title: string } | null } | null; candidate: { roll_number: string } | null })[] = unwrap(
    await db()
      .from("disputes")
      .select("*, result:results(breakdown, exam:exams(title)), candidate:candidates(roll_number)")
      .eq("institution_id", member.institution.id)
      .order("created_at", { ascending: false }),
  );
  return rows.map((row) => ({
    ...row,
    position: row.result?.breakdown.find((line) => line.question_id === row.question_id)?.position ?? 0,
    examTitle: row.result?.exam?.title ?? "Exam",
    roll: row.candidate?.roll_number ?? "",
  }));
}

export type DisputeDetail = DisputeRow & {
  examId: string;
  question: Pick<AttemptQuestion, "body" | "options" | "answer_key" | "marks" | "kind" | "rubric">;
  attemptId: string;
  answerText: string;
  choices: string[];
  awarded: number;
};

export async function getDispute(member: Member, disputeId: string): Promise<DisputeDetail> {
  if (!UUID.test(disputeId)) notFound();
  const all = await listDisputes(member);
  const row = all.find((dispute) => dispute.id === disputeId);
  if (!row || !row.question_id) notFound();
  const result: Pick<Result, "attempt_id" | "exam_id" | "breakdown"> | null = unwrap(
    await db().from("results").select("attempt_id, exam_id, breakdown").eq("id", row.result_id).maybeSingle(),
  );
  if (!result) notFound();
  const [question, answer]: [DisputeDetail["question"] | null, { response: { choices?: string[]; text?: string } } | null] = await Promise.all([
    db().from("attempt_questions").select("body, options, answer_key, marks, kind, rubric").eq("attempt_id", result.attempt_id).eq("question_id", row.question_id).maybeSingle().then(unwrap),
    db().from("answers").select("response").eq("attempt_id", result.attempt_id).eq("question_id", row.question_id).maybeSingle().then(unwrap),
  ]);
  if (!question) notFound();
  return {
    ...row,
    examId: result.exam_id,
    attemptId: result.attempt_id,
    answerText: answer?.response.text ?? "",
    question,
    choices: answer?.response.choices ?? [],
    awarded: result.breakdown.find((line) => line.question_id === row.question_id)?.marks_awarded ?? 0,
  };
}
