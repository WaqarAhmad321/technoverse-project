"use client";

import { Check, Undo2 } from "lucide-react";
import { useActionState } from "react";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { isActionError, useActionToast } from "@/components/use-action-toast";
import { decideApproval } from "./actions";

export function DecisionForm({ approvalId }: { approvalId: string }) {
  const [state, formAction] = useActionState(decideApproval, null);
  useActionToast(state);

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-3xl bg-card p-4 md:p-6">
      <h2 className="text-xl font-medium">Your decision</h2>
      <input type="hidden" name="approvalId" value={approvalId} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="decision-comment">Note for the examiner</Label>
        <Textarea id="decision-comment" name="comment" rows={3} placeholder="Required when you send it back: say what needs to change." />
      </div>
      {isActionError(state) && <FormMessage tone="error">{state.message}</FormMessage>}
      <div className="flex flex-wrap gap-2">
        <SubmitButton name="decision" value="approve" size="lg">
          <Check aria-hidden className="size-5" />
          Approve
        </SubmitButton>
        <SubmitButton name="decision" value="return" size="lg" variant="outline">
          <Undo2 aria-hidden className="size-5" />
          Send back
        </SubmitButton>
      </div>
    </form>
  );
}
