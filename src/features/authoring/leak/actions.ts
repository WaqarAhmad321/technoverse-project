"use server";

import { requireMember } from "@/lib/access";
import { db, unwrap } from "@/lib/db";
import { getExam } from "../exams/data";
import { questionsInPaste, rankAttempts, type LeakMatch } from "./match";

export type LeakState = { found: number; total: number; matches: LeakMatch[] } | { error: string } | null;

const TOP_MATCHES = 5;
const MAX_PASTE_CHARS = 100_000;

export async function traceLeak(examId: string, _previous: LeakState, formData: FormData): Promise<LeakState> {
  const member = await requireMember("examiner", "institution_admin");
  const exam = await getExam(member, examId);
  const paste = String(formData.get("paste") ?? "").slice(0, MAX_PASTE_CHARS);
  if (paste.trim().length === 0) return { error: "Paste the leaked paper first." };

  const scope = member.institution.id;
  type PaperRow = { attempt_id: string; question_id: string; position: number; body: string };
  type AttemptRow = { id: string; candidate: { roll_number: string } | null };
  const [rowsResult, attemptsResult] = await Promise.all([
    db().from("attempt_questions").select("attempt_id, question_id, position, body, attempt:attempts!inner(exam_id, is_sandbox)").eq("institution_id", scope).eq("attempt.exam_id", exam.id).eq("attempt.is_sandbox", false),
    db().from("attempts").select("id, candidate:candidates(roll_number)").eq("institution_id", scope).eq("exam_id", exam.id).eq("is_sandbox", false),
  ]);
  const rows = unwrap(rowsResult) as unknown as PaperRow[];
  const attempts = unwrap(attemptsResult) as unknown as AttemptRow[];
  const bodies = new Map(rows.map((row) => [row.question_id, row.body]));
  const pasteOrder = questionsInPaste(paste, [...bodies].map(([question_id, body]) => ({ question_id, body })));
  if (pasteOrder.length === 0) return { error: "None of this exam's questions appear in the pasted text." };

  const leakAttempts = attempts.map((attempt) => ({
    attempt_id: attempt.id,
    roll: attempt.candidate?.roll_number ?? "unknown",
    order: rows.filter((row) => row.attempt_id === attempt.id).sort((a, b) => a.position - b.position).map((row) => row.question_id),
  }));
  return { found: pasteOrder.length, total: bodies.size, matches: rankAttempts(pasteOrder, leakAttempts).slice(0, TOP_MATCHES) };
}
