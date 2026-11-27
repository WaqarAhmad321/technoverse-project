import { Check } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatusDot } from "@/components/status-dot";
import { DecisionForm } from "@/features/governance/decision-form";
import { loadApproval, loadPaperForReview, loadResultsPreview } from "@/features/governance/data";
import { can, requireMember } from "@/lib/access";
import { formatMarks, formatPkt } from "@/lib/format";
import { cn } from "@/lib/utils";

const PERCENT = 100;

export default async function ApprovalPage({ params }: { params: Promise<{ approvalId: string }> }) {
  const { approvalId } = await params;
  const member = await requireMember("controller");
  const row = await loadApproval(member, approvalId);
  const { approval, exam } = row;
  const isPaper = approval.kind === "paper";
  const [paper, preview] = await Promise.all([isPaper ? loadPaperForReview(exam.id) : [], isPaper ? null : loadResultsPreview(exam)]);
  const canDecide = approval.status === "pending" && can(member, isPaper ? "paper.approve" : "results.approve", { institution_id: member.institution.id, user_id: exam.user_id });
  const paperMarks = paper.reduce((sum, line) => sum + line.marks, 0);

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <PageHeader
        back={{ href: "/approvals", label: "Approvals" }}
        title={`${isPaper ? "Exam paper" : "Results"}: ${exam.title}`}
        description={`Sent by ${row.requesterName} on ${formatPkt(approval.created_at)}.`}
      />

      {approval.status !== "pending" && (
        <p className="rounded-3xl bg-card p-4 text-base">
          <StatusDot tone={approval.status === "approved" ? "ready" : "warn"}>
            {approval.status === "approved" ? "Approved" : "Sent back"} by {row.deciderName ?? "a controller"}
            {approval.decided_at ? ` on ${formatPkt(approval.decided_at)}` : ""}
            {approval.comment ? `: “${approval.comment}”` : ""}
          </StatusDot>
        </p>
      )}

      {isPaper ? (
        <section className="flex flex-col gap-3" aria-labelledby="paper">
          <h2 id="paper" className="text-xl font-medium">
            The paper · {paper.length} questions · {paperMarks} of {exam.total_marks} marks
          </h2>
          <ol className="flex flex-col gap-2">
            {paper.map((line) => (
              <li key={line.position} className="flex flex-col gap-2 rounded-2xl bg-card p-5">
                <p className="text-sm text-muted-foreground">
                  Q{line.position} · {line.topic} · {line.difficulty} · {line.marks} marks
                </p>
                <p className="text-base font-medium">{line.body}</p>
                {line.options.length > 0 && (
                  <ul className="flex flex-col gap-1">
                    {line.options.map((option) => {
                      const isKey = line.key.includes(option.id);
                      return (
                        <li key={option.id} className={cn("flex items-center gap-2 rounded-xl px-3 py-2 text-base", isKey ? "bg-primary/15" : "bg-muted/60")}>
                          {isKey && <Check aria-label="Answer key" className="size-4 text-primary" />}
                          {option.text}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        </section>
      ) : (
        preview && (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="What candidates would get">
            {[
              { label: "Candidates", value: String(preview.candidates) },
              { label: "Average", value: `${formatMarks(Math.round(preview.average * 100) / 100)} of ${preview.maxTotal}` },
              { label: "Highest / lowest", value: `${formatMarks(preview.highest)} / ${formatMarks(preview.lowest)}` },
              { label: "Pass rate (33%)", value: `${Math.round(preview.passRate * PERCENT)}%` },
            ].map((tile) => (
              <div key={tile.label} className="flex flex-col gap-1 rounded-3xl bg-card p-5">
                <span className="text-2xl font-medium tracking-tight">{tile.value}</span>
                <span className="text-sm text-muted-foreground">{tile.label}</span>
              </div>
            ))}
          </section>
        )
      )}

      {canDecide ? (
        <DecisionForm approvalId={approval.id} />
      ) : (
        approval.status === "pending" && <p className="text-base text-muted-foreground">You set this exam, so another controller has to decide.</p>
      )}
    </div>
  );
}
