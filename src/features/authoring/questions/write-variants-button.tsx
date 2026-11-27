"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { writeQuestionVariants, type VariantRunState } from "./variant-actions";

function doneMessage(kept: number, dropped: number): string {
  const keptLine = `${kept} ${kept === 1 ? "variant passed" : "variants passed"} the check.`;
  return dropped > 0 ? `${keptLine} ${dropped} failed it and were thrown away.` : keptLine;
}

export function WriteVariantsButton({ questionId, hasVariants }: { questionId: string; hasVariants: boolean }) {
  const [state, formAction] = useActionState<VariantRunState, FormData>(() => writeQuestionVariants(questionId), null);
  return (
    <form action={formAction} className="flex flex-col gap-2">
      <SubmitButton size="lg" variant="outline" className="self-start">
        {hasVariants ? "Write more variants" : "Write variants"}
      </SubmitButton>
      <p className="text-sm text-muted-foreground">
        Takes about half a minute: each variant is solved twice without seeing its key.
      </p>
      {state?.status === "error" && <FormMessage tone="error">{state.message}</FormMessage>}
      {state?.status === "done" && <FormMessage tone="done">{doneMessage(state.kept, state.dropped)}</FormMessage>}
    </form>
  );
}
