import Link from "next/link";
import { Button } from "@/components/ui/button";
import { loadMyExam, loadQuestionPreviews } from "@/features/delivery/data";
import { PageHeader } from "@/features/delivery/page-header";
import { requireMember } from "@/lib/access";
import { formatPkt } from "@/lib/format";

export default async function ExamInstructionsPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;
  const member = await requireMember("candidate");
  const { exam, phase, attempt } = await loadMyExam(member, examId);
  const questionCount = (await loadQuestionPreviews(exam.id, member.institution.id)).length;

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <PageHeader title={exam.title} description={member.institution.name} />
      <dl className="grid grid-cols-2 gap-4 rounded-lg border p-4 text-base sm:grid-cols-4">
        <div><dt className="text-muted-foreground">Duration</dt><dd className="font-medium">{exam.duration_minutes} minutes</dd></div>
        <div><dt className="text-muted-foreground">Total marks</dt><dd className="font-medium">{exam.total_marks}</dd></div>
        <div><dt className="text-muted-foreground">Questions</dt><dd className="font-medium">{questionCount}</dd></div>
        <div><dt className="text-muted-foreground">Closes</dt><dd className="font-medium">{formatPkt(exam.closes_at)}</dd></div>
      </dl>
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Instructions</h2>
        <p className="text-base whitespace-pre-line">{exam.instructions}</p>
      </section>
      {phase === "upcoming" && <p className="text-base">This exam opens {formatPkt(exam.opens_at)}.</p>}
      {phase === "closed" && <p className="text-base">This exam closed {formatPkt(exam.closes_at)}.</p>}
      {phase === "open" && (
        <Button asChild size="lg" className="self-start">
          <Link href={`/exams/${exam.id}/take`}>{attempt ? "Continue exam" : "Start exam"}</Link>
        </Button>
      )}
    </div>
  );
}
