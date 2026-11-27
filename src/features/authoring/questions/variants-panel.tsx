import { Check, X } from "lucide-react";
import { SubmitButton } from "@/components/submit-button";
import type { Question, QuestionVariant } from "@/lib/exam-types";
import { approveVariant, removeVariant } from "./variant-actions";
import { WriteVariantsButton } from "./write-variants-button";

function solveLine(variant: QuestionVariant): string {
  const key = variant.answer_key.map((id) => id.toUpperCase()).join(", ");
  return `Checked: two separate solves, blind to the key, both chose ${key}.`;
}

function VariantCard({ questionId, variant, index }: { questionId: string; variant: QuestionVariant; index: number }) {
  const isApproved = variant.status === "approved";
  return (
    <li className="flex flex-col gap-3 rounded-xl bg-muted p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium">
          Variant {index + 1} · {isApproved ? "Approved, goes on papers" : "Waiting for your approval"}
        </span>
        <span className="flex gap-1">
          {!isApproved && (
            <form action={approveVariant.bind(null, questionId, variant.key)}>
              <SubmitButton variant="outline" className="rounded-full" aria-label={`Approve variant ${index + 1}`}>
                <Check className="size-5" aria-hidden /> Approve
              </SubmitButton>
            </form>
          )}
          <form action={removeVariant.bind(null, questionId, variant.key)}>
            <SubmitButton variant="ghost" size="icon" className="size-11 rounded-full" aria-label={`Remove variant ${index + 1}`}>
              <X className="size-5" aria-hidden />
            </SubmitButton>
          </form>
        </span>
      </div>
      <p className="text-base">{variant.body}</p>
      <ul className="grid gap-1 sm:grid-cols-2">
        {variant.options.map((option) => {
          const isKey = variant.answer_key.includes(option.id);
          return (
            <li key={option.id} className={`flex items-center gap-2 text-base ${isKey ? "font-medium" : "text-muted-foreground"}`}>
              <span className="w-4 text-sm">{option.id.toUpperCase()}</span>
              {option.text}
              {isKey && <Check className="size-4" aria-label="correct" />}
            </li>
          );
        })}
      </ul>
      <p className="text-sm text-muted-foreground">{solveLine(variant)}</p>
    </li>
  );
}

export function VariantsPanel({ question }: { question: Question }) {
  const variants = (question.variants ?? []).filter((variant) => variant.source_version === question.version);
  const approved = variants.filter((variant) => variant.status === "approved").length;

  return (
    <section aria-labelledby="variants-title" className="flex flex-col gap-4 rounded-3xl bg-card p-4 md:p-6">
      <div className="flex flex-col gap-1">
        <h2 id="variants-title" className="text-xl font-medium">
          A different variant for each candidate
        </h2>
        <p className="text-base text-muted-foreground">
          Same idea and difficulty, different situation and numbers. A leaked paper or a shared answer then fits nobody else.
          {approved > 0 && ` Candidates are spread over ${approved + 1} forms: the original and ${approved} approved ${approved === 1 ? "variant" : "variants"}.`}
        </p>
      </div>
      {question.kind === "written" ? (
        <p className="text-base text-muted-foreground">Variants are for single-answer and multiple-select questions.</p>
      ) : (
        <>
          {variants.length > 0 && (
            <ol aria-label="Variants" className="flex flex-col gap-2">
              {variants.map((variant, index) => (
                <VariantCard key={variant.key} questionId={question.id} variant={variant} index={index} />
              ))}
            </ol>
          )}
          <WriteVariantsButton questionId={question.id} hasVariants={variants.length > 0} />
        </>
      )}
    </section>
  );
}
