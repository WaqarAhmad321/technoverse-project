import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/states";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { loadAuditRows } from "@/features/people/audit-data";
import { VerifyChainButton } from "@/features/people/verify-chain-button";
import { requireMember } from "@/lib/access";
import { formatPkt } from "@/lib/format";

const ACTION_LABELS: Record<string, string> = {
  "role.changed": "Changed someone's roles",
  "exam.published": "Published an exam",
  "key.fixed": "Corrected an answer key",
  "results.published": "Published results",
  "announcement.sent": "Sent an announcement",
  "credit.granted": "Gave time back after an outage",
};

function describe(action: string, payload: Record<string, unknown>): string {
  const label = ACTION_LABELS[action] ?? action;
  const detail = typeof payload.body === "string" ? `: “${payload.body}”` : typeof payload.reason === "string" ? `: ${payload.reason}` : "";
  return `${label}${detail}`;
}

export default async function AuditPage() {
  const member = await requireMember("institution_admin", "controller", "observer");
  const rows = await loadAuditRows(member);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Audit log" description="Every powerful action, in order. Each entry is chained to the one before, so a changed entry shows up.">
        <VerifyChainButton />
      </PageHeader>
      {rows.length === 0 ? (
        <EmptyState message="Nothing recorded yet. Publishing an exam, fixing a key or changing a role adds an entry here." />
      ) : (
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
              {rows.map(({ event, actorName }) => (
                <TableRow key={event.id}>
                  <TableCell>{formatPkt(event.created_at)}</TableCell>
                  <TableCell>{actorName}</TableCell>
                  <TableCell className="whitespace-normal">{describe(event.action, event.payload)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
