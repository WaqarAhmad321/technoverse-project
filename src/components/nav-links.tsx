"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/lib/nav";

export function NavLinks({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const pathname = usePathname();

  return items.map((item) => {
    const isCurrent = pathname === item.href || pathname.startsWith(`${item.href}/`);

    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={isCurrent ? "page" : undefined}
        onClick={onNavigate}
        className={cn(
          "flex min-h-11 items-center rounded-full px-4 text-base text-muted-foreground transition-colors duration-200 ease-out hover:bg-accent hover:text-foreground",
          isCurrent && "bg-secondary font-medium text-foreground",
        )}
      >
        {item.label}
      </Link>
    );
  });
}
