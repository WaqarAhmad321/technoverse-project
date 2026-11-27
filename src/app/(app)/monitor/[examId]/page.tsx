import { notFound } from "next/navigation";
import { EmptyState } from "@/components/states";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { loadExamForStaff, loadMonitorRows, type MonitorRow } from "@/features/delivery/data";
import { PageHeader } from "@/features/delivery/page-header";
import { can, requireMember } from "@/lib/access";
import { formatPkt } from "@/lib/format";

function attemptState({ attempt, answeredCount }: MonitorRow): string {
  if (!attempt) return "Not started";
  if (attempt.status === "in_progress") return `In progress · ${answeredCount} answered`;
  if (attempt.status === "auto_submitted") return "Submitted automatically";
  return `Submitted ${attempt.submitted_at ? formatPkt(attempt.submitted_at) : ""}`;
}

export default async function MonitorPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;
  const member = await requireMember("examiner", "institution_admin");
  const exam = await loadExamForStaff(member, examId);
  if (!can(member, "exam.monitor", exam)) notFound();
  const rows = await loadMonitorRows(member, exam.id);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={exam.title} description="Live monitor. Connection signals are for review, not evidence." />
      {rows.length === 0 ? (
        <EmptyState message="Nobody is enrolled yet. Enroll candidates from the exam's setup page." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Roll</TableHead>
              <TableHead>Candidate</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.candidate.id}>
                <TableCell className="font-mono">{row.candidate.roll_number}</TableCell>
                <TableCell>{row.candidate.full_name}</TableCell>
                <TableCell>{attemptState(row)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
