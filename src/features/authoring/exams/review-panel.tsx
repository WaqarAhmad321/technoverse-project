import { CircleAlert, CircleCheck, CircleX } from "lucide-react";
import type { Exam } from "@/lib/exam-types";
import { formatPakistanTime, plural } from "../format";
import { KIND_LABEL, firstLine } from "../questions/schema";
import type { Checklist } from "./checklist";
import type { ReviewQuestion } from "./data";
import { publishExam, unpublishExam } from "./publish-actions";
import { PublishForm } from "./publish-form";
import { ApprovalPanel } from "@/features/governance/approval-panel";

type ReviewPanelProps = {
  exam: Exam;
  questions: ReviewQuestion[];
  checklist: Checklist;
  canEdit: boolean;
  startedCount: number;
};

export function ReviewPanel({ exam, questions, checklist, canEdit, startedCount }: ReviewPanelProps) {
  return (
    <div className="flex flex-col gap-4">
      <ChecklistSection exam={exam} checklist={checklist} canEdit={canEdit} startedCount={startedCount} />
      <SummarySection exam={exam} questions={questions} />
    </div>
  );
}

function ChecklistSection({ exam, checklist, canEdit, startedCount }: Omit<ReviewPanelProps, "questions">) {
  const isPublished = exam.status === "published";
  return (
    <section aria-labelledby="checklist-heading" className="flex flex-col gap-4 rounded-3xl bg-card p-4 md:p-6">
      <h2 id="checklist-heading" className="text-xl font-medium">
        {isPublished ? "Published" : "Before you publish"}
      </h2>
      {isPublished && exam.published_at && (
        <p className="text-base text-muted-foreground">Published {formatPakistanTime(exam.published_at)}. Enrolled candidates see it under their exams.</p>
      )}
      <ul aria-label="Publish checklist" className="flex flex-col gap-3">
        {checklist.lines.map((line) => (
          <li key={line.id} className="flex gap-3">
            {line.ok ? (
              <CircleCheck className="mt-0.5 size-5 shrink-0 text-foreground" aria-label="Pass" />
            ) : (
              <CircleX className="mt-0.5 size-5 shrink-0 text-destructive" aria-label="Fails" />
            )}
            <span className="flex flex-col">
              <span className={`text-base ${line.ok ? "" : "font-medium text-destructive"}`}>{line.text}</span>
              {!line.ok && line.fix && <span className="text-base text-muted-foreground">{line.fix}</span>}
            </span>
          </li>
        ))}
        {checklist.warnings.map((warning) => (
          <li key={warning} className="flex gap-3">
            <CircleAlert className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-label="Warning" />
            <span className="text-base text-muted-foreground">{warning} You can still publish.</span>
          </li>
        ))}
      </ul>
      {canEdit && !isPublished && <ApprovalPanel examId={exam.id} kind="paper" />}
      {canEdit && !isPublished && (
        <PublishForm
          action={publishExam.bind(null, exam.id)}
          label="Publish exam"
          variant="default"
          isBlocked={!checklist.canPublish}
          blockedReason="Fix the lines marked in red to publish."
        />
      )}
      {canEdit && isPublished && (
        <PublishForm
          action={unpublishExam.bind(null, exam.id)}
          label="Unpublish"
          variant="outline"
          isBlocked={startedCount > 0}
          blockedReason={`${plural(startedCount, "candidate has", "candidates have")} started, so it stays published.`}
        />
      )}
    </section>
  );
}

function SummarySection({ exam, questions }: { exam: Exam; questions: ReviewQuestion[] }) {
  return (
    <section aria-labelledby="summary-heading" className="flex flex-col gap-4 rounded-3xl bg-card p-4 md:p-6">
      <h2 id="summary-heading" className="text-xl font-medium">
        What candidates get
      </h2>
      <dl className="grid gap-x-6 gap-y-2 text-base sm:grid-cols-[max-content_1fr]">
        <dt className="text-muted-foreground">Window</dt>
        <dd>
          {formatPakistanTime(exam.opens_at)} to {formatPakistanTime(exam.closes_at)}, Pakistan time
        </dd>
        <dt className="text-muted-foreground">Time to answer</dt>
        <dd>{exam.duration_minutes} minutes from when they start</dd>
        <dt className="text-muted-foreground">Total</dt>
        <dd>{plural(exam.total_marks, "mark")}</dd>
        <dt className="text-muted-foreground">Order</dt>
        <dd>{exam.shuffle_questions ? "Questions shuffled for each candidate" : "Same question order for everyone"}</dd>
      </dl>
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-medium">Instructions</h3>
        <p className="whitespace-pre-line text-base text-muted-foreground">{exam.instructions || "No instructions."}</p>
      </div>
      {questions.length > 0 && (
        <ol aria-label="Questions candidates get" className="flex flex-col">
          {questions.map((question, index) => (
            <li key={question.id} className="flex items-start gap-3 border-b border-border py-2 last:border-0">
              <span className="w-6 text-sm text-muted-foreground tabular-nums">{index + 1}</span>
              <span className="min-w-0 flex-1 text-base">{firstLine(question.body)}</span>
              <span className="shrink-0 text-sm text-muted-foreground">
                {KIND_LABEL[question.kind]} · {plural(question.marks, "mark")}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
