"use client";

import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ExamFormState } from "./actions";
import { examSchema, readExamForm } from "./schema";

export type ExamFormValues = {
  title: string;
  instructions: string;
  opens_at: string;
  closes_at: string;
  duration_minutes: number;
  total_marks: number;
  shuffle_questions: boolean;
  shuffle_options: boolean;
};

type Props = {
  action: (previous: ExamFormState, formData: FormData) => Promise<ExamFormState>;
  values: ExamFormValues;
  submitLabel: string;
  lockedReason: string | null;
  canEdit: boolean;
};

export function ExamForm({ action, values, submitLabel, lockedReason, canEdit }: Props) {
  const [state, formAction] = useActionState(action, null);
  const [clientError, setClientError] = useState<string | null>(null);
  const isTimingLocked = lockedReason !== null;
  useEffect(() => {
    if (state?.status === "saved") toast.success("Exam details saved.");
  }, [state]);

  function checkBeforeSend(event: React.FormEvent<HTMLFormElement>) {
    const parsed = examSchema.safeParse(readExamForm(new FormData(event.currentTarget)));
    if (parsed.success) {
      setClientError(null);
      return;
    }
    event.preventDefault();
    setClientError(parsed.error.issues[0]?.message ?? "Check the exam and try again.");
  }

  const message = clientError ?? (state?.status === "error" ? state.message : null);

  return (
    <form action={formAction} onSubmit={checkBeforeSend} className="flex flex-col gap-5" noValidate>
      <fieldset disabled={!canEdit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" defaultValue={values.title} placeholder="Physics Final" className="h-11" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="instructions">Instructions for candidates</Label>
          <Textarea id="instructions" name="instructions" rows={4} defaultValue={values.instructions} className="text-base" />
        </div>
        {isTimingLocked && <p className="text-sm text-muted-foreground">{lockedReason}</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="opens_at">Opens (Pakistan time)</Label>
            <Input id="opens_at" name="opens_at" type="datetime-local" defaultValue={values.opens_at} readOnly={isTimingLocked} className="h-11" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="closes_at">Closes (Pakistan time)</Label>
            <Input id="closes_at" name="closes_at" type="datetime-local" defaultValue={values.closes_at} readOnly={isTimingLocked} className="h-11" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="duration_minutes">Duration in minutes</Label>
            <Input id="duration_minutes" name="duration_minutes" type="number" inputMode="numeric" min={1} defaultValue={values.duration_minutes} readOnly={isTimingLocked} className="h-11" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="total_marks">Total marks</Label>
            <Input id="total_marks" name="total_marks" type="number" inputMode="numeric" min={1} defaultValue={values.total_marks} readOnly={isTimingLocked} className="h-11" />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="flex min-h-11 items-center gap-3">
            <input type="checkbox" name="shuffle_questions" defaultChecked={values.shuffle_questions} disabled={isTimingLocked} className="size-5 accent-primary" />
            Shuffle the question order for each candidate
          </label>
          <label className="flex min-h-11 items-center gap-3">
            <input type="checkbox" name="shuffle_options" defaultChecked={values.shuffle_options} disabled={isTimingLocked} className="size-5 accent-primary" />
            Shuffle the options inside each question
          </label>
          {isTimingLocked && (
            <>
              {values.shuffle_questions && <input type="hidden" name="shuffle_questions" value="on" />}
              {values.shuffle_options && <input type="hidden" name="shuffle_options" value="on" />}
            </>
          )}
        </div>
        {message && <FormMessage tone="error">{message}</FormMessage>}
        <SubmitButton size="lg" className="self-start">
          {submitLabel}
        </SubmitButton>
      </fieldset>
    </form>
  );
}
