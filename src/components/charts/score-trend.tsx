type Point = { exam: string; yours: number; classAverage: number };

const PLOT_HEIGHT_PX = 180;

// Dots are HTML so they stay round and labels stay readable at any width; only the thin lines are SVG.
export function ScoreTrend({ points }: { points: Point[] }) {
  const x = (index: number) => (points.length === 1 ? 50 : 8 + (index / (points.length - 1)) * 84);
  const line = (pick: (point: Point) => number) => points.map((point, index) => `${x(index)},${100 - pick(point)}`).join(" ");
  return (
    <div className="flex flex-col gap-3">
      <div className="relative mt-5" style={{ height: PLOT_HEIGHT_PX }}>
        {[0, 50, 100].map((tick) => (
          <div key={tick} className="absolute inset-x-0 border-t border-border" style={{ top: `${100 - tick}%` }}>
            <span className="absolute -top-2.5 left-0 bg-card pr-1 text-xs text-muted-foreground">{tick}%</span>
          </div>
        ))}
        {points.length > 1 && (
          <svg className="absolute inset-0 size-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
            <polyline points={line((p) => p.classAverage)} fill="none" stroke="var(--chart-4)" strokeWidth="2" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />
            <polyline points={line((p) => p.yours)} fill="none" stroke="var(--chart-1)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          </svg>
        )}
        {points.map((point, index) => (
          <div key={`${point.exam}-${index}`} title={`${point.exam}: you ${point.yours}%, class ${point.classAverage}%`}>
            <span className="absolute size-2.5 -translate-x-1/2 translate-y-1/2 rounded-full bg-chart-4 ring-2 ring-card" style={{ left: `${x(index)}%`, bottom: `${point.classAverage}%` }} />
            <span className="absolute size-3 -translate-x-1/2 translate-y-1/2 rounded-full bg-chart-1 ring-2 ring-card" style={{ left: `${x(index)}%`, bottom: `${point.yours}%` }} />
            <span className="absolute -translate-x-1/2 text-xs font-medium tabular-nums" style={{ left: `${x(index)}%`, bottom: `calc(${point.yours}% + 12px)` }}>
              {point.yours}%
            </span>
          </div>
        ))}
      </div>
      <div className="relative h-5 text-xs text-muted-foreground">
        {points.map((point, index) => (
          <span key={`${point.exam}-${index}`} className="absolute max-w-28 -translate-x-1/2 truncate" style={{ left: `${x(index)}%` }}>
            {point.exam}
          </span>
        ))}
      </div>
      <p className="flex gap-5 text-sm text-muted-foreground">
        <span className="flex items-center gap-2"><span className="h-0.5 w-5 rounded bg-chart-1" /> You</span>
        <span className="flex items-center gap-2"><span className="h-0.5 w-5 rounded border-t-2 border-dashed border-chart-4" /> Class average</span>
      </p>
    </div>
  );
}
