import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/states";
import { SubmitButton } from "@/components/submit-button";
import { requireMember } from "@/lib/access";
import { examPhase } from "@/lib/exam-rules";
import { listSecondLooks } from "@/features/authoring/ai/data";
import { getExam } from "@/features/authoring/exams/data";
import { PublishForm } from "@/features/authoring/exams/publish-form";
import { formatPakistanTime, plural } from "@/features/authoring/format";
import { markObjectiveAnswers } from "@/features/authoring/marking/actions";
import { autoGradeObjective, hasAutoGrades } from "@/features/authoring/marking/auto-grade";
import { listFinishedAttempts } from "@/features/authoring/marking/data";
import { loadKeyDoctor } from "@/features/authoring/marking/key-doctor-data";
import { publishResults } from "@/features/authoring/marking/results-actions";
import { computeScores, summarize } from "@/features/authoring/marking/results";
import { AnalyticsSection, KeyDoctorSection, ResultsTable, SummarySection, WrittenQueueSection } from "@/features/authoring/marking/sections";
import { loadWrittenQueue } from "@/features/authoring/marking/written-data";
import { ApprovalPanel } from "@/features/governance/approval-panel";

const TABS = ["keys", "written", "results", "analytics"] as const;
type Tab = (typeof TABS)[number];

function parseTab(value: string | undefined, fallback: Tab): Tab {
  return TABS.find((tab) => tab === value) ?? fallback;
}

function MarkingTabs({ examId, current, labels }: { examId: string; current: Tab; labels: Record<Tab, string> }) {
  return (
    <nav aria-label="Marking steps" className="flex flex-wrap gap-1">
      {TABS.map((tab, index) => (
        <Link
          key={tab}
          href={`/marking/${examId}?tab=${tab}`}
          aria-current={tab === current ? "page" : undefined}
          className={`flex h-11 items-center rounded-full px-4 text-sm font-medium transition-colors duration-200 hover:bg-accent ${tab === current ? "bg-secondary text-foreground" : "text-muted-foreground"}`}
        >
          {index + 1}. {labels[tab]}
        </Link>
      ))}
    </nav>
  );
}

export default async function MarkingPage({ params, searchParams }: { params: Promise<{ examId: string }>; searchParams: Promise<{ tab?: string }> }) {
  const member = await requireMember("examiner", "institution_admin");
  const [{ examId }, search] = await Promise.all([params, searchParams]);
  const exam = await getExam(member, examId);
  const attempts = await listFinishedAttempts(member, exam.id);
  // Opening a closed exam marks its objective answers, so the examiner never starts from a blank sheet.
  const attemptIds = attempts.map((attempt) => attempt.id);
  if (examPhase(exam) === "closed" && !(await hasAutoGrades(member, attemptIds))) await autoGradeObjective(member, exam.id, attempts);
  const rolls = new Map(attempts.map((attempt) => [attempt.id, attempt.candidate?.roll_number ?? ""]));
  const [queue, doctor, scores, secondLooks] = await Promise.all([
    loadWrittenQueue(member, attempts),
    loadKeyDoctor(member, exam.id, attempts),
    computeScores(member, exam, attempts),
    listSecondLooks(member, attempts.map((attempt) => attempt.id), rolls),
  ]);
  const flagged = doctor.open.length;
  const unmarked = queue.total - queue.marked;
  const summary = summarize(scores, exam.total_marks);
  const tab = parseTab(search.tab, flagged > 0 ? "keys" : unmarked > 0 ? "written" : "results");
  const labels: Record<Tab, string> = {
    keys: flagged > 0 ? `Key check · ${flagged} to resolve` : "Key check · clear",
    written: unmarked > 0 ? `Written answers · ${unmarked} left` : "Written answers · all marked",
    results: exam.results_published_at ? "Results · published" : "Results and publish",
    analytics: "Question analytics",
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        back={{ href: "/marking", label: "Marking" }}
        title={`Marking: ${exam.title}`}
        description={`${plural(attempts.length, "submitted attempt")} · objective answers are marked automatically`}
      >
        <form action={markObjectiveAnswers.bind(null, exam.id)}>
          <SubmitButton size="lg" variant="outline">
            Mark objective answers again
          </SubmitButton>
        </form>
      </PageHeader>

      {attempts.length === 0 ? (
        <EmptyState message="Nobody has submitted this exam yet. Submitted attempts appear here for marking." />
      ) : (
        <>
          <MarkingTabs examId={exam.id} current={tab} labels={labels} />
          {tab === "keys" && <KeyDoctorSection examId={exam.id} doctor={doctor} />}
          {tab === "written" && <WrittenQueueSection member={member} examId={exam.id} queue={queue} secondLooks={secondLooks} />}
          {tab === "results" && (
            <>
              <section className="flex flex-col gap-3 rounded-3xl bg-card p-4 md:p-6">
                {exam.results_published_at ? (
                  <p className="text-base">Results published {formatPakistanTime(exam.results_published_at)}. Each candidate sees only their own.</p>
                ) : (
                  <>
                    {flagged === 0 && unmarked > 0 && (
                      <p className="text-base text-muted-foreground">
                        {plural(unmarked, "written answer")} still unmarked. They count as 0 until marked; marking one later issues a new result version.
                      </p>
                    )}
                    <ApprovalPanel examId={exam.id} kind="results" />
                    <PublishForm
                      action={publishResults.bind(null, exam.id)}
                      label="Publish results"
                      variant="default"
                      isBlocked={flagged > 0}
                      blockedReason={`Resolve ${plural(flagged, "flagged question")} in Key check before publishing.`}
                    />
                  </>
                )}
              </section>
              {summary && <SummarySection summary={summary} maxTotal={exam.total_marks} />}
              <ResultsTable scores={scores} />
            </>
          )}
          {tab === "analytics" && <AnalyticsSection rows={doctor.analytics} />}
        </>
      )}
    </div>
  );
}
