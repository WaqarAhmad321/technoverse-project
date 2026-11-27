"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { isActionError, useActionToast } from "@/components/use-action-toast";
import { verifyChain } from "./audit-actions";

export function VerifyChainButton() {
  const [state, formAction] = useActionState(verifyChain, null);
  useActionToast(state);
  return (
    <form action={formAction} className="flex flex-col items-start gap-2">
      <SubmitButton size="lg">Verify chain</SubmitButton>
      {isActionError(state) && <FormMessage tone="error">{state.message}</FormMessage>}
    </form>
  );
}
