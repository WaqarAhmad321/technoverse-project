import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/page-header";
import { TableSkeleton } from "@/components/skeletons";
import { StatusDot } from "@/components/status-dot";
import { EmptyState } from "@/components/states";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { loadExaminerOversight } from "@/features/people/oversight-data";
import { requireMember, type Member } from "@/lib/access";
import { formatPkt } from "@/lib/format";

const REVIEW_UPHELD_DISPUTES = 2;

async function OversightTable({ member }: { member: Member }) {
  const examiners = await loadExaminerOversight(member);
  if (examiners.length === 0) {
    return <EmptyState message="No examiners yet. Invite one from People and their exams will show up here." />;
  }
  return (
    <div className="overflow-x-auto rounded-3xl bg-card p-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Examiner</TableHead>
            <TableHead>Exams (draft / live / closed)</TableHead>
            <TableHead>To mark</TableHead>
            <TableHead>Results released</TableHead>
            <TableHead>Key fixes</TableHead>
            <TableHead>Disputes (open / upheld / rejected)</TableHead>
            <TableHead>Integrity decided</TableHead>
            <TableHead>Last action</TableHead>
            <TableHead>Flag</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {examiners.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <Link href={`/manage?examiner=${row.id}`} className="font-medium underline-offset-4 hover:underline">
                  {row.name}
                </Link>
              </TableCell>
              <TableCell className="tabular-nums">
                {row.drafts} / {row.published} / {row.closed}
              </TableCell>
              <TableCell className="tabular-nums">{row.toMark}</TableCell>
              <TableCell className="tabular-nums">{row.resultsReleased}</TableCell>
              <TableCell className="tabular-nums">{row.keyFixes}</TableCell>
              <TableCell className="tabular-nums">
                {row.disputesOpen} / {row.disputesUpheld} / {row.disputesRejected}
              </TableCell>
              <TableCell className="tabular-nums">{row.integrityDecided}</TableCell>
              <TableCell>{row.lastActionAt ? formatPkt(row.lastActionAt) : "No activity yet"}</TableCell>
              <TableCell>
                {row.disputesUpheld >= REVIEW_UPHELD_DISPUTES ? <StatusDot tone="warn">Review</StatusDot> : <StatusDot tone="done">Fine</StatusDot>}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default async function OversightPage() {
  const member = await requireMember("institution_admin", "controller");
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Examiner oversight" description="What each examiner has set, marked, fixed and decided." />
      <p className="text-base text-muted-foreground">High upheld disputes or many key fixes mean a paper or marking needs a second look.</p>
      <Suspense fallback={<TableSkeleton rows={5} columns={9} />}>
        <OversightTable member={member} />
      </Suspense>
    </div>
  );
}
