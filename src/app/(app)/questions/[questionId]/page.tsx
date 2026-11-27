import { PageHeader } from "@/components/page-header";
import { requireMember } from "@/lib/access";
import { getQuestion, listTopics } from "@/features/authoring/questions/data";
import { DeleteQuestion } from "@/features/authoring/questions/delete-question";
import { QuestionForm } from "@/features/authoring/questions/question-form";

export default async function EditQuestionPage({ params }: { params: Promise<{ questionId: string }> }) {
  const member = await requireMember("examiner", "institution_admin");
  const { questionId } = await params;
  const [question, topics] = await Promise.all([getQuestion(member, questionId), listTopics(member)]);
  const usedIn = question.examTitles.length > 0 ? `Used in ${question.examTitles.join(", ")}.` : "Not used in any exam yet.";

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <PageHeader title="Edit question" description={`Version ${question.version}. ${usedIn}`} />
      <div className="rounded-3xl bg-card p-4 md:p-6">
        <QuestionForm question={question} topics={topics} />
      </div>
      <DeleteQuestion questionId={question.id} />
    </div>
  );
}
