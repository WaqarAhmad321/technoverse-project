import { PageHeader } from "@/components/page-header";
import { requireMember } from "@/lib/access";
import { ImportForm } from "@/features/authoring/roster/import-form";

export default async function ImportCandidatesPage() {
  await requireMember("examiner", "institution_admin");
  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <PageHeader back={{ href: "/roster", label: "Roster" }} title="Import candidates" description="Check the file first. Nothing is saved until every row is clean." />
      <section className="rounded-3xl bg-card p-4 md:p-6">
        <ImportForm />
      </section>
    </div>
  );
}
