"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CircleAlert } from "lucide-react";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Moderation, ModeratorFlag } from "../ai/moderator";
import { AiWorkingNote } from "../ai/ai-working-note";
import { dismissModeratorFlag, runModerator, type ModeratorState } from "./moderator-actions";

const KIND_LABEL: Record<ModeratorFlag["kind"], string> = {
  key: "Key looks wrong",
  ambiguous: "Could be read two ways",
  syllabus: "Outside the syllabus",
};

export function ModeratorPanel({ examId, moderation, canEdit }: { examId: string; moderation: Moderation | null; canEdit: boolean }) {
  const [state, formAction] = useActionState<ModeratorState, FormData>(runModerator.bind(null, examId), null);
  const open = (moderation?.flags ?? []).map((flag, index) => ({ flag, index })).filter(({ flag }) => !flag.dismissed);

  return (
    <section aria-labelledby="moderator-heading" className="ai-panel flex flex-col gap-4 rounded-3xl bg-card p-4 md:p-6">
      <div className="flex flex-col gap-1">
        <h2 id="moderator-heading" className="text-xl font-medium">
          AI moderator
        </h2>
        <p className="text-base text-muted-foreground">
          Out-of-syllabus and wrongly keyed questions cost students marks every year (MDCAT 2022: about 30 out-of-syllabus questions).
          Claude reads this paper as a candidate would, without the key: it answers every question and flags wrong keys, wording that
          can be read two ways, and questions outside your syllabus. You decide on each flag.
        </p>
      </div>
      {!moderation && !canEdit && <p className="text-base text-muted-foreground">The AI moderator has not checked this paper.</p>}
      {canEdit && (
        <form action={formAction} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="syllabus">Syllabus outline (optional)</Label>
            <Textarea
              id="syllabus"
              name="syllabus"
              rows={3}
              defaultValue={moderation?.syllabus ?? ""}
              placeholder="FSc Part-I Physics: Kinematics, Forces, Energy"
              className="text-base"
            />
          </div>
          <SubmitButton size="lg" variant="outline" className="self-start">
            {moderation ? "Check the paper again" : "Check the paper with AI"}
          </SubmitButton>
          <AiWorkingNote
            working="Claude is sitting the paper without the key and checking it against your syllabus…"
            idle="Takes about 15 seconds. Nothing changes until you act on a flag."
          />
          {state?.status === "error" && <FormMessage tone="error">{state.message}</FormMessage>}
          {state?.status === "done" && (
            <FormMessage tone="done">{state.open === 0 ? "The moderator found nothing to fix." : `The moderator raised ${state.open} ${state.open === 1 ? "point" : "points"}.`}</FormMessage>
          )}
        </form>
      )}
      {moderation && open.length === 0 && <p className="text-base">No open points from the moderator.</p>}
      {open.length > 0 && (
        <ul aria-label="Moderator flags" className="flex flex-col gap-2">
          {open.map(({ flag, index }) => (
            <li key={`${flag.question_id}-${flag.kind}`} className="ai-arrive flex flex-wrap items-start justify-between gap-3 rounded-xl bg-muted p-4">
              <span className="flex min-w-0 flex-1 gap-3">
                <CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
                <span className="flex flex-col">
                  <span className="text-base font-medium">{KIND_LABEL[flag.kind]}</span>
                  <span className="text-base">{flag.note}</span>
                </span>
              </span>
              {canEdit && (
                <span className="flex gap-2">
                  <Link href={`/questions/${flag.question_id}`} className="flex h-11 items-center rounded-full px-4 text-sm font-medium hover:bg-accent">
                    Edit question
                  </Link>
                  <form action={dismissModeratorFlag.bind(null, examId, index)}>
                    <SubmitButton variant="ghost" className="h-11 rounded-full px-4">
                      Dismiss
                    </SubmitButton>
                  </form>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
