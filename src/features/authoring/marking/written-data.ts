import "server-only";
import type { Member } from "@/lib/access";
import { db, unwrap } from "@/lib/db";
import { isAttemptFinished } from "@/lib/exam-rules";
import type { AttemptQuestion } from "@/lib/exam-types";
import type { MarkingAttempt } from "./data";

export type WrittenItem = Pick<AttemptQuestion, "attempt_id" | "question_id" | "body" | "rubric" | "marks"> & {
  rollNumber: string;
  answerText: string;
};

export type WrittenQueue = { next: WrittenItem | null; marked: number; total: number };

export async function loadWrittenQueue(member: Member, attempts: MarkingAttempt[]): Promise<WrittenQueue> {
  const finished = attempts.filter((attempt) => isAttemptFinished(attempt));
  if (finished.length === 0) return { next: null, marked: 0, total: 0 };
  const ids = finished.map((attempt) => attempt.id);
  const scope = member.institution.id;

  const [written, manual]: [Pick<AttemptQuestion, "attempt_id" | "question_id" | "body" | "rubric" | "marks">[], { attempt_id: string; question_id: string }[]] =
    await Promise.all([
      db().from("attempt_questions").select("attempt_id, question_id, body, rubric, marks").eq("institution_id", scope).eq("kind", "written").in("attempt_id", ids).then(unwrap),
      db().from("grades").select("attempt_id, question_id").eq("institution_id", scope).eq("source", "manual").in("attempt_id", ids).then(unwrap),
    ]);
  const done = new Set(manual.map((grade) => `${grade.attempt_id}:${grade.question_id}`));
  const order = new Map(ids.map((id, index) => [id, index]));
  const pending = written
    .filter((row) => !done.has(`${row.attempt_id}:${row.question_id}`))
    .sort((a, b) => (order.get(a.attempt_id) ?? 0) - (order.get(b.attempt_id) ?? 0));
  const first = pending[0];
  if (!first) return { next: null, marked: written.length, total: written.length };

  const answer: { response: { text?: string } } | null = unwrap(
    await db().from("answers").select("response").eq("institution_id", scope).eq("attempt_id", first.attempt_id).eq("question_id", first.question_id).maybeSingle(),
  );
  const attempt = finished.find((row) => row.id === first.attempt_id);
  return {
    next: { ...first, rollNumber: attempt?.candidate?.roll_number ?? "unknown", answerText: answer?.response.text ?? "" },
    marked: written.length - pending.length,
    total: written.length,
  };
}
