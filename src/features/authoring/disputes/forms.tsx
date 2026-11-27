"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { selectClass } from "../format";
import type { DisputeFormState } from "./actions";
import { ThemedSelect } from "@/components/themed-select";

type Action = (previous: DisputeFormState, formData: FormData) => Promise<DisputeFormState>;

export function ChallengeForm({ action, questions }: { action: Action; questions: { id: string; label: string }[] }) {
  const [state, formAction] = useActionState(action, null);
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="question_id">Question</Label>
        <ThemedSelect id="question_id" name="question_id" className={selectClass} defaultValue="">
          <option value="" disabled>
            Choose a question
          </option>
          {questions.map((question) => (
            <option key={question.id} value={question.id}>
              {question.label}
            </option>
          ))}
        </ThemedSelect>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="body">What is wrong with it?</Label>
        <Textarea id="body" name="body" rows={4} />
      </div>
      {state && <FormMessage tone="error">{state.message}</FormMessage>}
      <SubmitButton size="lg" className="self-start">
        Send challenge
      </SubmitButton>
    </form>
  );
}

export function DecisionForm({ action, options }: { action: Action; options: { id: string; text: string }[] }) {
  const [state, formAction] = useActionState(action, null);
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="option">If you uphold it, also accept</Label>
        <ThemedSelect id="option" name="option" className={selectClass}>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.id.toUpperCase()}. {option.text}
            </option>
          ))}
        </ThemedSelect>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="reason">Reason (the candidate sees it)</Label>
        <Textarea id="reason" name="reason" rows={2} />
      </div>
      {state && <FormMessage tone="error">{state.message}</FormMessage>}
      <div className="flex flex-wrap gap-2">
        <SubmitButton size="lg" name="decision" value="accept_both">
          Uphold: accept both answers
        </SubmitButton>
        <SubmitButton size="lg" variant="outline" name="decision" value="full_marks">
          Uphold: full marks for everyone
        </SubmitButton>
        <SubmitButton size="lg" variant="ghost" name="decision" value="reject">
          Reject
        </SubmitButton>
      </div>
    </form>
  );
}

export function WrittenDecisionForm({ action, awarded, marks }: { action: Action; awarded: number; marks: number }) {
  const [state, formAction] = useActionState(action, null);
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:max-w-48">
        <Label htmlFor="marks">New mark out of {marks}</Label>
        <Input id="marks" name="marks" inputMode="decimal" defaultValue={String(awarded)} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="reason">Reason (the candidate sees it)</Label>
        <Textarea id="reason" name="reason" rows={2} />
      </div>
      {state && <FormMessage tone="error">{state.message}</FormMessage>}
      <div className="flex flex-wrap gap-2">
        <SubmitButton size="lg" name="decision" value="raise_mark">
          Uphold: award this mark
        </SubmitButton>
        <SubmitButton size="lg" variant="ghost" name="decision" value="reject">
          Reject
        </SubmitButton>
      </div>
    </form>
  );
}
