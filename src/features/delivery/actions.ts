"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { can, requireMember } from "@/lib/access";
import { recordAudit } from "@/lib/audit";
import { db, unwrap } from "@/lib/db";
import { startAttempt } from "./attempts";
import { loadExamForStaff } from "./data";

export async function startExam(formData: FormData): Promise<void> {
  const member = await requireMember("candidate");
  const examId = z.uuid().safeParse(formData.get("examId"));
  if (!examId.success) redirect("/exams");

  const outcome = await startAttempt(member, examId.data);
  if (outcome.kind === "refused") redirect(`/exams/${examId.data}?notice=${encodeURIComponent(outcome.reason)}`);
  redirect(`/exams/${examId.data}/take`);
}

export type AnnouncementState = { status: "sent" | "error"; message: string } | null;

const MAX_ANNOUNCEMENT_LENGTH = 500;
const announcementSchema = z.object({
  examId: z.uuid(),
  body: z.string().trim().min(1).max(MAX_ANNOUNCEMENT_LENGTH),
  questionPosition: z.coerce.number().int().positive().optional(),
});

export async function sendAnnouncement(_previous: AnnouncementState, formData: FormData): Promise<AnnouncementState> {
  const member = await requireMember("examiner", "institution_admin");
  const parsed = announcementSchema.safeParse({
    examId: formData.get("examId"),
    body: formData.get("body"),
    questionPosition: formData.get("questionPosition") || undefined,
  });
  if (!parsed.success) return { status: "error", message: "Write the announcement first (up to 500 characters)." };

  const exam = await loadExamForStaff(member, parsed.data.examId);
  if (!can(member, "exam.monitor", exam)) return { status: "error", message: "You cannot send announcements for this exam." };

  const announcement: { id: string } | null = unwrap(
    await db()
      .from("announcements")
      .insert({
        user_id: member.user.id,
        institution_id: member.institution.id,
        exam_id: exam.id,
        body: parsed.data.body,
        question_position: parsed.data.questionPosition ?? null,
      })
      .select("id")
      .single(),
  );
  await recordAudit(member, "announcement.sent", announcement?.id ?? null, { exam_id: exam.id, body: parsed.data.body });
  revalidatePath(`/monitor/${exam.id}`);
  return { status: "sent", message: "Sent. Candidates see it within a few seconds." };
}
