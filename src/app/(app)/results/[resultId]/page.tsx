import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { loadMyResult } from "@/features/delivery/data";
import { PageHeader } from "@/components/page-header";
import { requireMember } from "@/lib/access";
import { formatMarks } from "@/lib/format";

export default async function ResultPage({ params }: { params: Promise<{ resultId: string }> }) {
  const { resultId } = await params;
  const member = await requireMember("candidate");
  const { result, exam } = await loadMyResult(member, resultId);
  const lines = [...result.breakdown].sort((a, b) => a.position - b.position);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <PageHeader title={exam.title} description={`Version ${result.version}${result.reason ? `: ${result.reason}` : ""}`} />
      <p className="text-3xl font-semibold">
        {formatMarks(result.total)} <span className="text-lg font-normal text-muted-foreground">of {result.max_total}</span>
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Question</TableHead>
            <TableHead className="text-right">Marks</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.map((line) => (
            <TableRow key={line.question_id}>
              <TableCell>Q{line.position}</TableCell>
              <TableCell className="text-right">
                {formatMarks(line.marks_awarded)} of {line.marks}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="text-base text-muted-foreground">Verify code: <span className="font-mono">{result.verify_code}</span></p>
    </div>
  );
}
