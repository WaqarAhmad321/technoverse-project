"use server";

import { revalidatePath } from "next/cache";
import { requireMember } from "@/lib/access";
import { getExam } from "../exams/data";
import { autoGradeObjective } from "./auto-grade";
import { listFinishedAttempts } from "./data";

export async function markObjectiveAnswers(examId: string): Promise<void> {
  const member = await requireMember("examiner", "institution_admin");
  const exam = await getExam(member, examId);
  await autoGradeObjective(member, exam.id, await listFinishedAttempts(member, exam.id));
  revalidatePath(`/marking/${exam.id}`);
}
