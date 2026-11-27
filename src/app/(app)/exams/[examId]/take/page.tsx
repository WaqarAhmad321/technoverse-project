import { loadMyExam, loadQuestionPreviews } from "@/features/delivery/data";
import { PageHeader } from "@/features/delivery/page-header";
import { requireMember } from "@/lib/access";
import { notFound } from "next/navigation";

// STAND-IN(waqar): read-only list of the paper until task 050 builds the workspace.
export default async function TakeExamPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;
  const member = await requireMember("candidate");
  const { exam, phase } = await loadMyExam(member, examId);
  if (phase !== "open") notFound();
  const questions = await loadQuestionPreviews(exam.id, member.institution.id);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <PageHeader title={exam.title} description={`${questions.length} questions · ${exam.duration_minutes} minutes`} />
      <ol className="flex flex-col gap-4">
        {questions.map((question) => (
          <li key={question.position} className="rounded-lg border p-4">
            <p className="text-base text-muted-foreground">Question {question.position} · {question.marks} marks</p>
            <p className="text-base">{question.body}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
