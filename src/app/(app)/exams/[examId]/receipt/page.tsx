import { notFound } from "next/navigation";
import { loadMyExam } from "@/features/delivery/data";
import { PageHeader } from "@/features/delivery/page-header";
import { requireMember } from "@/lib/access";
import { formatPkt } from "@/lib/format";

export default async function ReceiptPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;
  const member = await requireMember("candidate");
  const { exam, attempt } = await loadMyExam(member, examId);
  if (!attempt?.receipt_code || !attempt.submitted_at) notFound();

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <PageHeader title="Your submission counted" description={exam.title} />
      <dl className="flex flex-col gap-3 rounded-lg border p-4 text-base">
        <div><dt className="text-muted-foreground">Receipt code</dt><dd className="font-mono text-xl font-semibold">{attempt.receipt_code}</dd></div>
        <div><dt className="text-muted-foreground">Accepted by the server</dt><dd>{formatPkt(attempt.submitted_at)}</dd></div>
        {attempt.status === "auto_submitted" && <div><dd>Submitted automatically when the time ran out.</dd></div>}
      </dl>
    </div>
  );
}
