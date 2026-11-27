import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/states";
import { SubmitButton } from "@/components/submit-button";
import { requireMember } from "@/lib/access";
import { examPhase } from "@/lib/exam-rules";
import { getExam } from "@/features/authoring/exams/data";
import { markObjectiveAnswers } from "@/features/authoring/marking/actions";
import { autoGradeObjective } from "@/features/authoring/marking/auto-grade";
import { listFinishedAttempts, objectiveTotals } from "@/features/authoring/marking/data";
import { formatPakistanTime, plural } from "@/features/authoring/format";

export default async function MarkingPage({ params }: { params: Promise<{ examId: string }> }) {
  const member = await requireMember("examiner", "institution_admin");
  const { examId } = await params;
  const exam = await getExam(member, examId);
  const attempts = await listFinishedAttempts(member, exam.id);
  // Opening a closed exam marks its objective answers, so the examiner never starts from a blank sheet.
  const progress = examPhase(exam) === "closed" ? await autoGradeObjective(member, exam.id, attempts) : null;
  const totals = await objectiveTotals(member, attempts.map((attempt) => attempt.id));

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
