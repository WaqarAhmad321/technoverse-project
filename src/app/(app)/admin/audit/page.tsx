import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { TableSkeleton } from "@/components/skeletons";
import { EmptyState } from "@/components/states";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { loadAuditRows } from "@/features/people/audit-data";
import { VerifyChainButton } from "@/features/people/verify-chain-button";
import { Pagination } from "@/components/pagination";
import { requireMember } from "@/lib/access";
import { paginate } from "@/lib/pagination";
import { formatPkt } from "@/lib/format";

const ACTION_LABELS: Record<string, string> = {
  "role.changed": "Changed someone's roles",
  "invitation.sent": "Invited someone",
  "invitation.revoked": "Revoked an invitation",
  "invitation.accepted": "Accepted an invitation",
  "join.approved": "Approved a request to join",
  "join.declined": "Declined a request to join",
  "exam.published": "Published an exam",
  "key.fixed": "Corrected an answer key",
  "results.published": "Published results",
  "announcement.sent": "Sent an announcement",
  "credit.granted": "Gave time back after an outage",
  "approval.requested": "Sent for the controller's approval",
  "approval.decided": "Controller decided on an approval",
  "exam.quarantined": "Quarantined leaked questions",
  "exam.unpublished": "Unpublished an exam",
  "results.republished": "Issued updated results",
  "dispute.decided": "Decided a candidate's challenge",
};

function describe(action: string, payload: Record<string, unknown>): string {
  const label = ACTION_LABELS[action] ?? action;
  const detail = typeof payload.body === "string" ? `: “${payload.body}”` : typeof payload.reason === "string" ? `: ${payload.reason}` : "";
  return `${label}${detail}`;
}

type Member = Awaited<ReturnType<typeof requireMember>>;

async function AuditTable({ member, requestedPage }: { member: Member; requestedPage: string | string[] | undefined }) {
  const rows = await loadAuditRows(member);
  const shown = paginate(rows, requestedPage);
  if (rows.length === 0) {
    return <EmptyState message="Nothing recorded yet. Publishing an exam, fixing a key or changing a role adds an entry here." />;
  }
  return (
    <div className="overflow-x-auto rounded-3xl bg-card p-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>When</TableHead>
            <TableHead>Who</TableHead>
            <TableHead>What</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shown.rows.map(({ event, actorName }) => (
            <TableRow key={event.id}>
              <TableCell>{formatPkt(event.created_at)}</TableCell>
              <TableCell>{actorName}</TableCell>
              <TableCell className="whitespace-normal">{describe(event.action, event.payload)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Pagination page={shown} basePath="/admin/audit" noun="events" />
    </div>
  );
}

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ page?: string | string[] }> }) {
  const member = await requireMember("institution_admin", "controller", "observer");
  const { page: requestedPage } = await searchParams;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Audit log" description="Every powerful action, in order. Each entry is chained to the one before, so a changed entry shows up.">
        <VerifyChainButton />
      </PageHeader>
      <Suspense key={String(requestedPage ?? "1")} fallback={<TableSkeleton rows={10} columns={3} />}>
        <AuditTable member={member} requestedPage={requestedPage} />
      </Suspense>
    </div>
  );
}
