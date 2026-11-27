"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { WrittenMarkState } from "./written-actions";
import type { WrittenItem } from "./written-data";

type WrittenFormProps = {
  item: WrittenItem;
  action: (previous: WrittenMarkState, formData: FormData) => Promise<WrittenMarkState>;
};

export function WrittenForm({ item, action }: WrittenFormProps) {
  const [state, formAction] = useActionState(action, null);
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="attempt_id" value={item.attempt_id} />
      <input type="hidden" name="question_id" value={item.question_id} />
      <div className="flex flex-col gap-2 sm:max-w-48">
        <Label htmlFor="marks">Marks out of {item.marks}</Label>
        <Input id="marks" name="marks" inputMode="decimal" required autoComplete="off" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="feedback">Feedback for the candidate (optional)</Label>
        <Textarea id="feedback" name="feedback" rows={2} />
      </div>
      {state && <FormMessage tone={state.status === "error" ? "error" : "done"}>{state.message}</FormMessage>}
      <SubmitButton size="lg" className="self-start">
        Save and next
      </SubmitButton>
    </form>
  );
}
