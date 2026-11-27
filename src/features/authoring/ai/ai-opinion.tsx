import { CircleCheck, CircleMinus, Info, Sparkles } from "lucide-react";
import type { Member } from "@/lib/access";
import { isDemoMode } from "@/lib/demo";
import { getOrCreateAiMark } from "./data";
import type { WrittenToMark } from "./second-marker";

type AiOpinionProps = { member: Member; attemptId: string; questionId: string; item: WrittenToMark };

function PanelHeading({ source }: { source?: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h3 className="flex items-center gap-2 text-base font-medium">
        <span className="flex size-8 items-center justify-center rounded-lg bg-muted">
          <Sparkles aria-hidden className="size-4" />
        </span>
        Second opinion from the AI marker
      </h3>
      {source && <span className="text-sm text-muted-foreground">{source}</span>}
    </div>
  );
}

// Server component; wrap it in <Suspense> so the page never waits on the AI.
export async function AiOpinion({ member, attemptId, questionId, item }: AiOpinionProps) {
  const mark = await getOrCreateAiMark(member, attemptId, questionId, item);
  if (!mark) {
    return (
      <div className="flex flex-col gap-2 rounded-2xl border border-border p-4">
        <PanelHeading />
        <p className="text-base text-muted-foreground">The AI marker is unavailable right now. Mark as usual; nothing is lost.</p>
      </div>
    );
  }
  const source = isDemoMode() ? "Recorded sample (demo mode)" : "Marked by Claude, blind to your mark";
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border p-4" aria-label="AI second marker">
      <PanelHeading source={source} />
      <p className="text-base">
        <span className="font-medium">AI second marker: {mark.marks_awarded} of {item.marks}.</span> {mark.summary}
      </p>
      <ul aria-label="Marks per rubric line" className="flex flex-col gap-2">
        {mark.lines.map((line, index) => (
          <li key={index} className="flex gap-2 text-sm">
            {line.awarded > 0 ? (
              <CircleCheck aria-label="Earned" className="mt-0.5 size-4 shrink-0" />
            ) : (
              <CircleMinus aria-label="Not earned" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            )}
            <span>
              <span className="font-medium tabular-nums">{line.awarded}</span> for {line.criterion}
              {line.quote ? <span className="text-muted-foreground">: “{line.quote}”</span> : <span className="text-muted-foreground">: nothing in the answer earns it</span>}
            </span>
          </li>
        ))}
      </ul>
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Info aria-hidden className="size-4 shrink-0" />
        Advisory only. Your mark is the one that counts.
      </p>
    </div>
  );
}

export function AiOpinionLoading() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border p-4" aria-busy="true">
      <PanelHeading />
      <p className="animate-pulse text-base text-muted-foreground motion-reduce:animate-none">Reading the answer against the rubric…</p>
    </div>
  );
}
