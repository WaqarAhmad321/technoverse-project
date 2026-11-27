import { cn } from "@/lib/utils";

// The mark: an exam sheet with a tick, in the accent colour. Plain shapes, so it scales and themes.
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-8 shrink-0", className)}>
      <rect x="2" y="2" width="28" height="28" rx="9" className="fill-primary" />
      <path d="M10 10.5h12M10 15h8" strokeWidth="2.2" strokeLinecap="round" className="stroke-primary-foreground" />
      <path d="M11 21.2l3 3 6.5-6.7" fill="none" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="stroke-primary-foreground" />
    </svg>
  );
}

export function Logo({ showWordmark = true, className }: { showWordmark?: boolean; className?: string }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      {showWordmark && (
        <span className="flex items-baseline gap-2 whitespace-nowrap">
          <span className="text-lg font-medium tracking-tight">Imtihaan</span>
          <span lang="ur" className="text-sm text-muted-foreground">
            امتحان
          </span>
        </span>
      )}
    </span>
  );
}
