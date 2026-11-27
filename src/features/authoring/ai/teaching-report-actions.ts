"use server";

import { requireMember } from "@/lib/access";
import { isDemoMode } from "@/lib/demo";
import { getExam } from "../exams/data";
import { listFinishedAttempts } from "../marking/data";
import { loadKeyDoctor } from "../marking/key-doctor-data";
import { isAiConfigured } from "./second-marker";
import { writeTeachingReport, type TeachingReport } from "./teaching-report";

export type TeachingReportState = { status: "done"; report: TeachingReport; isRecorded: boolean } | { status: "error"; message: string } | null;

export async function createTeachingReport(examId: string): Promise<TeachingReportState> {
  const member = await requireMember("examiner", "institution_admin");
  const exam = await getExam(member, examId);
  if (!isAiConfigured()) return { status: "error", message: "The AI is not set up on this server yet. The statistics below still work." };
  const doctor = await loadKeyDoctor(member, exam.id, await listFinishedAttempts(member, exam.id));
  if (doctor.analytics.length === 0) return { status: "error", message: "No submitted answers to read yet." };
  try {
    return { status: "done", report: await writeTeachingReport(exam.title, doctor.analytics), isRecorded: isDemoMode() };
  } catch (error) {
    console.error("Teaching report failed", error);
    return { status: "error", message: "The AI could not write the report just now. Try again in a minute." };
  }
}
