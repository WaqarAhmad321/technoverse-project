import { Suspense } from "react";
import { Pagination } from "@/components/pagination";
import { StatusDot } from "@/components/status-dot";
import { paginate } from "@/lib/pagination";
import type { Member } from "@/lib/access";
import { AiOpinion, AiOpinionLoading } from "../ai/ai-opinion";
import type { SecondLook } from "../ai/data";
import { firstLine } from "../questions/schema";
import { fixKey } from "./key-doctor-actions";
import { KeyDoctorCard } from "./key-doctor-card";
import type { AnalyticsRow, KeyDoctorView } from "./key-doctor-data";
import type { ExamSummary, ScoreRow } from "./results";
import { saveWrittenMark } from "./written-actions";
import type { WrittenQueue } from "./written-data";
import { WrittenForm } from "./written-form";

export function WrittenQueueSection({ member, examId, queue, secondLooks }: { member: Member; examId: string; queue: WrittenQueue; secondLooks: SecondLook[] }) {
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
          <Suspense fallback={<AiOpinionLoading />}>
            <AiOpinion
              member={member}
              attemptId={next.attempt_id}
              questionId={next.question_id}
              item={{ body: next.body, rubric: next.rubric ?? "", marks: next.marks, answer: next.answerText }}
            />
          </Suspense>
          <WrittenForm item={next} action={saveWrittenMark.bind(null, examId)} />
        </div>
      )}
      {secondLooks.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-base font-medium">Needs a second look</h3>
          <ul aria-label="Needs a second look" className="flex flex-col gap-1 text-base">
            {secondLooks.map((look) => (
              <li key={`${look.attempt_id}:${look.question_id}`}>
                Roll {look.roll}: you gave {look.human}, the AI gave {look.ai} of {look.marks}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

export function KeyDoctorSection({ examId, doctor }: { examId: string; doctor: KeyDoctorView }) {
  return (
    <section aria-labelledby="doctor-heading" className="flex flex-col gap-4 rounded-3xl bg-card p-4 md:p-6">
      <h2 id="doctor-heading" className="text-xl font-medium">
        Key check
      </h2>
      {doctor.open.length === 0 ? (
        <StatusDot tone="done" className="text-base text-muted-foreground">
          No answer key looks wrong.
        </StatusDot>
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
const BAND_PERCENT = 20;

export function SummarySection({ summary, maxTotal }: { summary: ExamSummary; maxTotal: number }) {
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
          <div key={label} className="flex flex-col rounded-2xl bg-muted p-4">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="text-xl font-medium tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-col gap-2">
        <h3 className="text-base font-medium">How many candidates scored in each band</h3>
        <div aria-label="Score spread" className="flex gap-2">
          {summary.buckets.map((count, index) => (
            <div key={index} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-sm tabular-nums">{count}</span>
              <div className="flex h-28 w-full items-end rounded-md bg-muted">
                <div className="w-full rounded-md bg-primary/70" style={{ height: `${Math.max(count ? 4 : 0, (count / tallest) * PERCENT)}%` }} />
              </div>
              <span className="text-xs text-muted-foreground tabular-nums">
                {index * BAND_PERCENT}–{(index + 1) * BAND_PERCENT}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ResultsTable({ examId, scores, page }: { examId: string; scores: ScoreRow[]; page?: string }) {
  const shown = paginate(scores, page);
  return (
    <section aria-labelledby="results-heading" className="rounded-3xl bg-card p-2 md:p-4">
      <h2 id="results-heading" className="px-3 pt-2 pb-3 text-xl font-medium">
        Results by candidate
      </h2>
      <ul aria-label="Attempts" className="flex flex-col">
      {shown.rows.map((score) => (
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
      <Pagination page={shown} basePath={`/marking/${examId}`} params={{ tab: "results" }} noun="attempts" />
    </section>
  );
}

function pct(share: number): string {
  return `${Math.round(share * PERCENT)}%`;
}

export function AnalyticsSection({ examId, rows, page }: { examId: string; rows: AnalyticsRow[]; page?: string }) {
  if (rows.length === 0) return null;
  const shown = paginate(rows, page);
  return (
    <section aria-labelledby="analytics-heading" className="flex flex-col gap-4 rounded-3xl bg-card p-4 md:p-6">
      <h2 id="analytics-heading" className="text-xl font-medium">
        How each question behaved
      </h2>
      <ul aria-label="Question analytics" className="flex flex-col">
        {shown.rows.map((row) => (
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
      <Pagination page={shown} basePath={`/marking/${examId}`} params={{ tab: "analytics" }} noun="questions" />
    </section>
  );
}
