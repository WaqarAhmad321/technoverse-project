import { PageHeader } from "@/components/page-header";
import { requireMember } from "@/lib/access";
import { createExam } from "@/features/authoring/exams/actions";
import { ExamForm, type ExamFormValues } from "@/features/authoring/exams/exam-form";
import { toPakistanInputValue } from "@/features/authoring/format";

const MS_PER_HOUR = 60 * 60 * 1000;
const DEFAULT_OPENS_IN_HOURS = 24;
const DEFAULT_WINDOW_HOURS = 3;

function defaults(): ExamFormValues {
  const opens = new Date(Math.ceil(Date.now() / MS_PER_HOUR) * MS_PER_HOUR + DEFAULT_OPENS_IN_HOURS * MS_PER_HOUR);
  const closes = new Date(opens.getTime() + DEFAULT_WINDOW_HOURS * MS_PER_HOUR);
  return {
    title: "",
    instructions: "Answer every question. Your answers save as you go, even if the connection drops.",
    opens_at: toPakistanInputValue(opens.toISOString()),
    closes_at: toPakistanInputValue(closes.toISOString()),
    duration_minutes: 60,
    total_marks: 50,
    shuffle_questions: true,
    shuffle_options: true,
  };
}

export default async function NewExamPage() {
  await requireMember("examiner", "institution_admin");
  return (
    <div className="max-w-3xl">
      <PageHeader back={{ href: "/manage", label: "Exams" }} title="New exam" description="Set the window and marks, then pick questions from your bank." />
      <div className="rounded-3xl bg-card p-4 md:p-6">
        <ExamForm action={createExam} values={defaults()} submitLabel="Create exam" lockedReason={null} canEdit />
      </div>
    </div>
  );
}
