import { PageHeader } from "@/components/page-header";
import { requireMember } from "@/lib/access";
import { listTopics } from "@/features/authoring/questions/data";
import { QuestionForm } from "@/features/authoring/questions/question-form";

export default async function NewQuestionPage() {
  const member = await requireMember("examiner", "institution_admin");
  const topics = await listTopics(member);
  return (
    <div className="max-w-3xl">
      <PageHeader back={{ href: "/questions", label: "Question bank" }} title="Add question" description="It goes into your bank, ready for any exam." />
      <div className="rounded-3xl bg-card p-4 md:p-6">
        <QuestionForm question={null} topics={topics} />
      </div>
    </div>
  );
}
