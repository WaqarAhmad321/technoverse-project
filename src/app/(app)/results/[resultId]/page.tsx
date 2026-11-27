import Link from "next/link";
import { Check, Download, X } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { loadMyResult, loadResultQuestions } from "@/features/delivery/data";
import { requireMember } from "@/lib/access";
import { formatDate, formatMarks } from "@/lib/format";

const PERCENT = 100;

export default async function ResultPage({ params }: { params: Promise<{ resultId: string }> }) {
  const { resultId } = await params;
  const member = await requireMember("candidate");
  const { result, exam } = await loadMyResult(member, resultId);
  const questions = await loadResultQuestions(result);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <PageHeader
        title={exam.title}
        description={`Published ${result.published_at ? formatDate(result.published_at) : ""} · version ${result.version}${result.reason ? `: ${result.reason}` : ""}`}
      >
        <Button asChild size="lg">
          <a href={`/results/${result.id}/pdf`} target="_blank" rel="noreferrer">
            <Download aria-hidden className="size-5" />
            Download PDF report
          </a>
        </Button>
      </PageHeader>

      <section className="flex flex-col gap-1 rounded-3xl bg-card p-6">
        <p className="text-4xl font-medium tracking-tight md:text-5xl">
          {formatMarks(result.total)} <span className="text-xl text-muted-foreground">of {result.max_total}</span>
        </p>
        <p className="text-base text-muted-foreground">
          {Math.round((result.total / result.max_total) * PERCENT)}% · verify code <span className="font-mono">{result.verify_code}</span>
        </p>
      </section>

      <ol className="flex flex-col gap-2">
        {questions.map((question) => {
          const isFull = question.marksAwarded >= question.marks;
          return (
            <li key={question.questionId} className="flex flex-col gap-2 rounded-2xl bg-card p-5">
              <div className="flex items-start justify-between gap-4">
                <p className="text-base font-medium">
                  Q{question.position}. {question.body}
                </p>
                <span className="flex shrink-0 items-center gap-1 text-base">
                  {isFull ? <Check aria-hidden className="size-4 text-primary" /> : <X aria-hidden className="size-4 text-destructive" />}
                  {formatMarks(question.marksAwarded)} of {question.marks}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Your answer: {question.yourAnswer || "not answered"}</p>
              {question.correctAnswer && <p className="text-sm text-muted-foreground">Correct answer: {question.correctAnswer}</p>}
              {question.keyFixNote && <p className="text-sm">{question.keyFixNote}</p>}
            </li>
          );
        })}
      </ol>

      <p className="text-base">
        Think a question was marked wrongly?{" "}
        <Link href={`/disputes/new?result=${result.id}`} className="underline underline-offset-4">
          Challenge a question
        </Link>
        . It is free and can never lower your mark.
      </p>
    </div>
  );
}
