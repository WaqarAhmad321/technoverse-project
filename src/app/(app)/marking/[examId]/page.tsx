import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/states";
import { SubmitButton } from "@/components/submit-button";
import { requireMember } from "@/lib/access";
import { examPhase } from "@/lib/exam-rules";
import { getExam } from "@/features/authoring/exams/data";
import { markObjectiveAnswers } from "@/features/authoring/marking/actions";
import { autoGradeObjective } from "@/features/authoring/marking/auto-grade";
import { listFinishedAttempts, objectiveTotals } from "@/features/authoring/marking/data";
import { saveWrittenMark } from "@/features/authoring/marking/written-actions";
import { loadWrittenQueue, type WrittenQueue } from "@/features/authoring/marking/written-data";
import { WrittenForm } from "@/features/authoring/marking/written-form";
import { formatPakistanTime, plural } from "@/features/authoring/format";

export default async function MarkingPage({ params }: { params: Promise<{ examId: string }> }) {
  const member = await requireMember("examiner", "institution_admin");
  const { examId } = await params;
  const exam = await getExam(member, examId);
  const attempts = await listFinishedAttempts(member, exam.id);
  // Opening a closed exam marks its objective answers, so the examiner never starts from a blank sheet.
  const progress = examPhase(exam) === "closed" ? await autoGradeObjective(member, exam.id, attempts) : null;
  const [totals, queue] = await Promise.all([objectiveTotals(member, attempts.map((attempt) => attempt.id)), loadWrittenQueue(member, attempts)]);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={`Marking: ${exam.title}`} description={`${plural(attempts.length, "submitted attempt")}.`}>
        <form action={markObjectiveAnswers.bind(null, exam.id)}>
          <SubmitButton size="lg" variant="outline">
            Mark objective answers
          </SubmitButton>
        </form>
      </PageHeader>
      {progress && (
        <p className="text-base" aria-live="polite">
          {plural(progress.attempts, "attempt")} · {plural(progress.objectiveMarked, "objective answer")} marked ·{" "}
          {plural(progress.writtenToMark, "written answer")} to mark
        </p>
      )}
      {queue.total > 0 && <WrittenQueueSection examId={exam.id} queue={queue} />}
      {attempts.length === 0 ? (
        <EmptyState message="Nobody has submitted this exam yet. Submitted attempts appear here for marking." />
      ) : (
        <ul aria-label="Attempts" className="flex flex-col rounded-3xl bg-card p-2 md:p-4">
          {attempts.map((attempt) => (
            <li key={attempt.id} className="flex min-h-14 items-center justify-between gap-4 border-b border-border px-3 last:border-0">
              <span className="flex min-w-0 flex-col">
                <span className="text-base">{attempt.candidate?.full_name ?? "Unknown candidate"}</span>
                <span className="text-sm text-muted-foreground">
                  Roll {attempt.candidate?.roll_number} · {attempt.submitted_at ? formatPakistanTime(attempt.submitted_at) : "auto-submitted"}
                </span>
              </span>
              <span className="shrink-0 text-base tabular-nums">
                {totals.has(attempt.id) ? `${totals.get(attempt.id)} objective marks` : "Not marked"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function WrittenQueueSection({ examId, queue }: { examId: string; queue: WrittenQueue }) {
  const { next } = queue;
  return (
    <section aria-labelledby="written-heading" className="flex flex-col gap-4 rounded-3xl bg-card p-4 md:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="written-heading" className="text-xl font-medium">
          Written answers
        </h2>
        <p className="text-base text-muted-foreground" aria-live="polite">
          {next ? `Marking in progress (${queue.marked} of ${queue.total} written answers)` : "All marked"}
        </p>
      </div>
      {next && (
        <div key={`${next.attempt_id}:${next.question_id}`} className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">Roll {next.rollNumber}</p>
          <p className="text-base font-medium">{next.body}</p>
          {next.rubric && <p className="rounded-xl bg-muted px-4 py-3 text-base">Rubric: {next.rubric}</p>}
          <blockquote className="whitespace-pre-line border-l-2 border-border pl-4 text-base">{next.answerText || "No answer given."}</blockquote>
          <WrittenForm item={next} action={saveWrittenMark.bind(null, examId)} />
        </div>
      )}
    </section>
  );
}
