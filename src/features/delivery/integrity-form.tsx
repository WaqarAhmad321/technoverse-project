"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { decideIntegrityCase, type DecisionState } from "./integrity-actions";

export function IntegrityDecisionForm({ examId, attemptId }: { examId: string; attemptId: string }) {
  const [state, action, isPending] = useActionState<DecisionState, FormData>(decideIntegrityCase, null);
  const noteId = `note-${attemptId}`;
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="examId" value={examId} />
      <input type="hidden" name="attemptId" value={attemptId} />
      <Label htmlFor={noteId}>Your note (required)</Label>
      <Textarea id={noteId} name="note" required maxLength={2000} rows={3} />
      {state && (
        <p role="alert" className="text-base">
          {state.message}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" name="decision" value="dismiss" variant="outline" size="lg" disabled={isPending}>
          Dismiss, nothing wrong
        </Button>
        <Button type="submit" name="decision" value="report" variant="outline" size="lg" disabled={isPending}>
          Report to the Unfair Means Committee
        </Button>
        <Button type="submit" name="decision" value="void" variant="outline" size="lg" disabled={isPending}>
          Void the attempt
        </Button>
      </div>
    </form>
  );
}
