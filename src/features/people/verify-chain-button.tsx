"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { verifyChain } from "./audit-actions";

export function VerifyChainButton() {
  const [state, formAction] = useActionState(verifyChain, null);
  return (
    <form action={formAction} className="flex flex-col items-start gap-2">
      <SubmitButton size="lg">Verify chain</SubmitButton>
      {state && <FormMessage tone={state.ok ? "done" : "error"}>{state.message}</FormMessage>}
    </form>
  );
}
