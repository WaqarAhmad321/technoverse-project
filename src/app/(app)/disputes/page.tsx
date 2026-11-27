import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/states";
import { requireMember } from "@/lib/access";

export default async function DisputesPage() {
  await requireMember("examiner", "institution_admin");
  return (
    <div>
      <PageHeader title="Disputes" description="Challenges candidates raise from their published results." />
      <EmptyState message="No disputes yet. When a candidate challenges a question on a published result, it appears here." />
    </div>
  );
}
