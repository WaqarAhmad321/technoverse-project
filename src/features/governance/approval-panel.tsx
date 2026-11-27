import { ShieldCheck } from "lucide-react";
import { StatusDot } from "@/components/status-dot";
import { SubmitButton } from "@/components/submit-button";
import { requireMember } from "@/lib/access";
import { approvalGate, type ApprovalKind } from "@/lib/approvals";
import { formatPkt } from "@/lib/format";
import { requestApproval } from "./actions";

const WHAT: Record<ApprovalKind, { thing: string; ask: string; again: string }> = {
  paper: { thing: "paper", ask: "Send for approval", again: "Send for approval again" },
  results: { thing: "results", ask: "Send for sign-off", again: "Send for sign-off again" },
};

// Sits beside the publish button: what the Controller of Examinations has decided, and how to ask.
export async function ApprovalPanel({ examId, kind }: { examId: string; kind: ApprovalKind }) {
  const member = await requireMember();
  const gate = await approvalGate(member, examId, kind);
  if (!gate.required) return null;
  const words = WHAT[kind];
  const approval = gate.approval;

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-muted/60 p-4">
      <p className="flex items-center gap-2 text-base font-medium">
        <ShieldCheck aria-hidden className="size-5 text-primary" />
        Controller of Examinations
      </p>
      {!approval && <p className="text-base text-muted-foreground">This {words.thing} needs the controller&apos;s approval before it goes out.</p>}
      {approval?.status === "pending" && <StatusDot tone="live">Waiting for the controller since {formatPkt(approval.created_at)}</StatusDot>}
      {approval?.status === "approved" && (
        <StatusDot tone="ready">Approved {approval.decided_at ? formatPkt(approval.decided_at) : ""}{approval.comment ? `: “${approval.comment}”` : ""}</StatusDot>
      )}
      {approval?.status === "returned" && (
        <div className="flex flex-col gap-1">
          <StatusDot tone="warn">Sent back {approval.decided_at ? formatPkt(approval.decided_at) : ""}</StatusDot>
          {approval.comment && <p className="rounded-xl bg-card px-3 py-2 text-base">“{approval.comment}”</p>}
        </div>
      )}
      {(!approval || approval.status === "returned") && (
        <form action={requestApproval.bind(null, examId, kind)}>
          <SubmitButton variant="outline">{approval ? words.again : words.ask}</SubmitButton>
        </form>
      )}
    </div>
  );
}
