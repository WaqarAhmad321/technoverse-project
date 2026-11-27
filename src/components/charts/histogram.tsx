import { PASS_PERCENT, type Bin } from "@/lib/dashboard-data";

const PLOT_HEIGHT_PX = 160;

export function Histogram({ bins }: { bins: Bin[] }) {
  const top = Math.max(1, ...bins.map((bin) => bin.count));
  return (
    <div className="flex flex-col gap-2">
      <div className="relative" style={{ height: PLOT_HEIGHT_PX + 20 }}>
        <div className="absolute inset-x-0 bottom-5 flex items-end gap-1.5" style={{ height: PLOT_HEIGHT_PX }}>
          {bins.map((bin) => (
            <div
              key={bin.from}
              className="flex h-full flex-1 flex-col items-center justify-end gap-1"
              title={`${bin.from}-${bin.to}%: ${bin.count} ${bin.count === 1 ? "candidate" : "candidates"}`}
            >
              {bin.count > 0 && <span className="text-xs font-medium tabular-nums">{bin.count}</span>}
              <div
                className={`w-full rounded-t-md ${bin.passing ? "bg-chart-1" : "bg-chart-4"}`}
                style={{ height: `${(bin.count / top) * 85}%`, minHeight: bin.count > 0 ? 4 : 1 }}
              />
            </div>
          ))}
        </div>
        <div className="absolute bottom-5 border-l border-dashed border-foreground/60" style={{ left: `${PASS_PERCENT}%`, height: PLOT_HEIGHT_PX }} />
        <span className="absolute top-0 -translate-x-1/2 text-xs text-muted-foreground" style={{ left: `${PASS_PERCENT}%` }}>
          Pass mark {PASS_PERCENT}%
        </span>
        <div className="absolute inset-x-0 bottom-0 flex justify-between text-xs text-muted-foreground">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
}
