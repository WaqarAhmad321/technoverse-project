import { PageHeader } from "@/components/page-header";
import { requireMember } from "@/lib/access";
import { sendChallenge } from "@/features/authoring/disputes/actions";
import { getMyResult } from "@/features/authoring/disputes/data";
import { ChallengeForm } from "@/features/authoring/disputes/forms";

export default async function NewDisputePage({ searchParams }: { searchParams: Promise<{ result?: string }> }) {
  const member = await requireMember("candidate");
  const { result: resultId = "" } = await searchParams;
  const result = await getMyResult(member, resultId);
  const questions = [...result.breakdown]
    .sort((a, b) => a.position - b.position)
    .map((line) => ({ id: line.question_id, label: `Q${line.position} · ${line.marks_awarded} of ${line.marks} marks` }));
  return (
    <div className="flex max-w-2xl flex-col gap-4">
      <PageHeader title="Challenge a question" description={`${result.examTitle}. A challenge can only raise marks, never lower them.`} />
      <section className="rounded-3xl bg-card p-4 md:p-6">
        <ChallengeForm action={sendChallenge.bind(null, result.id)} questions={questions} />
      </section>
    </div>
  );
}
