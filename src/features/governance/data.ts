import "server-only";
import { notFound } from "next/navigation";
import type { Member } from "@/lib/access";
import type { Approval } from "@/lib/approvals";
import { db, unwrap } from "@/lib/db";
import type { Exam } from "@/lib/exam-types";

export type ApprovalRow = { approval: Approval; exam: Pick<Exam, "id" | "title" | "user_id" | "opens_at" | "total_marks">; requesterName: string; deciderName: string | null };

async function names(ids: string[]): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();
  const rows: { id: string; display_name: string }[] = unwrap(await db().from("profiles").select("id, display_name").in("id", ids));
  return new Map(rows.map((row) => [row.id, row.display_name]));
}

export async function loadApprovals(member: Member): Promise<ApprovalRow[]> {
  const approvals: Approval[] = unwrap(
    await db().from("approvals").select("*").eq("institution_id", member.institution.id).order("created_at", { ascending: false }),
  );
  if (approvals.length === 0) return [];
  const [exams, people]: [ApprovalRow["exam"][], Map<string, string>] = await Promise.all([
    db().from("exams").select("id, title, user_id, opens_at, total_marks").in("id", approvals.map((row) => row.exam_id)).then(unwrap),
    names([...new Set(approvals.flatMap((row) => [row.requested_by, row.decided_by ?? ""]).filter(Boolean))]),
  ]);
  return approvals.flatMap((approval) => {
    const exam = exams.find((row) => row.id === approval.exam_id);
    if (!exam) return [];
    return [{ approval, exam, requesterName: people.get(approval.requested_by) ?? "An examiner", deciderName: approval.decided_by ? (people.get(approval.decided_by) ?? null) : null }];
  });
}

export async function loadApproval(member: Member, approvalId: string): Promise<ApprovalRow> {
  const row = (await loadApprovals(member)).find((entry) => entry.approval.id === approvalId);
  if (!row) notFound();
  return row;
}

export type PaperLine = { position: number; body: string; kind: string; marks: number; topic: string; difficulty: string; options: { id: string; text: string }[]; key: string[] };

export async function loadPaperForReview(examId: string): Promise<PaperLine[]> {
  const links: { question_id: string; position: number }[] = unwrap(await db().from("exam_questions").select("question_id, position").eq("exam_id", examId));
  if (links.length === 0) return [];
  const questions: { id: string; body: string; kind: string; marks: number; topic: string; difficulty: string; options: { id: string; text: string }[]; answer_key: string[] | null }[] = unwrap(
    await db().from("questions").select("id, body, kind, marks, topic, difficulty, options, answer_key").in("id", links.map((link) => link.question_id)),
  );
  return links
    .flatMap((link) => {
      const question = questions.find((row) => row.id === link.question_id);
      return question ? [{ position: link.position, body: question.body, kind: question.kind, marks: question.marks, topic: question.topic, difficulty: question.difficulty, options: question.options, key: question.answer_key ?? [] }] : [];
    })
    .sort((a, b) => a.position - b.position);
}

export type ResultsPreview = { candidates: number; average: number; highest: number; lowest: number; passRate: number; maxTotal: number };

const PASS_SHARE = 0.33;

// What the candidates would get if released now, from the marks recorded so far.
export async function loadResultsPreview(exam: Pick<Exam, "id" | "total_marks">): Promise<ResultsPreview> {
  const attempts: { id: string }[] = unwrap(
    await db().from("attempts").select("id").eq("exam_id", exam.id).eq("is_sandbox", false).neq("status", "in_progress"),
  );
  const grades: { attempt_id: string; marks_awarded: number }[] =
    attempts.length === 0 ? [] : unwrap(await db().from("grades").select("attempt_id, marks_awarded").in("attempt_id", attempts.map((row) => row.id)));
  const totals = attempts.map((attempt) => grades.filter((grade) => grade.attempt_id === attempt.id).reduce((sum, grade) => sum + Number(grade.marks_awarded), 0));
  const count = totals.length;
  return {
    candidates: count,
    average: count === 0 ? 0 : totals.reduce((sum, value) => sum + value, 0) / count,
    highest: count === 0 ? 0 : Math.max(...totals),
    lowest: count === 0 ? 0 : Math.min(...totals),
    passRate: count === 0 ? 0 : totals.filter((value) => value >= exam.total_marks * PASS_SHARE).length / count,
    maxTotal: exam.total_marks,
  };
}
