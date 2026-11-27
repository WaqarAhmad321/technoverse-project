"use client";

import { BookOpenCheck, Info, PencilLine, Sparkles } from "lucide-react";
import { useActionState } from "react";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import type { TeachingReportState } from "./teaching-report-actions";

export function TeachingReportPanel({ action }: { action: () => Promise<TeachingReportState> }) {
  const [state, formAction, isPending] = useActionState(action, null);
  const report = state?.status === "done" ? state.report : null;
  return (
    <section aria-labelledby="teaching-heading" aria-busy={isPending} className="ai-panel flex flex-col gap-4 rounded-3xl bg-card p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="teaching-heading" className="flex items-center gap-2 text-xl font-medium">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Sparkles aria-hidden className="size-5" />
          </span>
          What to teach next
        </h2>
        <form action={formAction}>
          <SubmitButton size="lg">{report ? "Write it again" : "Write the teaching report"}</SubmitButton>
        </form>
      </div>
      {!report && !isPending && (
        <p className="text-base text-muted-foreground">
          Claude reads every question&apos;s numbers below and tells you what the class misunderstood, what to reteach first and which questions to rewrite.
        </p>
      )}
      {isPending && <p className="ai-working-text text-base">Reading 30 papers&apos; worth of answers…</p>}
      {state?.status === "error" && <FormMessage tone="error">{state.message}</FormMessage>}
      {report && (
        <div className="ai-arrive flex flex-col gap-4">
          <p className="text-lg font-medium">{report.headline}</p>
          {report.misconceptions.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="text-base font-medium">What the class misunderstood</h3>
              <ul className="flex flex-col gap-2">
                {report.misconceptions.map((item) => (
                  <li key={item.question} className="rounded-xl bg-muted px-4 py-3 text-base">
                    <span className="font-medium">{item.question}:</span> {item.what_they_think}{" "}
                    <span className="text-muted-foreground">{item.evidence}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {report.reteach_first.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="flex items-center gap-2 text-base font-medium">
                <BookOpenCheck aria-hidden className="size-4" /> Reteach first
              </h3>
              <ol className="flex list-decimal flex-col gap-1 pl-6 text-base">
                {report.reteach_first.map((topic) => (
                  <li key={topic}>{topic}</li>
                ))}
              </ol>
            </div>
          )}
          {report.rewrite.length > 0 && (
            <div className="flex flex-col gap-2">
              <h3 className="flex items-center gap-2 text-base font-medium">
                <PencilLine aria-hidden className="size-4" /> Questions to rewrite
              </h3>
              <ul className="flex flex-col gap-1 text-base">
                {report.rewrite.map((item) => (
                  <li key={item.question}>
                    <span className="font-medium">{item.question}:</span> {item.why}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Info aria-hidden className="size-4 shrink-0" />
            {state?.status === "done" && state.isRecorded ? "Recorded sample (demo mode), built from this exam's numbers." : "Written by Claude from this exam's statistics. Check it against what you saw in class."}
          </p>
        </div>
      )}
    </section>
  );
}
