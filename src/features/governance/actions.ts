"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { can, requireMember } from "@/lib/access";
import type { ApprovalKind } from "@/lib/approvals";
import { recordAudit } from "@/lib/audit";
import { db, unwrap } from "@/lib/db";
import type { Exam } from "@/lib/exam-types";

const kindSchema = z.enum(["paper", "results"]);

async function examInInstitution(institutionId: string, examId: string): Promise<Exam | null> {
  return unwrap(await db().from("exams").select("*").eq("id", examId).eq("institution_id", institutionId).maybeSingle());
}

function refreshFor(examId: string): void {
  revalidatePath("/approvals");
  revalidatePath(`/manage/${examId}`);
  revalidatePath(`/marking/${examId}`);
}

// The examiner asks; sending again after a "sent back" starts a fresh review.
export async function requestApproval(examId: string, kind: ApprovalKind): Promise<void> {
  const member = await requireMember("examiner", "institution_admin");
  if (!kindSchema.safeParse(kind).success) return;
  const exam = await examInInstitution(member.institution.id, examId);
  if (!exam || !can(member, kind === "paper" ? "exam.edit" : "results.publish", exam)) return;

  unwrap(
    await db()
      .from("approvals")
      .upsert(
        {
          user_id: member.user.id,
          institution_id: member.institution.id,
          exam_id: exam.id,
          kind,
          status: "pending",
          requested_by: member.user.id,
          decided_by: null,
          decided_at: null,
          comment: null,
          created_at: new Date().toISOString(),
        },
        { onConflict: "exam_id,kind" },
      ),
  );
  await recordAudit(member, "approval.requested", exam.id, { kind, title: exam.title });
  refreshFor(exam.id);
}

export type DecisionState = { status: "done" | "error"; message: string } | null;

const decisionSchema = z
  .object({
    approvalId: z.uuid(),
    decision: z.enum(["approve", "return"]),
    comment: z.string().trim().max(1000),
  })
  .refine((value) => value.decision === "approve" || value.comment.length > 0, { message: "comment" });

export async function decideApproval(_previous: DecisionState, formData: FormData): Promise<DecisionState> {
  const member = await requireMember("controller");
  const parsed = decisionSchema.safeParse({
    approvalId: formData.get("approvalId"),
    decision: formData.get("decision"),
    comment: formData.get("comment") ?? "",
  });
  if (!parsed.success) return { status: "error", message: "To send it back, write what needs to change." };

  const approval: { id: string; exam_id: string; kind: string; status: string } | null = unwrap(
    await db()
      .from("approvals")
      .select("id, exam_id, kind, status")
      .eq("id", parsed.data.approvalId)
      .eq("institution_id", member.institution.id)
      .maybeSingle(),
  );
  if (!approval) return { status: "error", message: "That request no longer exists." };
  const exam = await examInInstitution(member.institution.id, approval.exam_id);
  if (!exam) return { status: "error", message: "That exam no longer exists." };
  const action = approval.kind === "paper" ? "paper.approve" : "results.approve";
  if (!can(member, action, exam)) return { status: "error", message: "You set this exam, so another controller has to decide." };

  const status = parsed.data.decision === "approve" ? "approved" : "returned";
  unwrap(
    await db()
      .from("approvals")
      .update({ status, comment: parsed.data.comment || null, decided_by: member.user.id, decided_at: new Date().toISOString() })
      .eq("id", approval.id),
  );
  await recordAudit(member, "approval.decided", exam.id, { kind: approval.kind, decision: status, comment: parsed.data.comment });
  refreshFor(exam.id);
  return {
    status: "done",
    message: status === "approved" ? `Approved. The examiner can ${approval.kind === "paper" ? "publish the exam" : "release the results"} now.` : "Sent back with your note.",
  };
}
