import type { Member } from "@/lib/access";
import { getOrCreateAiMark } from "./data";
import type { WrittenToMark } from "./second-marker";

type AiOpinionProps = { member: Member; attemptId: string; questionId: string; item: WrittenToMark };

// Server component; wrap it in <Suspense> so the page never waits on the AI.
export async function AiOpinion({ member, attemptId, questionId, item }: AiOpinionProps) {
  const mark = await getOrCreateAiMark(member, attemptId, questionId, item);
  if (!mark) return <p className="text-base text-muted-foreground">AI second marker is unavailable right now. Mark as usual.</p>;
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border p-4" aria-label="AI second marker">
      <p className="text-base">
        <span className="font-medium">AI second marker: {mark.marks_awarded} of {item.marks}.</span> {mark.summary}
      </p>
      <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
        {mark.lines.map((line, index) => (
          <li key={index}>
            {line.awarded} for “{line.criterion}”{line.quote ? `: “${line.quote}”` : ": nothing in the answer earns it"}
          </li>
        ))}
      </ul>
      <p className="text-sm text-muted-foreground">Advisory only. Your mark is the one that counts.</p>
    </div>
  );
}

export function AiOpinionLoading() {
  return <p className="text-base text-muted-foreground" aria-busy="true">The AI second marker is reading this answer…</p>;
}
