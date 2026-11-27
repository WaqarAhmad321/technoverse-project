import "server-only";
import type { Member } from "@/lib/access";
import { newVerifyCode } from "@/lib/codes";
import { db, unwrap } from "@/lib/db";
import { isAttemptFinished } from "@/lib/exam-rules";
import type { AttemptQuestion, Exam, Result, ResultLine } from "@/lib/exam-types";
import type { MarkingAttempt } from "./data";

export type ScoreRow = {
  attempt_id: string;
  candidate_id: string;
  name: string;
  roll: string;
  total: number;
  max_total: number;
  breakdown: ResultLine[];
};

const HUNDREDTHS = 100;
const PASS_SHARE = 0.33;

function round2(value: number): number {
  return Math.round(value * HUNDREDTHS) / HUNDREDTHS;
}

// Current totals from grades, one row per finished real attempt.
export async function computeScores(member: Member, exam: Exam, attempts: MarkingAttempt[]): Promise<ScoreRow[]> {
  const finished = attempts.filter((attempt) => isAttemptFinished(attempt) && attempt.candidate_id);
  if (finished.length === 0) return [];
  const ids = finished.map((attempt) => attempt.id);
  const scope = member.institution.id;
  const [paper, grades]: [Pick<AttemptQuestion, "attempt_id" | "question_id" | "position" | "marks">[], { attempt_id: string; question_id: string; marks_awarded: number }[]] =
    await Promise.all([
      db().from("attempt_questions").select("attempt_id, question_id, position, marks").eq("institution_id", scope).in("attempt_id", ids).then(unwrap),
      db().from("grades").select("attempt_id, question_id, marks_awarded").eq("institution_id", scope).in("attempt_id", ids).then(unwrap),
    ]);
  const awarded = new Map(grades.map((grade) => [`${grade.attempt_id}:${grade.question_id}`, Number(grade.marks_awarded)]));
  return finished.map((attempt) => {
    const breakdown = paper
      .filter((row) => row.attempt_id === attempt.id)
      .sort((a, b) => a.position - b.position)
      .map((row) => ({ position: row.position, question_id: row.question_id, marks: row.marks, marks_awarded: awarded.get(`${attempt.id}:${row.question_id}`) ?? 0 }));
    return {
      attempt_id: attempt.id,
      candidate_id: attempt.candidate_id ?? "",
      name: attempt.candidate?.full_name ?? "Unknown candidate",
      roll: attempt.candidate?.roll_number ?? "",
      total: round2(breakdown.reduce((sum, line) => sum + line.marks_awarded, 0)),
      max_total: exam.total_marks,
      breakdown,
    };
  });
}

export type ExamSummary = { count: number; average: number; median: number; highest: number; lowest: number; passRate: number; buckets: number[] };

const BUCKETS = 5;

export function summarize(scores: ScoreRow[], maxTotal: number): ExamSummary | null {
  if (scores.length === 0) return null;
  const totals = scores.map((score) => score.total).sort((a, b) => a - b);
  const middle = Math.floor(totals.length / 2);
  const median = totals.length % 2 ? totals[middle] : (totals[middle - 1] + totals[middle]) / 2;
  const buckets = Array.from({ length: BUCKETS }, () => 0);
  for (const total of totals) buckets[Math.min(BUCKETS - 1, Math.floor((total / maxTotal) * BUCKETS))] += 1;
  return {
    count: totals.length,
    average: round2(totals.reduce((sum, total) => sum + total, 0) / totals.length),
    median: round2(median),
    highest: totals[totals.length - 1],
    lowest: totals[0],
    passRate: totals.filter((total) => total >= maxTotal * PASS_SHARE).length / totals.length,
    buckets,
  };
}

export async function insertFirstResults(member: Member, exam: Exam, scores: ScoreRow[], publishedAt: string): Promise<void> {
  const rows = scores.map((score) => ({
    user_id: member.user.id,
    institution_id: member.institution.id,
    exam_id: exam.id,
    attempt_id: score.attempt_id,
    candidate_id: score.candidate_id,
    version: 1,
    total: score.total,
    max_total: score.max_total,
    breakdown: score.breakdown,
    reason: null,
    is_current: true,
    verify_code: newVerifyCode(),
    published_at: publishedAt,
  }));
  if (rows.length > 0) unwrap(await db().from("results").insert(rows));
}

// After publishing, a regrade adds version + 1 for every result whose total moved, and keeps the old row.
export async function reissueResults(member: Member, exam: Exam, attempts: MarkingAttempt[], reason: string): Promise<number> {
  if (!exam.results_published_at) return 0;
  const [scores, current]: [ScoreRow[], Result[]] = await Promise.all([
    computeScores(member, exam, attempts),
    db().from("results").select("*").eq("institution_id", member.institution.id).eq("exam_id", exam.id).eq("is_current", true).then(unwrap),
  ]);
  const byAttempt = new Map(current.map((result) => [result.attempt_id, result]));
  const changed = scores.flatMap((score) => {
    const old = byAttempt.get(score.attempt_id);
    return old && Number(old.total) !== score.total ? [{ score, old }] : [];
  });
  const now = new Date().toISOString();
  if (changed.length === 0) return 0;
  unwrap(await db().from("results").update({ is_current: false }).in("id", changed.map(({ old }) => old.id)));
  unwrap(
    await db().from("results").insert(
      changed.map(({ score, old }) => ({
        user_id: member.user.id,
        institution_id: member.institution.id,
        exam_id: exam.id,
        attempt_id: score.attempt_id,
        candidate_id: score.candidate_id,
        version: old.version + 1,
        total: score.total,
        max_total: score.max_total,
        breakdown: score.breakdown,
        reason,
        is_current: true,
        verify_code: newVerifyCode(),
        published_at: now,
      })),
    ),
  );
  return changed.length;
}
