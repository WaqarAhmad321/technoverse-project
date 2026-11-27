"use server";

import { revalidatePath } from "next/cache";
import { can, requireMember } from "@/lib/access";
import { APPROVAL_BLOCK_MESSAGE, approvalGate, institutionCanPublish, isApproved } from "@/lib/approvals";
import { recordAudit } from "@/lib/audit";
import { db, unwrap } from "@/lib/db";
import { runChecklist } from "./checklist";
import { countStartedAttempts, getExam, loadReview } from "./data";

export type PublishState = { status: "error"; message: string } | { status: "done"; message: string } | null;

const NOT_YOURS = "Only the examiner who set this exam or an institution admin can publish it.";

function refresh(examId: string): void {
  revalidatePath("/manage");
  revalidatePath(`/manage/${examId}`);
  revalidatePath("/exams");
}

// The server re-runs the same checklist the screen shows, so a stale page cannot publish a broken exam.
export async function publishExam(examId: string): Promise<PublishState> {
  const member = await requireMember("examiner", "institution_admin");
  const exam = await getExam(member, examId);
  if (!can(member, "exam.edit", exam)) return { status: "error", message: NOT_YOURS };

  const checklist = runChecklist(await loadReview(member, exam));
  const failing = checklist.lines.find((line) => !line.ok);
  if (failing) return { status: "error", message: `Not published: ${failing.text}.` };
  const institutionBlock = institutionCanPublish(member);
  if (institutionBlock) return { status: "error", message: institutionBlock };
  if (!isApproved(await approvalGate(member, exam.id, "paper"))) return { status: "error", message: APPROVAL_BLOCK_MESSAGE.paper };

  const publishedAt = new Date().toISOString();
  const changed: { id: string }[] = unwrap(
    await db()
      .from("exams")
      .update({ status: "published", published_at: publishedAt })
      .eq("id", exam.id)
      .eq("institution_id", member.institution.id)
      .eq("status", "draft")
      .select("id"),
  );
  if (changed.length > 0) {
    await recordAudit(member, "exam.published", exam.id, { title: exam.title, total_marks: exam.total_marks, published_at: publishedAt });
  }
  refresh(exam.id);
  return { status: "done", message: "Published. Enrolled candidates can see it now." };
}

export async function unpublishExam(examId: string): Promise<PublishState> {
  const member = await requireMember("examiner", "institution_admin");
  const exam = await getExam(member, examId);
  if (!can(member, "exam.edit", exam)) return { status: "error", message: NOT_YOURS };
  if ((await countStartedAttempts(member, exam.id)) > 0) {
    return { status: "error", message: "Candidates have already started, so the exam stays published." };
  }

  const changed: { id: string }[] = unwrap(
    await db()
      .from("exams")
      .update({ status: "draft", published_at: null })
      .eq("id", exam.id)
      .eq("institution_id", member.institution.id)
      .eq("status", "published")
      .select("id"),
  );
  if (changed.length > 0) await recordAudit(member, "exam.unpublished", exam.id, { title: exam.title });
  refresh(exam.id);
  return { status: "done", message: "Back to draft. Candidates no longer see it." };
}
