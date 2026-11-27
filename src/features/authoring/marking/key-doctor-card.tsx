"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { DoctorFlag } from "../key-doctor";
import type { KeyFixState } from "./key-doctor-actions";

type KeyDoctorCardProps = {
  flag: DoctorFlag & { options: { id: string; text: string }[] };
  action: (previous: KeyFixState, formData: FormData) => Promise<KeyFixState>;
};

const PERCENT = 100;

export function KeyDoctorCard({ flag, action }: KeyDoctorCardProps) {
  const [state, formAction] = useActionState(action, null);
  const top = flag.topChoice?.toUpperCase();
  const keyText = flag.key.map((id) => id.toUpperCase()).join(" and ");
  const reasonId = `reason-${flag.question_id}`;
  return (
    <li className="flex flex-col gap-4 rounded-2xl border border-border p-4">
      <div className="flex flex-col gap-1">
        <p className="text-base font-medium">{flag.kind === "wrong_key" ? "Likely wrong key" : "Possibly ambiguous"}</p>
        <p className="text-base">{flag.summary}</p>
        <p className="text-sm text-muted-foreground">
          {Math.round(flag.difficulty * PERCENT)}% got it right · top minus bottom scorers: {flag.discrimination.toFixed(2)}
        </p>
      </div>
      <ul className="flex flex-col gap-1 text-base">
        {flag.options.map((option) => (
          <li key={option.id} className={flag.key.includes(option.id) || option.id === flag.topChoice ? "font-medium" : "text-muted-foreground"}>
            {option.id.toUpperCase()}. {option.text}
          </li>
        ))}
      </ul>
      <form action={formAction} className="flex flex-col gap-3">
        <input type="hidden" name="question_id" value={flag.question_id} />
        {flag.topChoice && <input type="hidden" name="option" value={flag.topChoice} />}
        <div className="flex flex-col gap-2">
          <Label htmlFor={reasonId}>Reason (shown on results)</Label>
          <Textarea id={reasonId} name="reason" rows={2} required />
        </div>
        {state && <FormMessage tone="error">{state.message}</FormMessage>}
        <div className="flex flex-wrap gap-2">
          {top && (
            <SubmitButton size="lg" name="choice" value="change_key">
              Change key to {top}
            </SubmitButton>
          )}
          {top && (
            <SubmitButton size="lg" variant="outline" name="choice" value="accept_both">
              Accept both {top} and {keyText}
            </SubmitButton>
          )}
          <SubmitButton size="lg" variant="outline" name="choice" value="full_marks">
            Give everyone full marks
          </SubmitButton>
          <SubmitButton size="lg" variant="outline" name="choice" value="drop">
            Drop the question
          </SubmitButton>
          <SubmitButton size="lg" variant="ghost" name="choice" value="keep">
            Keep the key
          </SubmitButton>
        </div>
      </form>
    </li>
  );
}
