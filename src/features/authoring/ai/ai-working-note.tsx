"use client";

import { useFormStatus } from "react-dom";

// Inside an AI form: says what Claude is doing while it works, and what the wait buys at rest.
export function AiWorkingNote({ working, idle }: { working: string; idle: string }) {
  const { pending } = useFormStatus();
  return (
    <p aria-live="polite" className={`text-base ${pending ? "ai-working-text text-foreground" : "text-muted-foreground"}`}>
      {pending ? working : idle}
    </p>
  );
}
