"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { can, requireMember } from "@/lib/access";
import { requireUser } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { db, unwrap } from "@/lib/db";
import { approvePendingCredit, restartSandbox, startAttempt } from "./attempts";
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
  const member = await requireMember("examiner", "institution_admin", "controller");
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

const prefsSchema = z.object({
  font_scale: z.enum(["normal", "large", "larger"]),
  contrast: z.enum(["normal", "high"]),
  layout: z.enum(["one_at_a_time", "all_on_one_page"]),
});

export async function savePreferences(prefs: unknown): Promise<void> {
  const user = await requireUser();
  const parsed = prefsSchema.safeParse(prefs);
  if (!parsed.success) return;
  unwrap(
    await db()
      .from("preferences")
      .upsert({ user_id: user.id, ...parsed.data, updated_at: new Date().toISOString() }, { onConflict: "user_id" }),
  );
}

export async function restartPreview(formData: FormData): Promise<void> {
  const member = await requireMember("examiner", "institution_admin");
  const examId = z.uuid().safeParse(formData.get("examId"));
  if (!examId.success) redirect("/manage");
  await restartSandbox(member, examId.data);
  redirect(`/exams/${examId.data}/take?preview=1`);
}

const MAX_CREDIT_SECONDS = 60 * 60;

export async function approveCredit(formData: FormData): Promise<void> {
  const member = await requireMember("examiner", "institution_admin", "controller");
  const parsed = z
    .object({ attemptId: z.uuid(), examId: z.uuid(), seconds: z.coerce.number().int().min(1).max(MAX_CREDIT_SECONDS) })
    .safeParse({ attemptId: formData.get("attemptId"), examId: formData.get("examId"), seconds: formData.get("seconds") });
  if (!parsed.success) return;
  const exam = await loadExamForStaff(member, parsed.data.examId);
  if (!can(member, "exam.monitor", exam)) return;
  await approvePendingCredit(member, parsed.data.attemptId, parsed.data.seconds);
  await recordAudit(member, "credit.granted", parsed.data.attemptId, { seconds: parsed.data.seconds });
  revalidatePath(`/monitor/${exam.id}`);
}
