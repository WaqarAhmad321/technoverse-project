import "server-only";
import { notFound } from "next/navigation";
import type { Member } from "@/lib/access";
import { db, unwrap } from "@/lib/db";
import type { Difficulty, Question, QuestionKind } from "@/lib/exam-types";

export type BankFilters = { topic?: string; difficulty?: Difficulty; kind?: QuestionKind; q?: string };
export type BankRow = Question & { examTitles: string[] };

export async function listQuestions(member: Member, filters: BankFilters = {}): Promise<BankRow[]> {
  let query = db().from("questions").select("*").eq("institution_id", member.institution.id);
  if (filters.topic) query = query.eq("topic", filters.topic);
  if (filters.difficulty) query = query.eq("difficulty", filters.difficulty);
  if (filters.kind) query = query.eq("kind", filters.kind);
  if (filters.q) query = query.ilike("body", `%${filters.q.replace(/[%_]/g, "")}%`);
  const questions: Question[] = unwrap(await query.order("created_at", { ascending: false }));
  const usage = await examTitlesByQuestion(member);
  return questions.map((question) => ({ ...question, examTitles: usage.get(question.id) ?? [] }));
}

export async function examTitlesByQuestion(member: Member): Promise<Map<string, string[]>> {
  const [links, exams]: [{ question_id: string; exam_id: string }[], { id: string; title: string }[]] = await Promise.all([
    db().from("exam_questions").select("question_id, exam_id").eq("institution_id", member.institution.id).then(unwrap),
    db().from("exams").select("id, title").eq("institution_id", member.institution.id).then(unwrap),
  ]);
  const titles = new Map(exams.map((exam) => [exam.id, exam.title]));
  const usage = new Map<string, string[]>();
  for (const link of links) {
    usage.set(link.question_id, [...(usage.get(link.question_id) ?? []), titles.get(link.exam_id) ?? "an exam"]);
  }
  return usage;
}

export async function listTopics(member: Member): Promise<string[]> {
  const rows: { topic: string }[] = unwrap(
    await db().from("questions").select("topic").eq("institution_id", member.institution.id),
  );
  return [...new Set(rows.map((row) => row.topic))].sort();
}

export async function getQuestion(member: Member, questionId: string): Promise<BankRow> {
  if (!/^[0-9a-f-]{36}$/i.test(questionId)) notFound();
  const question: Question | null = unwrap(
    await db().from("questions").select("*").eq("id", questionId).eq("institution_id", member.institution.id).maybeSingle(),
  );
  if (!question) notFound();
  const usage = await examTitlesByQuestion(member);
  return { ...question, examTitles: usage.get(question.id) ?? [] };
}
