import { PageHeader } from "@/components/page-header";
import { requireMember } from "@/lib/access";
import { getExam } from "@/features/authoring/exams/data";
import { traceLeak } from "@/features/authoring/leak/actions";
import { LeakForm } from "@/features/authoring/leak/leak-form";

export default async function LeakPage({ params }: { params: Promise<{ examId: string }> }) {
  const member = await requireMember("examiner", "institution_admin");
  const { examId } = await params;
  const exam = await getExam(member, examId);
  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <PageHeader
        title={`Trace a leak: ${exam.title}`}
        description="Every candidate gets the questions in a different order. A leaked copy keeps its source's order, so it points to the paper it came from."
      />
      <section className="rounded-3xl bg-card p-4 md:p-6">
        <LeakForm action={traceLeak.bind(null, exam.id)} />
      </section>
    </div>
  );
}
