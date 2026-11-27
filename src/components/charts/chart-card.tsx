import type { ReactNode } from "react";

export function ChartCard({ title, note, empty, children }: { title: string; note?: string; empty?: string; children?: ReactNode }) {
  return (
    <section className="flex flex-col gap-5 rounded-3xl bg-card p-5 md:p-6">
      <header className="flex flex-col gap-1">
        <h2 className="text-lg font-medium tracking-tight">{title}</h2>
        {note && <p className="text-sm text-muted-foreground">{note}</p>}
      </header>
      {empty ? <p className="rounded-2xl bg-muted/50 px-4 py-6 text-base text-muted-foreground">{empty}</p> : children}
    </section>
  );
}
