import "server-only";
import { notFound } from "next/navigation";
import type { Member } from "@/lib/access";
import { db, unwrap } from "@/lib/db";
import { examPhase, type ExamPhase } from "@/lib/exam-rules";
import type { Exam, ExamQuestion, Question } from "@/lib/exam-types";

export type ExamRow = Exam & { phase: ExamPhase; enrolledCount: number; submittedCount: number };

const UUID = /^[0-9a-f-]{36}$/i;

function countByExam(rows: { exam_id: string }[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows) counts.set(row.exam_id, (counts.get(row.exam_id) ?? 0) + 1);
  return counts;
}

export async function listExams(member: Member): Promise<ExamRow[]> {
  const exams: Exam[] = unwrap(
    await db().from("exams").select("*").eq("institution_id", member.institution.id).order("opens_at", { ascending: false }),
  );
  const [enrollments, attempts]: { exam_id: string }[][] = await Promise.all([
    db().from("enrollments").select("exam_id").eq("institution_id", member.institution.id).then(unwrap),
    db()
      .from("attempts")
      .select("exam_id")
      .eq("institution_id", member.institution.id)
      .eq("is_sandbox", false)
      .in("status", ["submitted", "auto_submitted"])
      .then(unwrap),
  ]);
  const enrolled = countByExam(enrollments);
  const submitted = countByExam(attempts);
  const now = new Date();
  return exams.map((exam) => ({
    ...exam,
    phase: examPhase(exam, now),
    enrolledCount: enrolled.get(exam.id) ?? 0,
    submittedCount: submitted.get(exam.id) ?? 0,
  }));
}

export async function getExam(member: Member, examId: string): Promise<Exam> {
  if (!UUID.test(examId)) notFound();
  const exam: Exam | null = unwrap(
    await db().from("exams").select("*").eq("id", examId).eq("institution_id", member.institution.id).maybeSingle(),
  );
  if (!exam) notFound();
  return exam;
}

export type PaperQuestion = Pick<Question, "id" | "body" | "topic" | "difficulty" | "kind" | "marks"> & { position: number };

export async function listExamQuestions(member: Member, examId: string): Promise<PaperQuestion[]> {
  const links: Pick<ExamQuestion, "question_id" | "position">[] = unwrap(
    await db()
      .from("exam_questions")
      .select("question_id, position")
      .eq("institution_id", member.institution.id)
      .eq("exam_id", examId)
      .order("position", { ascending: true }),
  );
  if (links.length === 0) return [];
  const questions: Omit<PaperQuestion, "position">[] = unwrap(
    await db()
      .from("questions")
      .select("id, body, topic, difficulty, kind, marks")
      .eq("institution_id", member.institution.id)
      .in("id", links.map((link) => link.question_id)),
  );
  const byId = new Map(questions.map((question) => [question.id, question]));
  return links.flatMap((link) => {
    const question = byId.get(link.question_id);
    return question ? [{ ...question, position: link.position }] : [];
  });
}

// Real attempts only: a sandbox preview never locks the exam.
export async function countStartedAttempts(member: Member, examId: string): Promise<number> {
  const { count, error } = await db()
    .from("attempts")
    .select("id", { count: "exact", head: true })
    .eq("institution_id", member.institution.id)
    .eq("exam_id", examId)
    .eq("is_sandbox", false);
  if (error) throw new Error(`Database request failed: ${error.message}`);
  return count ?? 0;
}
