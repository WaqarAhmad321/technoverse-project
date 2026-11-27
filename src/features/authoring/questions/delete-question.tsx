"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { deleteQuestion, type DeleteQuestionState } from "./actions";

export function DeleteQuestion({ questionId }: { questionId: string }) {
  const [state, formAction] = useActionState<DeleteQuestionState, FormData>(deleteQuestion.bind(null, questionId), null);
  return (
    <form action={formAction} className="flex flex-col gap-2">
      <SubmitButton variant="outline" size="lg" className="self-start text-destructive">
        Delete question
      </SubmitButton>
      {state?.status === "error" && <FormMessage tone="error">{state.message}</FormMessage>}
    </form>
  );
}
