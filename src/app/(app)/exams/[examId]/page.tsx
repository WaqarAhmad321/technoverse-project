import Link from "next/link";
import { FormMessage } from "@/components/form-message";
import { PageHeader } from "@/components/page-header";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { startExam } from "@/features/delivery/actions";
import { loadMyAttempt } from "@/features/delivery/attempts";
import { loadMyExam, loadQuestionPreviews } from "@/features/delivery/data";
import { SystemCheck } from "@/features/delivery/system-check";
import { requireMember } from "@/lib/access";
import { formatPkt } from "@/lib/format";

const MAX_NOTICE_LENGTH = 200;

export default async function ExamInstructionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ examId: string }>;
  searchParams: Promise<{ notice?: string | string[] }>;
}) {
  const { examId } = await params;
  const { notice } = await searchParams;
  const member = await requireMember("candidate");
  const { exam, phase } = await loadMyExam(member, examId);
  const [attempt, questions] = await Promise.all([loadMyAttempt(member, exam.id), loadQuestionPreviews(exam.id, member.institution.id)]);
  const isFinished = attempt !== null && attempt.status !== "in_progress";

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <PageHeader title={exam.title} description={member.institution.name} back={{ href: "/exams", label: "My exams" }} />
      <dl className="grid grid-cols-2 gap-4 rounded-3xl bg-card p-6 text-base sm:grid-cols-4">
        <div><dt className="text-sm text-muted-foreground">Duration</dt><dd className="font-medium">{exam.duration_minutes} minutes</dd></div>
        <div><dt className="text-sm text-muted-foreground">Total marks</dt><dd className="font-medium">{exam.total_marks}</dd></div>
        <div><dt className="text-sm text-muted-foreground">Questions</dt><dd className="font-medium">{questions.length}</dd></div>
        <div><dt className="text-sm text-muted-foreground">Closes</dt><dd className="font-medium">{formatPkt(exam.closes_at)}</dd></div>
      </dl>
      <section className="flex flex-col gap-2 rounded-3xl bg-card p-6">
        <h2 className="text-xl font-medium">Before you start</h2>
        <p className="text-base whitespace-pre-line">{exam.instructions}</p>
      </section>
      {phase === "open" && !attempt && <SystemCheck />}
      {typeof notice === "string" && <FormMessage tone="error">{notice.slice(0, MAX_NOTICE_LENGTH)}</FormMessage>}
      {phase === "upcoming" && <p className="text-base">This exam opens {formatPkt(exam.opens_at)}.</p>}
      {phase === "closed" && !attempt && <p className="text-base">This exam closed {formatPkt(exam.closes_at)}.</p>}
      {isFinished && (
        <Button asChild size="lg" variant="outline" className="self-start">
          <Link href={`/exams/${exam.id}/receipt`}>See your receipt</Link>
        </Button>
      )}
      {attempt?.status === "in_progress" && (
        <Button asChild size="lg" className="self-start">
          <Link href={`/exams/${exam.id}/take`}>Continue exam</Link>
        </Button>
      )}
      {phase === "open" && !attempt && (
        <form action={startExam} className="self-start">
          <input type="hidden" name="examId" value={exam.id} />
          <SubmitButton size="lg">Start exam</SubmitButton>
        </form>
      )}
    </div>
  );
}
