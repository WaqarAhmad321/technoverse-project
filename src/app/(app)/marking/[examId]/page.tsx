import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/states";
import { SubmitButton } from "@/components/submit-button";
import { requireMember } from "@/lib/access";
import { examPhase } from "@/lib/exam-rules";
import { getExam } from "@/features/authoring/exams/data";
import { markObjectiveAnswers } from "@/features/authoring/marking/actions";
import { autoGradeObjective } from "@/features/authoring/marking/auto-grade";
import { listFinishedAttempts } from "@/features/authoring/marking/data";
import { fixKey } from "@/features/authoring/marking/key-doctor-actions";
import { KeyDoctorCard } from "@/features/authoring/marking/key-doctor-card";
import { loadKeyDoctor, type AnalyticsRow, type KeyDoctorView } from "@/features/authoring/marking/key-doctor-data";
import { PublishForm } from "@/features/authoring/exams/publish-form";
import { publishResults } from "@/features/authoring/marking/results-actions";
import { computeScores, summarize, type ExamSummary, type ScoreRow } from "@/features/authoring/marking/results";
import { saveWrittenMark } from "@/features/authoring/marking/written-actions";
import { loadWrittenQueue, type WrittenQueue } from "@/features/authoring/marking/written-data";
import { WrittenForm } from "@/features/authoring/marking/written-form";
import { formatPakistanTime, plural } from "@/features/authoring/format";
import { firstLine } from "@/features/authoring/questions/schema";

