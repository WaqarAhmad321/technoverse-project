import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { StatusDot, type StatusTone } from "@/components/status-dot";
import { EmptyState } from "@/components/states";
import { requireMember } from "@/lib/access";
import { paginate } from "@/lib/pagination";
import { listDisputes } from "@/features/authoring/disputes/data";
import { plural } from "@/features/authoring/format";

const STATUS_LABEL = { open: "Open", upheld: "Upheld", rejected: "Rejected" } as const;
const STATUS_TONE: Record<keyof typeof STATUS_LABEL, StatusTone> = { open: "live", upheld: "ready", rejected: "done" };

export default async function DisputesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const member = await requireMember("examiner", "institution_admin");
  const [disputes, { page }] = await Promise.all([listDisputes(member), searchParams]);
  const open = disputes.filter((dispute) => dispute.status === "open");
  const shown = paginate(disputes, page);
  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Disputes" description={`${plural(open.length, "open challenge")}. Challenges candidates raise from their published results.`} />
      {disputes.length === 0 ? (
        <EmptyState message="No disputes yet. When a candidate challenges a question on a published result, it appears here." />
      ) : (
        <div className="rounded-3xl bg-card p-2 md:p-4">
          <ul aria-label="Challenges" className="flex flex-col">
            {shown.rows.map((dispute) => (
              <li key={dispute.id} className="border-b border-border last:border-0">
                <Link href={`/disputes/${dispute.id}`} className="flex min-h-14 items-center justify-between gap-4 rounded-xl px-3 py-2 transition-colors duration-200 hover:bg-accent">
                  <span className="flex min-w-0 flex-col">
                    <span className="text-base">
                      {dispute.examTitle} · Q{dispute.position} · Roll {dispute.roll}
                    </span>
                    <span className="line-clamp-1 text-sm text-muted-foreground">{dispute.body}</span>
                  </span>
                  <StatusDot tone={STATUS_TONE[dispute.status]} className="shrink-0 text-foreground">
                    {STATUS_LABEL[dispute.status]}
                  </StatusDot>
                </Link>
              </li>
            ))}
          </ul>
          <Pagination page={shown} basePath="/disputes" noun="challenges" />
        </div>
      )}
    </div>
  );
}
