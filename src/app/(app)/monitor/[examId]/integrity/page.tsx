import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/states";
import { loadExamForStaff } from "@/features/delivery/data";
import { loadIntegrityRows } from "@/features/delivery/integrity-data";
import { IntegrityDecisionForm } from "@/features/delivery/integrity-form";
import { can, requireMember } from "@/lib/access";
import { formatPkt } from "@/lib/format";
import { describeSignal } from "@/lib/integrity";

const STATUS_TEXT = {
  open: "Not decided yet",
  dismissed: "Dismissed: nothing wrong",
  reported: "Reported to the Unfair Means Committee",
  voided: "Attempt voided",
} as const;

export default async function IntegrityPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;
  const member = await requireMember("examiner", "institution_admin", "controller");
  const exam = await loadExamForStaff(member, examId);
  if (!can(member, "exam.monitor", exam)) notFound();
  const rows = await loadIntegrityRows(member, exam.id);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        back={{ href: `/monitor/${exam.id}`, label: "Live monitor" }}
        title="Integrity review"
        description={`${exam.title}. These are signals for review, not evidence. Nothing here is a penalty until you decide.`}
      />
      {rows.length === 0 ? (
        <EmptyState message="Nothing to review. No candidate has signals worth a second look on this exam." />
      ) : (
        rows.map((row) => (
          <section key={row.attemptId} aria-label={row.candidateName} className="flex flex-col gap-4 rounded-3xl bg-card p-4 md:p-6">
            <div>
              <h2 className="text-xl font-medium">
                {row.candidateName} <span className="text-base text-muted-foreground">{row.rollNumber}</span>
              </h2>
              <p className="text-base text-muted-foreground">
                {row.level === "review" ? "Worth a closer look" : row.level === "low" ? "A few signals" : "Signals fell below the threshold"} · {STATUS_TEXT[row.status]}
              </p>
              {row.reasons.length > 0 && <p className="mt-2 text-base">{row.reasons.join(". ")}.</p>}
            </div>
            <ol className="flex flex-col gap-1 text-base">
              {row.signals.map((signal) => (
                <li key={`${signal.kind}-${signal.occurred_at}`}>
                  <span className="text-sm text-muted-foreground">{formatPkt(signal.occurred_at)} · </span>
                  {describeSignal(signal)}
                </li>
              ))}
            </ol>
            {row.status === "open" ? (
              <IntegrityDecisionForm examId={exam.id} attemptId={row.attemptId} />
            ) : (
              <p className="text-base">Your note: {row.decisionNote}</p>
            )}
          </section>
        ))
      )}
    </div>
  );
}
