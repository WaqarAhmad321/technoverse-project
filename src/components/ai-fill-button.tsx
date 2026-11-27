"use client";

import { Sparkles } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

export type DraftResult = { text: string } | { error: string };

type AiFillButtonProps = {
  /** The id of the textarea or input this fills. */
  targetId: string;
  /** Gets the draft. Receives what the person has typed so far, so the AI rephrases it instead of replacing it. */
  run: (current: string) => Promise<DraftResult>;
};

function fieldOf(id: string): HTMLTextAreaElement | HTMLInputElement | null {
  return document.getElementById(id) as HTMLTextAreaElement | HTMLInputElement | null;
}

// Fills a field with a draft and stops there: the person reads it, edits it and saves it themselves.
export function AiFillButton({ targetId, run }: AiFillButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const [hasText, setHasText] = useState(false);

  function fill() {
    const field = fieldOf(targetId);
    const current = field?.value.trim() ?? "";
    setHasText(current.length > 0);
    startTransition(async () => {
      const result = await run(current);
      if ("error" in result) {
        setNote(result.error);
        return;
      }
      const target = fieldOf(targetId);
      if (!target) return;
      target.value = result.text;
      target.dispatchEvent(new Event("input", { bubbles: true }));
      target.focus();
      setHasText(true);
      setNote("AI draft. Read it and change anything before you save.");
    });
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <Button type="button" variant="ghost" size="sm" onClick={fill} disabled={isPending} aria-busy={isPending} className="h-9 rounded-full">
        <Sparkles aria-hidden className="size-4 text-primary" />
        {isPending ? "Writing…" : hasText ? "Rephrase with AI" : "Fill with AI"}
      </Button>
      {note && (
        <span role="status" className="text-sm text-muted-foreground">
          {note}
        </span>
      )}
    </span>
  );
}
