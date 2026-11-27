import type { LucideIcon } from "lucide-react";

type FeatureSpotlightProps = {
  icon: LucideIcon;
  title: string;
  /** The real-world problem, in one sentence. */
  problem: string;
  /** What this screen does about it, in one sentence. */
  answer: string;
  /** Optional live fact from this exam, such as "1 key flagged". */
  fact?: string;
};

// One per screen, at the top of a standout feature: says why it exists before the person uses it.
export function FeatureSpotlight({ icon: Icon, title, problem, answer, fact }: FeatureSpotlightProps) {
  return (
    <aside
      aria-label={title}
      className="flex flex-col gap-3 rounded-3xl border border-primary/30 bg-primary/5 p-5 md:flex-row md:items-start md:gap-5 md:p-6"
    >
      <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
        <Icon aria-hidden className="size-6" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h2 className="text-lg font-medium">{title}</h2>
        <p className="text-base text-muted-foreground">{problem}</p>
        <p className="text-base">{answer}</p>
      </div>
      {fact && <p className="shrink-0 text-base font-medium tabular-nums text-primary md:self-center">{fact}</p>}
    </aside>
  );
}
