import { ArrowUpRight, type LucideIcon } from "lucide-react";
import Link from "next/link";

// A number that answers a question the person has, and the place to act on it.
export function StatTile({ href, icon: Icon, value, label }: { href: string; icon: LucideIcon; value: number | string; label: string }) {
  return (
    <Link
      href={href}
      className="lift group flex flex-col gap-4 rounded-3xl bg-card p-5 focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none"
    >
      <span className="flex items-center justify-between">
        <span className="flex size-11 items-center justify-center rounded-full bg-primary/15 text-primary">
          <Icon aria-hidden className="size-5" />
        </span>
        <ArrowUpRight aria-hidden className="size-5 text-muted-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
      </span>
      <span className="flex flex-col gap-1">
        <span className="text-3xl font-medium tracking-tight">{value}</span>
        <span className="text-base text-muted-foreground">{label}</span>
      </span>
    </Link>
  );
}
