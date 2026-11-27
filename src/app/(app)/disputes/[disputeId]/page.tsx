import { Scale } from "lucide-react";
import { FeatureSpotlight } from "@/components/feature-spotlight";
import { PageHeader } from "@/components/page-header";
import { StatusDot } from "@/components/status-dot";
import { requireMember } from "@/lib/access";
import { decideDispute } from "@/features/authoring/disputes/actions";
import { getDispute } from "@/features/authoring/disputes/data";
import { DecisionForm, WrittenDecisionForm } from "@/features/authoring/disputes/forms";
import { Suspense } from "react";
import { AiOpinion, AiOpinionLoading } from "@/features/authoring/ai/ai-opinion";

export default async function DisputePage({ params }: { params: Promise<{ disputeId: string }> }) {
  const member = await requireMember("examiner", "institution_admin");
  const { disputeId } = await params;
  const dispute = await getDispute(member, disputeId);
  const key = (dispute.question.answer_key ?? []).map((id) => id.toUpperCase()).join(", ");
  const chose = dispute.choices.map((id) => id.toUpperCase()).join(", ") || "nothing";
  const isWritten = dispute.question.kind === "written";
  const others = dispute.question.options.filter((option) => !(dispute.question.answer_key ?? []).includes(option.id));
  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <PageHeader back={{ href: "/disputes", label: "Disputes" }} title={`Challenge on Q${dispute.position}`} description={`${dispute.examTitle} · Roll ${dispute.roll}`} />
      <FeatureSpotlight
        icon={Scale}
        title="A challenge is a real re-read"
        problem="Paper rechecking costs candidates money and only re-counts the totals."
        answer="Here a challenge is free, can only raise a mark, and every change becomes a new result version with its reason, visible to the candidate and in the audit log."
      />
      <section className="flex flex-col gap-3 rounded-3xl bg-card p-4 md:p-6">
        <h2 className="text-xl font-medium">The question</h2>
        <p className="text-base font-medium">{dispute.question.body}</p>
        <ul className="flex flex-col gap-1 text-base">
          {dispute.question.options.map((option) => (
            <li key={option.id}>
              {option.id.toUpperCase()}. {option.text}
            </li>
          ))}
        </ul>
        <p className="text-base text-muted-foreground">
          {isWritten ? "Written answer" : `Key: ${key} · The candidate chose ${chose}`} · got {dispute.awarded} of {dispute.question.marks}.
        </p>
        {isWritten && (
          <div className="flex flex-col gap-1">
            <p className="text-sm text-muted-foreground">The candidate&apos;s answer</p>
            <p className="whitespace-pre-line rounded-xl bg-muted px-4 py-3 text-base">{dispute.answerText || "No answer given."}</p>
          </div>
        )}
        <p className="text-sm text-muted-foreground">The candidate&apos;s challenge</p>
        <blockquote className="border-l-2 border-border pl-4 text-base">{dispute.body}</blockquote>
        {isWritten && (
          <Suspense fallback={<AiOpinionLoading />}>
            <AiOpinion
              member={member}
              attemptId={dispute.attemptId}
              questionId={dispute.question_id ?? ""}
              item={{ body: dispute.question.body, rubric: dispute.question.rubric ?? "", marks: dispute.question.marks, answer: dispute.answerText }}
            />
          </Suspense>
        )}
      </section>
      <section className="flex flex-col gap-4 rounded-3xl bg-card p-4 md:p-6">
        <h2 className="text-xl font-medium">{dispute.status === "open" ? "Your decision" : "Decision"}</h2>
        {dispute.status === "open" ? (
          isWritten ? (
            <WrittenDecisionForm action={decideDispute.bind(null, dispute.id)} awarded={dispute.awarded} marks={dispute.question.marks} />
          ) : (
            <DecisionForm action={decideDispute.bind(null, dispute.id)} options={others} />
          )
        ) : (
          <div className="flex flex-col gap-2">
            <StatusDot tone={dispute.status === "upheld" ? "ready" : "done"} className="text-base text-foreground">
              {dispute.status === "upheld" ? "Upheld" : "Rejected"}
            </StatusDot>
            <p className="text-base text-muted-foreground">{dispute.decision_reason}</p>
          </div>
        )}
      </section>
    </div>
  );
}
