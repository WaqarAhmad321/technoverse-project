"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { can, requireMember, type Member } from "@/lib/access";
import { recordAudit } from "@/lib/audit";
import { db, unwrap } from "@/lib/db";
import type { Exam, Question } from "@/lib/exam-types";
import { isModeratorAvailable, moderatePaper, readModeration, type ModeratedQuestion, type Moderation } from "../ai/moderator";
import { getExam } from "./data";

export type ModeratorState = { status: "error"; message: string } | { status: "done"; open: number } | null;

const SYLLABUS_MAX = 6000;
const syllabusSchema = z.string().trim().max(SYLLABUS_MAX, `Keep the syllabus under ${SYLLABUS_MAX} characters.`);

async function loadPaper(member: Member, examId: string): Promise<ModeratedQuestion[]> {
  const links: { question_id: string; position: number }[] = unwrap(
    await db().from("exam_questions").select("question_id, position").eq("institution_id", member.institution.id).eq("exam_id", examId).order("position"),
  );
  if (links.length === 0) return [];
  const questions: Question[] = unwrap(
    await db().from("questions").select("*").eq("institution_id", member.institution.id).in("id", links.map((link) => link.question_id)),
  );
  const byId = new Map(questions.map((question) => [question.id, question]));
  return links.flatMap((link, index) => {
    const question = byId.get(link.question_id);
    return question ? [{ ...question, position: index + 1 }] : [];
  });
}

async function saveModeration(member: Member, exam: Exam, moderation: Moderation): Promise<void> {
  unwrap(
    await db()
      .from("exams")
      .update({ settings: { ...exam.settings, moderation } })
      .eq("id", exam.id)
      .eq("institution_id", member.institution.id),
  );
  revalidatePath(`/manage/${exam.id}`);
}

export async function runModerator(examId: string, _previous: ModeratorState, formData: FormData): Promise<ModeratorState> {
  const member = await requireMember("examiner", "institution_admin");
  const exam = await getExam(member, examId);
  if (!can(member, "exam.edit", exam)) return { status: "error", message: "Only the examiner who set this exam can moderate it." };
  if (!isModeratorAvailable()) return { status: "error", message: "The AI moderator is unavailable: the AI key is not set on this server. The checklist still works." };
  const syllabus = syllabusSchema.safeParse(formData.get("syllabus") ?? "");
  if (!syllabus.success) return { status: "error", message: syllabus.error.issues[0]?.message ?? "Check the syllabus." };

  const paper = await loadPaper(member, exam.id);
  if (paper.length === 0) return { status: "error", message: "Add questions to the paper first." };
  try {
    const flags = await moderatePaper(paper, syllabus.data);
    await saveModeration(member, exam, { ran_at: new Date().toISOString(), syllabus: syllabus.data, flags });
    return { status: "done", open: flags.length };
  } catch (error) {
    console.error("AI paper moderation failed", error);
    return { status: "error", message: "The AI moderator could not read the paper just now. Try again in a minute." };
  }
}

export async function dismissModeratorFlag(examId: string, index: number): Promise<void> {
  const member = await requireMember("examiner", "institution_admin");
  const exam = await getExam(member, examId);
  if (!can(member, "exam.edit", exam)) return;
  const moderation = readModeration(exam);
  if (!moderation) return;
  const dismissed = moderation.flags[index];
  if (!dismissed) return;
  const flags = moderation.flags.map((flag, at) => (at === index ? { ...flag, dismissed: true } : flag));
  await saveModeration(member, exam, { ...moderation, flags });
  await recordAudit(member, "moderator.flag_dismissed", exam.id, { question_id: dismissed.question_id, kind: dismissed.kind, note: dismissed.note });
}
