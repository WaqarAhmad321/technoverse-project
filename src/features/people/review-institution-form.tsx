"use client";

import { Check, X } from "lucide-react";
import { useActionState } from "react";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { isActionError, useActionToast } from "@/components/use-action-toast";
import { reviewInstitution } from "./platform-actions";

export function ReviewInstitutionForm({ institutionId, name }: { institutionId: string; name: string }) {
  const [state, formAction] = useActionState(reviewInstitution, null);
  useActionToast(state);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="institutionId" value={institutionId} />
      <div className="flex flex-wrap items-center gap-2">
        <Input name="note" aria-label={`Note for ${name}`} placeholder="Note (needed to reject)" className="h-10 min-w-48 flex-1" />
        <SubmitButton name="decision" value="approve">
          <Check aria-hidden className="size-4" />
          Approve
        </SubmitButton>
        <SubmitButton name="decision" value="reject" variant="outline">
          <X aria-hidden className="size-4" />
          Reject
        </SubmitButton>
      </div>
      {isActionError(state) && <FormMessage tone="error">{state.message}</FormMessage>}
    </form>
  );
}
