"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { can, requireMember, type Member } from "@/lib/access";
import { db, unwrap } from "@/lib/db";
import type { Exam } from "@/lib/exam-types";
import { fromPakistanInputValue } from "../format";
import { countStartedAttempts, getExam } from "./data";
import { examSchema, readExamForm, type ExamInput } from "./schema";

export type ExamFormState = { status: "error"; message: string } | { status: "saved" } | null;

const NOT_YOURS = "Only the examiner who set this exam or an institution admin can change it.";

function toColumns(input: ExamInput) {
  return {
    title: input.title,
    instructions: input.instructions,
    opens_at: fromPakistanInputValue(input.opens_at).toISOString(),
    closes_at: fromPakistanInputValue(input.closes_at).toISOString(),
    duration_minutes: input.duration_minutes,
    total_marks: input.total_marks,
    shuffle_questions: input.shuffle_questions,
    shuffle_options: input.shuffle_options,
  };
}

export async function createExam(_previous: ExamFormState, formData: FormData): Promise<ExamFormState> {
  const member = await requireMember("examiner", "institution_admin");
  const parsed = examSchema.safeParse(readExamForm(formData));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the exam and try again." };

  const created: { id: string } | null = unwrap(
    await db()
      .from("exams")
      .insert({ ...toColumns(parsed.data), user_id: member.user.id, institution_id: member.institution.id, status: "draft" })
      .select("id")
      .single(),
  );
  revalidatePath("/manage");
  redirect(`/manage/${created?.id ?? ""}?tab=questions`);
}

function lockedMessage(started: number): string {
  return `${started} ${started === 1 ? "candidate has" : "candidates have"} started; questions and timing are locked.`;
}

function timingChanged(exam: Exam, next: ReturnType<typeof toColumns>): boolean {
  return (
    new Date(exam.opens_at).getTime() !== new Date(next.opens_at).getTime() ||
    new Date(exam.closes_at).getTime() !== new Date(next.closes_at).getTime() ||
    exam.duration_minutes !== next.duration_minutes ||
    exam.total_marks !== next.total_marks ||
    exam.shuffle_questions !== next.shuffle_questions ||
    exam.shuffle_options !== next.shuffle_options
  );
}

export async function updateExam(examId: string, _previous: ExamFormState, formData: FormData): Promise<ExamFormState> {
  const member = await requireMember("examiner", "institution_admin");
  const exam = await getExam(member, examId);
  if (!can(member, "exam.edit", exam)) return { status: "error", message: NOT_YOURS };

  const parsed = examSchema.safeParse(readExamForm(formData));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the exam and try again." };
  const columns = toColumns(parsed.data);

  const started = await countStartedAttempts(member, exam.id);
  if (started > 0 && timingChanged(exam, columns)) {
    return { status: "error", message: `${lockedMessage(started)} You can still change the title and instructions.` };
  }

  unwrap(await db().from("exams").update(columns).eq("id", exam.id).eq("institution_id", member.institution.id));
  revalidatePath("/manage");
  revalidatePath(`/manage/${exam.id}`);
  return { status: "saved" };
}

async function editablePaper(examId: string): Promise<{ member: Member; exam: Exam } | null> {
  const member = await requireMember("examiner", "institution_admin");
  const [exam, started] = await Promise.all([getExam(member, examId), countStartedAttempts(member, examId)]);
  if (!can(member, "exam.edit", exam) || started > 0) return null;
  return { member, exam };
}

async function positions(member: Member, examId: string): Promise<{ id: string; question_id: string; position: number }[]> {
  return unwrap(
    await db()
      .from("exam_questions")
      .select("id, question_id, position")
      .eq("institution_id", member.institution.id)
      .eq("exam_id", examId)
      .order("position", { ascending: true }),
  );
}

async function writeOrder(member: Member, rows: { id: string }[]): Promise<void> {
  await Promise.all(
    rows.map((row, index) =>
      db().from("exam_questions").update({ position: index + 1 }).eq("id", row.id).eq("institution_id", member.institution.id).then(unwrap),
    ),
  );
}

export async function addQuestionToExam(examId: string, questionId: string): Promise<void> {
  const editable = await editablePaper(examId);
  if (!editable) return;
  const { member, exam } = editable;
  const [question, current]: [{ id: string } | null, { position: number }[]] = await Promise.all([
    db().from("questions").select("id").eq("id", questionId).eq("institution_id", member.institution.id).maybeSingle().then(unwrap),
    positions(member, exam.id),
  ]);
  if (!question) return;
  const last = current.at(-1)?.position ?? 0;
  unwrap(
    await db()
      .from("exam_questions")
      .upsert(
        { user_id: member.user.id, institution_id: member.institution.id, exam_id: exam.id, question_id: question.id, position: last + 1 },
        { onConflict: "exam_id,question_id", ignoreDuplicates: true },
      ),
  );
  revalidatePath(`/manage/${exam.id}`);
}

export async function removeQuestionFromExam(examId: string, questionId: string): Promise<void> {
  const editable = await editablePaper(examId);
  if (!editable) return;
  const { member, exam } = editable;
  unwrap(
    await db()
      .from("exam_questions")
      .delete()
      .eq("institution_id", member.institution.id)
      .eq("exam_id", exam.id)
      .eq("question_id", questionId),
  );
  await writeOrder(member, await positions(member, exam.id));
  revalidatePath(`/manage/${exam.id}`);
}

export async function moveQuestionInExam(examId: string, questionId: string, step: -1 | 1): Promise<void> {
  const editable = await editablePaper(examId);
  if (!editable) return;
  const { member, exam } = editable;
  const current = await positions(member, exam.id);
  const from = current.findIndex((row) => row.question_id === questionId);
  const to = from + step;
  if (from < 0 || to < 0 || to >= current.length) return;
  const reordered = current.map((row, index) => (index === from ? current[to] : index === to ? current[from] : row));
  await writeOrder(member, reordered);
  revalidatePath(`/manage/${exam.id}`);
}
