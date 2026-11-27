"use client";

import { useActionState, useRef, useState } from "react";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addCandidate, type CandidateFormState } from "./actions";
import { candidateSchema, readCandidateForm } from "./schema";

export function CandidateForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [state, formAction] = useActionState(async (previous: CandidateFormState, formData: FormData) => {
    const next = await addCandidate(previous, formData);
    if (next?.status === "saved") formRef.current?.reset();
    return next;
  }, null);

  function checkBeforeSend(event: React.FormEvent<HTMLFormElement>) {
    const parsed = candidateSchema.safeParse(readCandidateForm(new FormData(event.currentTarget)));
    if (parsed.success) {
      setClientError(null);
      return;
    }
    event.preventDefault();
    setClientError(parsed.error.issues[0]?.message ?? "Check the candidate and try again.");
  }

  const message = clientError ?? (state?.status === "error" ? state.message : null);

  return (
    <form ref={formRef} action={formAction} onSubmit={checkBeforeSend} className="flex flex-col gap-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="full_name">Full name</Label>
          <Input id="full_name" name="full_name" autoComplete="off" className="h-11" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="roll_number">Roll number</Label>
          <Input id="roll_number" name="roll_number" inputMode="numeric" placeholder="0245" className="h-11" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="off" className="h-11" aria-describedby="email-hint" />
          <p id="email-hint" className="text-sm text-muted-foreground">
            The candidate signs in with this email to see their exams.
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cnic">CNIC</Label>
          <Input id="cnic" name="cnic" inputMode="numeric" placeholder="35202-1234567-3" className="h-11" aria-describedby="cnic-hint" />
          <p id="cnic-hint" className="text-sm text-muted-foreground">
            Only the first five digits and the last digit are kept.
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="extra_time_pct">Extra time (%)</Label>
          <Input id="extra_time_pct" name="extra_time_pct" type="number" inputMode="numeric" min={0} max={100} defaultValue={0} className="h-11" />
        </div>
      </div>
      {message && <FormMessage tone="error">{message}</FormMessage>}
      {state?.status === "saved" && !clientError && (
        <FormMessage tone="done">
          {state.name} is on the roster. They sign in with {state.email} to see their exams.
        </FormMessage>
      )}
      <SubmitButton size="lg" className="self-start">
        Add candidate
      </SubmitButton>
    </form>
  );
}
