"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import type { PublishState } from "./publish-actions";

type PublishFormProps = {
  action: (previous: PublishState) => Promise<PublishState>;
  label: string;
  variant: "default" | "outline";
  isBlocked: boolean;
  blockedReason?: string;
};

export function PublishForm({ action, label, variant, isBlocked, blockedReason }: PublishFormProps) {
  const [state, formAction] = useActionState(action, null);
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* `|| undefined` keeps SubmitButton's own pending lock when nothing blocks. */}
        <SubmitButton size="lg" variant={variant} disabled={isBlocked || undefined}>
          {label}
        </SubmitButton>
        {isBlocked && blockedReason && <p className="text-base text-muted-foreground">{blockedReason}</p>}
      </div>
      {state && <FormMessage tone={state.status === "error" ? "error" : "done"}>{state.message}</FormMessage>}
    </form>
  );
}