export default async function MarkingPage({ params }: { params: Promise<{ examId: string }> }) {
  const member = await requireMember("examiner", "institution_admin");
  const { examId } = await params;
  const exam = await getExam(member, examId);
  const attempts = await listFinishedAttempts(member, exam.id);
  // Opening a closed exam marks its objective answers, so the examiner never starts from a blank sheet.
  const progress = examPhase(exam) === "closed" ? await autoGradeObjective(member, exam.id, attempts) : null;
  const [queue, doctor] = await Promise.all([
    loadWrittenQueue(member, attempts),
    loadKeyDoctor(member, exam.id, attempts),
  ]);
  const flagged = doctor.open.length;
  const scores = await computeScores(member, exam, attempts);
  const summary = summarize(scores, exam.total_marks);
  const unmarked = queue.total - queue.marked;

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
      {attempts.length > 0 && <KeyDoctorSection examId={exam.id} doctor={doctor} />}
      {attempts.length > 0 &&
        (exam.results_published_at ? (
          <p className="text-base">Results published {formatPakistanTime(exam.results_published_at)}. Candidates can see their own.</p>
        ) : (
          <div className="flex flex-col gap-2">
          {flagged === 0 && unmarked > 0 && (
            <p className="text-base text-muted-foreground">
              {plural(unmarked, "written answer")} still unmarked. They count as 0 until marked; marking one later issues a new result version.
            </p>
          )}
          <PublishForm
            action={publishResults.bind(null, exam.id)}
            label="Publish results"
            variant="default"
            isBlocked={flagged > 0}
            blockedReason={`Resolve ${plural(flagged, "flagged question")} before publishing.`}
          />
          </div>
        ))}
      {queue.total > 0 && <WrittenQueueSection examId={exam.id} queue={queue} />}
      {attempts.length === 0 ? (
        <EmptyState message="Nobody has submitted this exam yet. Submitted attempts appear here for marking." />
      ) : (
        <>
          {summary && <SummarySection summary={summary} maxTotal={exam.total_marks} />}
          <AnalyticsSection rows={doctor.analytics} />
          <ResultsTable scores={scores} />
        </>
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

function KeyDoctorSection({ examId, doctor }: { examId: string; doctor: KeyDoctorView }) {
  return (
    <section aria-labelledby="doctor-heading" className="flex flex-col gap-4 rounded-3xl bg-card p-4 md:p-6">
      <h2 id="doctor-heading" className="text-xl font-medium">
        Key check
      </h2>
      {doctor.open.length === 0 ? (
        <p className="text-base text-muted-foreground">No answer key looks wrong.</p>
      ) : (
        <ul aria-label="Flagged questions" className="flex flex-col gap-3">
          {doctor.open.map((flag) => (
            <KeyDoctorCard key={flag.question_id} flag={flag} action={fixKey.bind(null, examId)} />
          ))}
        </ul>
      )}
      {doctor.fixes.length > 0 && (
        <ul aria-label="Key fixes" className="flex flex-col gap-1 text-base text-muted-foreground">
          {doctor.fixes.map((fix) => (
            <li key={fix.id}>
              Fixed: {fix.decision.replace("_", " ")} · {fix.reason}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

const PERCENT = 100;

function SummarySection({ summary, maxTotal }: { summary: ExamSummary; maxTotal: number }) {
  const tallest = Math.max(1, ...summary.buckets);
  const stats = [
    ["Submitted", String(summary.count)],
    ["Average", `${summary.average} / ${maxTotal}`],
    ["Median", String(summary.median)],
    ["Highest", String(summary.highest)],
    ["Lowest", String(summary.lowest)],
    ["Passed (33%)", `${Math.round(summary.passRate * PERCENT)}%`],
  ];
  return (
    <section aria-labelledby="summary-heading" className="flex flex-col gap-4 rounded-3xl bg-card p-4 md:p-6">
      <h2 id="summary-heading" className="text-xl font-medium">
        Exam summary
      </h2>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stats.map(([label, value]) => (
          <div key={label} className="flex flex-col">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="text-xl font-medium tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <div aria-label="Score spread" className="flex h-24 items-end gap-2">
        {summary.buckets.map((count, index) => (
          <div key={index} className="flex flex-1 flex-col items-center gap-1">
            <div className="w-full rounded-t-md bg-primary/70" style={{ height: `${(count / tallest) * PERCENT}%` }} />
            <span className="text-xs text-muted-foreground tabular-nums">{index * 20}–{(index + 1) * 20}%</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ResultsTable({ scores }: { scores: ScoreRow[] }) {
  return (
    <ul aria-label="Attempts" className="flex flex-col rounded-3xl bg-card p-2 md:p-4">
      {scores.map((score) => (
        <li key={score.attempt_id} className="flex min-h-14 items-center justify-between gap-4 border-b border-border px-3 last:border-0">
          <span className="flex min-w-0 flex-col">
            <span className="text-base">{score.name}</span>
            <span className="text-sm text-muted-foreground">Roll {score.roll}</span>
          </span>
          <span className="shrink-0 text-base tabular-nums">
            {score.total} of {score.max_total} marks · {Math.round((score.total / score.max_total) * PERCENT)}%
          </span>
        </li>
      ))}
    </ul>
  );
}

function pct(share: number): string {
  return `${Math.round(share * PERCENT)}%`;
}

function AnalyticsSection({ rows }: { rows: AnalyticsRow[] }) {
  if (rows.length === 0) return null;
  return (
    <section aria-labelledby="analytics-heading" className="flex flex-col gap-4 rounded-3xl bg-card p-4 md:p-6">
      <h2 id="analytics-heading" className="text-xl font-medium">
        How each question behaved
      </h2>
      <ul aria-label="Question analytics" className="flex flex-col">
        {rows.map((row) => (
          <li key={row.question_id} className="flex flex-col gap-2 border-b border-border py-3 last:border-0">
            <p className="text-base">
              <span className="font-medium">Q{row.position}</span> {firstLine(row.body)}
            </p>
            <p className="text-sm text-muted-foreground">
              {pct(row.correct)} correct · top minus bottom {row.discrimination.toFixed(2)} · {pct(row.skipped)} skipped
              {row.behaved !== row.label && ` · Labelled ${row.label}, behaved ${row.behaved}`}
            </p>
            <div className="flex flex-col gap-1" aria-label={`Q${row.position} choices among top scorers`}>
              {row.topShares.map(([option, share]) => (
                <div key={option} className="flex items-center gap-2 text-sm">
                  <span className="w-4">{option.toUpperCase()}</span>
                  <span className="h-2 flex-1 rounded-full bg-muted">
                    <span className="block h-2 rounded-full bg-primary/70" style={{ width: pct(share) }} />
                  </span>
                  <span className="w-10 text-right tabular-nums">{pct(share)}</span>
                </div>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
