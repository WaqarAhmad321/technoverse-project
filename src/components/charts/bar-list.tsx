import type { Bar } from "@/lib/dashboard-data";

type Props = { bars: Bar[]; max?: number; suffix?: string; highlightBelow?: number };

// Thin horizontal bars with the name above and the value at the end: direct labels, no legend.
export function BarList({ bars, max, suffix = "", highlightBelow }: Props) {
  const scale = max ?? Math.max(1, ...bars.map((bar) => bar.value));
  return (
    <ul className="flex flex-col gap-4">
      {bars.map((bar) => (
        <li key={bar.label} className="flex flex-col gap-1.5" title={bar.detail ? `${bar.label}: ${bar.detail}` : `${bar.label}: ${bar.value}${suffix}`}>
          <div className="flex items-baseline justify-between gap-4 text-sm">
            <span className="min-w-0 truncate text-foreground">{bar.label}</span>
            <span className="shrink-0 font-medium tabular-nums">
              {bar.value}
              {suffix}
              {bar.detail && <span className="ml-2 font-normal text-muted-foreground">{bar.detail}</span>}
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted">
            <div
              className={`h-2 rounded-full ${highlightBelow !== undefined && bar.value < highlightBelow ? "bg-chart-4" : "bg-chart-1"}`}
              style={{ width: `${Math.max(bar.value > 0 ? 2 : 0, (bar.value / scale) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
