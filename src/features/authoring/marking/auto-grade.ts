import "server-only";
import type { Member } from "@/lib/access";
import { db, unwrap } from "@/lib/db";
import { answerCounts, isAttemptFinished } from "@/lib/exam-rules";
import type { Answer, AttemptQuestion, KeyFix } from "@/lib/exam-types";
import { scoreObjective } from "../scoring";
import type { MarkingAttempt } from "./data";

export type MarkingProgress = { attempts: number; objectiveMarked: number; writtenToMark: number };

type PaperRow = Pick<AttemptQuestion, "attempt_id" | "question_id" | "kind" | "marks" | "multiple_rule" | "answer_key" | "variant_key">;
type AnswerRow = Pick<Answer, "attempt_id" | "question_id" | "response" | "received_at">;

// Idempotent: the same attempts give the same grade rows, upserted on (attempt_id, question_id).
// Written questions are never touched here, so a manual mark always survives a re-run.
export async function autoGradeObjective(member: Member, examId: string, attempts: MarkingAttempt[]): Promise<MarkingProgress> {
  const now = new Date();
  const finished = attempts.filter((attempt) => isAttemptFinished(attempt, now));
  if (finished.length === 0) return { attempts: 0, objectiveMarked: 0, writtenToMark: 0 };
  const attemptIds = finished.map((attempt) => attempt.id);
  const scope = member.institution.id;

  const [paper, answers, fixes]: [PaperRow[], AnswerRow[], KeyFix[]] = await Promise.all([
    db().from("attempt_questions").select("attempt_id, question_id, kind, marks, multiple_rule, answer_key, variant_key").eq("institution_id", scope).in("attempt_id", attemptIds).then(unwrap),
    db().from("answers").select("attempt_id, question_id, response, received_at").eq("institution_id", scope).in("attempt_id", attemptIds).then(unwrap),
    db().from("key_fixes").select("*").eq("institution_id", scope).eq("exam_id", examId).order("created_at", { ascending: true }).then(unwrap),
  ]);

  const attemptById = new Map(finished.map((attempt) => [attempt.id, attempt]));
  const answerByKey = new Map(answers.map((answer) => [`${answer.attempt_id}:${answer.question_id}`, answer]));
  const fixByQuestion = new Map(fixes.map((fix) => [fix.question_id, fix]));

  const objective = paper.filter((row) => row.kind !== "written");
  const grades = objective.map((row) => {
    const answer = answerByKey.get(`${row.attempt_id}:${row.question_id}`);
    const attempt = attemptById.get(row.attempt_id);
    const counted = answer && attempt && answerCounts(answer, attempt) ? answer.response : null;
    return {
      user_id: member.user.id,
      institution_id: scope,
      attempt_id: row.attempt_id,
      question_id: row.question_id,
      // A key fix is about the original wording; an AI version carries its own checked key.
      marks_awarded: scoreObjective(row, counted, row.variant_key ? undefined : fixByQuestion.get(row.question_id)),
      source: "auto",
    };
  });
  if (grades.length > 0) unwrap(await db().from("grades").upsert(grades, { onConflict: "attempt_id,question_id" }));

  return { attempts: finished.length, objectiveMarked: grades.length, writtenToMark: paper.length - objective.length };
}
