import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { StatusDot } from "@/components/status-dot";
import type { AttentionItem } from "@/lib/attention";

// "Needs your attention": each row is something waiting on this person, linking to where they act on it.
export function AttentionList({ items, empty }: { items: AttentionItem[]; empty: string }) {
  return (
    <section aria-labelledby="attention" className="flex flex-col gap-3">
      <h2 id="attention" className="text-xl font-medium">
        Needs your attention
      </h2>
      {items.length === 0 ? (
        <p className="rounded-3xl bg-card px-5 py-4 text-base text-muted-foreground">{empty}</p>
      ) : (
        <ul className="flex flex-col gap-1 rounded-3xl bg-card p-2">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="group flex min-h-16 items-center gap-4 rounded-xl px-4 py-3 transition-colors duration-200 ease-out hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none"
              >
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <StatusDot tone={item.tone} className="text-base font-medium text-foreground">
                    {item.title}
                  </StatusDot>
                  <span className="truncate pl-4 text-sm text-muted-foreground">{item.detail}</span>
                </span>
                <ChevronRight aria-hidden className="size-5 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
