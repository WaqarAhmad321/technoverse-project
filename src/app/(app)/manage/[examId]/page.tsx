import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { can, requireMember, type Member } from "@/lib/access";
import { examPhase } from "@/lib/exam-rules";
import type { Difficulty, Exam } from "@/lib/exam-types";
import { updateExam } from "@/features/authoring/exams/actions";
import { runChecklist } from "@/features/authoring/exams/checklist";
import { countStartedAttempts, getExam, listExamQuestions, loadReview } from "@/features/authoring/exams/data";
import { getEnrollment } from "@/features/authoring/exams/enrollment-data";
import { EnrollmentPanel } from "@/features/authoring/exams/enrollment-panel";
import { ExamForm } from "@/features/authoring/exams/exam-form";
import { ExamTabs, parseExamTab } from "@/features/authoring/exams/exam-tabs";
import { readModeration } from "@/features/authoring/ai/moderator";
import { ModeratorPanel } from "@/features/authoring/exams/moderator-panel";
import { PapersPanel } from "@/features/authoring/exams/papers-panel";
import { ReviewPanel } from "@/features/authoring/exams/review-panel";
import { BankPicker, MarksTotal, PaperList } from "@/features/authoring/exams/paper-editor";
import { PHASE_LABEL, formatPakistanTime, toPakistanInputValue } from "@/features/authoring/format";
import { listQuestions, listTopics } from "@/features/authoring/questions/data";
import { DIFFICULTIES } from "@/features/authoring/questions/schema";

type Search = { tab?: string; topic?: string; difficulty?: string };

function lockReason(started: number): string | null {
  if (started === 0) return null;
  return `${started} ${started === 1 ? "candidate has" : "candidates have"} started; questions and timing are locked. The title and instructions stay editable.`;
}

function formValues(exam: Exam) {
  return {
    title: exam.title,
    instructions: exam.instructions,
    opens_at: toPakistanInputValue(exam.opens_at),
    closes_at: toPakistanInputValue(exam.closes_at),
    duration_minutes: exam.duration_minutes,
    total_marks: exam.total_marks,
    shuffle_questions: exam.shuffle_questions,
    shuffle_options: exam.shuffle_options,
  };
}

export default async function ManageExamPage({ params, searchParams }: { params: Promise<{ examId: string }>; searchParams: Promise<Search> }) {
  const member = await requireMember("examiner", "institution_admin");
  const [{ examId }, search] = await Promise.all([params, searchParams]);
  const exam = await getExam(member, examId);
  const tab = parseExamTab(search.tab);
  const canEdit = can(member, "exam.edit", exam);
  const [paper, started] = await Promise.all([listExamQuestions(member, exam.id), countStartedAttempts(member, exam.id)]);
  const locked = lockReason(started);
  const phase = examPhase(exam);

  return (
    <div className="flex flex-col gap-2">
      <PageHeader
        back={{ href: "/manage", label: "Exams" }}
        title={exam.title}
        description={`${PHASE_LABEL[phase]} · ${formatPakistanTime(exam.opens_at)} to ${formatPakistanTime(exam.closes_at)} · ${exam.duration_minutes} min`}
      >
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="lg">
            <Link href={`/exams/${exam.id}/take?preview=1`}>Preview as candidate</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href={`/monitor/${exam.id}`}>Live monitor</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href={`/manage/${exam.id}/leak`}>Trace a leak</Link>
          </Button>
          {phase === "closed" && (
            <Button asChild variant="outline" size="lg">
              <Link href={`/marking/${exam.id}`}>Open marking</Link>
            </Button>
          )}
        </div>
      </PageHeader>
      {!canEdit && (
        <p className="pb-4 text-base text-muted-foreground">You can view this exam. Only the examiner who set it or an institution admin can change it.</p>
      )}
      <ExamTabs examId={exam.id} current={tab} />

      {tab === "details" && (
        <section className="max-w-3xl rounded-3xl bg-card p-4 md:p-6">
          <ExamForm action={updateExam.bind(null, exam.id)} values={formValues(exam)} submitLabel="Save details" lockedReason={locked} canEdit={canEdit} />
        </section>
      )}

      {tab === "papers" && <PapersPanel member={member} exam={exam} />}

      {tab === "candidates" &&<EnrollmentPanel examId={exam.id} view={await getEnrollment(member, exam.id)} canEdit={canEdit} />}

      {tab === "review" && <ReviewTab member={member} exam={exam} canEdit={canEdit} startedCount={started} />}

      {tab === "questions" && (
        <QuestionsTab member={member} exam={exam} search={search} isEditable={canEdit && !locked} locked={locked} paper={paper} />
      )}
    </div>
  );
}

async function ReviewTab({ member, exam, canEdit, startedCount }: { member: Member; exam: Exam; canEdit: boolean; startedCount: number }) {
  const review = await loadReview(member, exam);
  return (
    <div className="flex flex-col gap-4">
      <ReviewPanel exam={exam} questions={review.questions} checklist={runChecklist(review)} canEdit={canEdit} startedCount={startedCount} />
      <ModeratorPanel examId={exam.id} moderation={readModeration(exam)} canEdit={canEdit && exam.status === "draft"} />
    </div>
  );
}

async function QuestionsTab({
  member,
  exam,
  search,
  isEditable,
  locked,
  paper,
}: {
  member: Member;
  exam: Exam;
  search: Search;
  isEditable: boolean;
  locked: string | null;
  paper: Awaited<ReturnType<typeof listExamQuestions>>;
}) {
  const difficulty = DIFFICULTIES.includes(search.difficulty as Difficulty) ? (search.difficulty as Difficulty) : undefined;
  const topic = search.topic || undefined;
  const [bank, topics] = isEditable ? await Promise.all([listQuestions(member, { topic, difficulty }, false), listTopics(member)]) : [[], []];
  const inPaper = new Set(paper.map((question) => question.id));

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-4 rounded-3xl bg-card p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-medium">On this paper</h2>
          <MarksTotal paper={paper} totalMarks={exam.total_marks} />
        </div>
        {locked && <p className="text-base text-muted-foreground">{locked}</p>}
        <PaperList examId={exam.id} paper={paper} isEditable={isEditable} />
      </section>
      {isEditable && (
        <section className="flex flex-col gap-4 rounded-3xl bg-card p-4 md:p-6">
          <h2 className="text-xl font-medium">Add from your bank</h2>
          <BankPicker examId={exam.id} bank={bank.filter((question) => !inPaper.has(question.id))} topics={topics} topic={topic} difficulty={difficulty} />
        </section>
      )}
    </div>
  );
}
