import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/states";
import { requireMember } from "@/lib/access";
import { listDisputes } from "@/features/authoring/disputes/data";
import { plural } from "@/features/authoring/format";

const STATUS_LABEL = { open: "Open", upheld: "Upheld", rejected: "Rejected" } as const;

export default async function DisputesPage() {
  const member = await requireMember("examiner", "institution_admin");
  const disputes = await listDisputes(member);
  const open = disputes.filter((dispute) => dispute.status === "open");
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Disputes" description={`${plural(open.length, "open challenge")}. Challenges candidates raise from their published results.`} />
      {disputes.length === 0 ? (
        <EmptyState message="No disputes yet. When a candidate challenges a question on a published result, it appears here." />
      ) : (
        <ul aria-label="Challenges" className="flex flex-col rounded-3xl bg-card p-2 md:p-4">
          {disputes.map((dispute) => (
            <li key={dispute.id} className="border-b border-border last:border-0">
              <Link href={`/disputes/${dispute.id}`} className="flex min-h-14 items-center justify-between gap-4 px-3 py-2 hover:bg-accent">
                <span className="flex min-w-0 flex-col">
                  <span className="text-base">
                    {dispute.examTitle} · Q{dispute.position} · Roll {dispute.roll}
                  </span>
                  <span className="line-clamp-1 text-sm text-muted-foreground">{dispute.body}</span>
                </span>
                <span className="shrink-0 text-sm">{STATUS_LABEL[dispute.status]}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
