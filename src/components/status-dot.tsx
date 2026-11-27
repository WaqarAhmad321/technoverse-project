import { cn } from "@/lib/utils";

export type StatusTone = "live" | "ready" | "draft" | "done" | "warn";

const DOT_CLASS: Record<StatusTone, string> = {
  live: "bg-primary motion-safe:animate-pulse",
  ready: "bg-primary",
  draft: "bg-muted-foreground/60",
  done: "bg-foreground/40",
  warn: "bg-destructive",
};

// Status as a small dot plus words: quiet, readable, and never colour alone.
export function StatusDot({ tone, children, className }: { tone: StatusTone; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-sm", className)}>
      <span aria-hidden className={cn("size-2 shrink-0 rounded-full", DOT_CLASS[tone])} />
      {children}
    </span>
  );
}
