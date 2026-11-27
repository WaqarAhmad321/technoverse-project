import "server-only";
import type { Member } from "@/lib/access";
import { db, unwrap } from "@/lib/db";
import { isAttemptFinished } from "@/lib/exam-rules";
import type { Answer, AttemptQuestion, ExamQuestion, KeyFix, QuestionOption } from "@/lib/exam-types";
import { runKeyDoctor, type DoctorAttempt, type DoctorFlag, type DoctorQuestion } from "../key-doctor";
import type { MarkingAttempt } from "./data";

export type KeyDoctorView = { open: (DoctorFlag & { options: QuestionOption[] })[]; fixes: KeyFix[] };

type SnapshotRow = Pick<AttemptQuestion, "attempt_id" | "question_id" | "kind" | "options" | "answer_key">;

export async function loadKeyDoctor(member: Member, examId: string, attempts: MarkingAttempt[]): Promise<KeyDoctorView> {
  const finished = attempts.filter((attempt) => isAttemptFinished(attempt));
  const ids = finished.map((attempt) => attempt.id);
  const scope = member.institution.id;
  if (ids.length === 0) return { open: [], fixes: [] };

  const [snapshots, answers, grades, links, fixes]: [
    SnapshotRow[],
    Pick<Answer, "attempt_id" | "question_id" | "response">[],
    { attempt_id: string; marks_awarded: number }[],
    Pick<ExamQuestion, "question_id" | "position">[],
    KeyFix[],
  ] = await Promise.all([
    db().from("attempt_questions").select("attempt_id, question_id, kind, options, answer_key").eq("institution_id", scope).in("attempt_id", ids).neq("kind", "written").then(unwrap),
    db().from("answers").select("attempt_id, question_id, response").eq("institution_id", scope).in("attempt_id", ids).then(unwrap),
    db().from("grades").select("attempt_id, marks_awarded").eq("institution_id", scope).in("attempt_id", ids).then(unwrap),
    db().from("exam_questions").select("question_id, position").eq("institution_id", scope).eq("exam_id", examId).then(unwrap),
    db().from("key_fixes").select("*").eq("institution_id", scope).eq("exam_id", examId).order("created_at", { ascending: true }).then(unwrap),
  ]);

  const position = new Map(links.map((link) => [link.question_id, link.position]));
  const questions = new Map<string, DoctorQuestion>();
  for (const row of snapshots) {
    if (questions.has(row.question_id)) continue;
    questions.set(row.question_id, {
      question_id: row.question_id,
      position: position.get(row.question_id) ?? 0,
      options: [...row.options].sort((a, b) => a.id.localeCompare(b.id)),
      answer_key: row.answer_key ?? [],
    });
  }

  const doctorAttempts = new Map<string, DoctorAttempt>(ids.map((id) => [id, { total: 0, choices: new Map() }]));
  for (const grade of grades) {
    const attempt = doctorAttempts.get(grade.attempt_id);
    if (attempt) attempt.total += Number(grade.marks_awarded);
  }
  for (const answer of answers) doctorAttempts.get(answer.attempt_id)?.choices.set(answer.question_id, answer.response.choices ?? []);

  const resolved = new Set(fixes.map((fix) => fix.question_id));
  const ordered = [...questions.values()].sort((a, b) => a.position - b.position);
  const open = runKeyDoctor(ordered, [...doctorAttempts.values()])
    .filter((flag) => flag.kind !== "too_few" && !resolved.has(flag.question_id))
    .map((flag) => ({ ...flag, options: questions.get(flag.question_id)?.options ?? [] }));
  return { open, fixes };
}
