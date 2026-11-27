import { ChevronRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/states";
import { StatusDot, type StatusTone } from "@/components/status-dot";
import { loadApprovals, type ApprovalRow } from "@/features/governance/data";
import { requireMember } from "@/lib/access";
import type { ApprovalStatus } from "@/lib/approvals";
import { formatPkt } from "@/lib/format";

const STATUS: Record<ApprovalStatus, { tone: StatusTone; label: string }> = {
  pending: { tone: "live", label: "Waiting for you" },
  approved: { tone: "ready", label: "Approved" },
  returned: { tone: "warn", label: "Sent back" },
};

const KIND_LABEL = { paper: "Exam paper", results: "Results" } as const;

function Row({ row }: { row: ApprovalRow }) {
  const status = STATUS[row.approval.status];
  return (
    <li>
      <Link
        href={`/approvals/${row.approval.id}`}
        className="group flex min-h-16 items-center gap-4 rounded-xl px-4 py-3 transition-colors duration-200 ease-out hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <ShieldCheck aria-hidden className="size-5" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-base font-medium">
            {KIND_LABEL[row.approval.kind]} · {row.exam.title}
          </span>
          <span className="text-sm text-muted-foreground">
            From {row.requesterName} · {formatPkt(row.approval.created_at)}
          </span>
        </span>
        <StatusDot tone={status.tone}>{status.label}</StatusDot>
        <ChevronRight aria-hidden className="size-5 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
      </Link>
    </li>
  );
}

export default async function ApprovalsPage() {
  const member = await requireMember("controller");
  const rows = await loadApprovals(member);
  const waiting = rows.filter((row) => row.approval.status === "pending");
  const decided = rows.filter((row) => row.approval.status !== "pending");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Approvals" description="Papers and results that need your sign-off before they reach candidates. Nobody approves their own." />
      <section className="flex flex-col gap-3" aria-labelledby="waiting">
        <h2 id="waiting" className="text-xl font-medium">
          Waiting for you ({waiting.length})
        </h2>
        {waiting.length === 0 ? (
          <EmptyState message="Nothing is waiting. When an examiner sends a paper or results for sign-off, it appears here." />
        ) : (
          <ul className="flex flex-col gap-1 rounded-3xl bg-card p-2">{waiting.map((row) => <Row key={row.approval.id} row={row} />)}</ul>
        )}
      </section>
      {decided.length > 0 && (
        <section className="flex flex-col gap-3" aria-labelledby="decided">
          <h2 id="decided" className="text-xl font-medium">
            Decided
          </h2>
          <ul className="flex flex-col gap-1 rounded-3xl bg-card p-2">{decided.map((row) => <Row key={row.approval.id} row={row} />)}</ul>
        </section>
      )}
    </div>
  );
}
