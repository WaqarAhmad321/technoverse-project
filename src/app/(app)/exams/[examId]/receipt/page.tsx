import Link from "next/link";
import { notFound } from "next/navigation";
import { CircleCheck } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { loadMyAttempt, loadPaper, loadSavedAnswers } from "@/features/delivery/attempts";
import { loadMyExam } from "@/features/delivery/data";
import { requireMember } from "@/lib/access";
import { answerCounts } from "@/lib/exam-rules";
import { formatPkt } from "@/lib/format";

export default async function ReceiptPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;
  const member = await requireMember("candidate");
  const [{ exam }, attempt] = await Promise.all([loadMyExam(member, examId), loadMyAttempt(member, examId)]);
  if (!attempt?.receipt_code || !attempt.submitted_at) notFound();

  const [paper, saved] = await Promise.all([loadPaper(attempt.id), loadSavedAnswers(attempt.id)]);
  const received = saved.filter((answer) => answerCounts(answer, attempt)).length;

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <PageHeader title="Your submission counted" description={exam.title} />
      <section className="flex flex-col gap-4 rounded-3xl bg-card p-6">
        <p className="flex items-center gap-2 text-base">
          <CircleCheck aria-hidden className="size-5 text-primary" />
          {attempt.status === "auto_submitted"
            ? "Submitted automatically when the time ran out, with every answer the server received in time."
            : "The exam server accepted your answers."}
        </p>
        <dl className="flex flex-col gap-3 text-base">
          <div>
            <dt className="text-sm text-muted-foreground">Receipt code</dt>
            <dd className="font-mono text-2xl font-medium tracking-wide">{attempt.receipt_code}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Accepted by the server</dt>
            <dd>{formatPkt(attempt.submitted_at)}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted-foreground">Answers received</dt>
            <dd>
              {received} of {paper.length} questions
            </dd>
          </div>
        </dl>
        <p className="text-sm text-muted-foreground">Keep this code. If anyone says your exam did not arrive, it proves it did.</p>
      </section>
      <Button asChild variant="outline" size="lg" className="self-start">
        <Link href="/exams">Back to my exams</Link>
      </Button>
    </div>
  );
}
