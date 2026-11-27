import { PageHeader } from "@/components/page-header";
import { requireMember } from "@/lib/access";
import { QuestionImportForm } from "@/features/authoring/questions/import-form";

export default async function ImportQuestionsPage() {
  await requireMember("examiner", "institution_admin");
  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <PageHeader title="Import questions" description="Check the file first. Nothing is saved until every question is clean." />
      <section className="rounded-3xl bg-card p-4 md:p-6">
        <QuestionImportForm />
      </section>
    </div>
  );
}
