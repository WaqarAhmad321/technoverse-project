"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { LeakState } from "./actions";

const PERCENT = 100;
const STRONG = 0.8;

export function LeakForm({ action }: { action: (previous: LeakState, formData: FormData) => Promise<LeakState> }) {
  const [state, formAction] = useActionState(action, null);
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="paste">Leaked paper (paste the text from the photo, WhatsApp or PDF)</Label>
        <Textarea id="paste" name="paste" rows={10} dir="auto" />
      </div>
      {state && "error" in state && <FormMessage tone="error">{state.error}</FormMessage>}
      <SubmitButton size="lg" className="self-start">
        Trace the leak
      </SubmitButton>
      {state && "matches" in state && (
        <div className="flex flex-col gap-2" aria-live="polite">
          <p className="text-base font-medium">
            Found {state.found} of this exam&apos;s {state.total} questions in the leak.
          </p>
          <ol aria-label="Likely sources" className="flex flex-col gap-1">
            {state.matches.map((match, index) => (
              <li key={match.attempt_id} className={`text-base ${index === 0 && match.share >= STRONG ? "font-medium" : "text-muted-foreground"}`}>
                Matches roll {match.roll}&apos;s order on {match.agree} of {match.matched} questions ({Math.round(match.share * PERCENT)}%)
              </li>
            ))}
          </ol>
        </div>
      )}
    </form>
  );
}
