import { PageHeader } from "@/components/page-header";
import { requireMember } from "@/lib/access";
import { decideDispute } from "@/features/authoring/disputes/actions";
import { getDispute } from "@/features/authoring/disputes/data";
import { DecisionForm } from "@/features/authoring/disputes/forms";

export default async function DisputePage({ params }: { params: Promise<{ disputeId: string }> }) {
  const member = await requireMember("examiner", "institution_admin");
  const { disputeId } = await params;
  const dispute = await getDispute(member, disputeId);
  const key = (dispute.question.answer_key ?? []).map((id) => id.toUpperCase()).join(", ");
  const chose = dispute.choices.map((id) => id.toUpperCase()).join(", ") || "nothing";
  const others = dispute.question.options.filter((option) => !(dispute.question.answer_key ?? []).includes(option.id));
  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <PageHeader title={`Challenge on Q${dispute.position}`} description={`${dispute.examTitle} · Roll ${dispute.roll}`} />
      <section className="flex flex-col gap-3 rounded-3xl bg-card p-4 md:p-6">
        <p className="text-base font-medium">{dispute.question.body}</p>
        <ul className="flex flex-col gap-1 text-base">
          {dispute.question.options.map((option) => (
            <li key={option.id}>
              {option.id.toUpperCase()}. {option.text}
            </li>
          ))}
        </ul>
        <p className="text-base text-muted-foreground">
          Key: {key || "written"} · The candidate chose {chose} and got {dispute.awarded} of {dispute.question.marks}.
        </p>
        <blockquote className="border-l-2 border-border pl-4 text-base">{dispute.body}</blockquote>
      </section>
      <section className="rounded-3xl bg-card p-4 md:p-6">
        {dispute.status === "open" ? (
          <DecisionForm action={decideDispute.bind(null, dispute.id)} options={others} />
        ) : (
          <p className="text-base">
            {dispute.status === "upheld" ? "Upheld" : "Rejected"}: {dispute.decision_reason}
          </p>
        )}
      </section>
    </div>
  );
}
