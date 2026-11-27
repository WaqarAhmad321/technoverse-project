import "server-only";
import type { Member } from "@/lib/access";
import { db, unwrap } from "@/lib/db";

export type ApprovalKind = "paper" | "results";
export type ApprovalStatus = "pending" | "approved" | "returned";

export type Approval = {
  id: string;
  institution_id: string;
  exam_id: string;
  kind: ApprovalKind;
  status: ApprovalStatus;
  requested_by: string;
  decided_by: string | null;
  comment: string | null;
  decided_at: string | null;
  created_at: string;
};

export type ApprovalGate = { required: boolean; approval: Approval | null };

// Sign-off is needed once the institution has a Controller of Examinations who is not the requester:
// nobody approves their own paper or results.
export async function approvalGate(member: Member, examId: string, kind: ApprovalKind): Promise<ApprovalGate> {
  const [controllers, approval]: [{ member_id: string }[], Approval | null] = await Promise.all([
    db()
      .from("memberships")
      .select("member_id")
      .eq("institution_id", member.institution.id)
      .eq("role", "controller")
      .eq("active", true)
      .then(unwrap),
    db().from("approvals").select("*").eq("exam_id", examId).eq("kind", kind).maybeSingle().then(unwrap),
  ]);
  const required = controllers.some((row) => row.member_id !== member.user.id);
  return { required, approval };
}

export function isApproved(gate: ApprovalGate): boolean {
  return !gate.required || gate.approval?.status === "approved";
}

export const APPROVAL_BLOCK_MESSAGE: Record<ApprovalKind, string> = {
  paper: "This paper needs the controller's approval before it can be published. Send it for approval first.",
  results: "These results need the controller's sign-off before release. Send them for sign-off first.",
};

export function institutionCanPublish(member: Member): string | null {
  if (member.institution.status === "active") return null;
  return "Your institution is waiting for platform approval. You can set everything up; publishing opens once it is approved.";
}
