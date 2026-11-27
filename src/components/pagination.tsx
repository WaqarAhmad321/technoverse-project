import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Page } from "@/lib/pagination";
import { cn } from "@/lib/utils";

const MAX_PAGE_BUTTONS = 5;

function hrefFor(basePath: string, params: Record<string, string>, pageParam: string, page: number): string {
  const query = new URLSearchParams({ ...params, [pageParam]: String(page) });
  return `${basePath}?${query.toString()}`;
}

function StepButton({ href, label, children }: { href: string | null; label: string; children: React.ReactNode }) {
  const button = (
    <Button asChild={href !== null} variant="ghost" size="icon" className="size-10" aria-label={label} disabled={href === null}>
      {href ? <Link href={href} scroll={false}>{children}</Link> : <span>{children}</span>}
    </Button>
  );
  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

// "Showing 11–20 of 31" with previous, next and nearby page numbers. Renders nothing for a single page.
export function Pagination<T>({ page, basePath, params = {}, noun, pageParam = "page" }: { page: Page<T>; basePath: string; params?: Record<string, string>; noun: string; pageParam?: string }) {
  if (page.pageCount <= 1) return null;
  const first = Math.max(1, Math.min(page.page - Math.floor(MAX_PAGE_BUTTONS / 2), page.pageCount - MAX_PAGE_BUTTONS + 1));
  const numbers = Array.from({ length: Math.min(MAX_PAGE_BUTTONS, page.pageCount) }, (_, index) => first + index);

  return (
    <nav aria-label={`${noun} pages`} className="flex flex-wrap items-center justify-between gap-3 px-2 pt-3">
      <p className="text-sm text-muted-foreground">
        Showing {page.from}–{page.to} of {page.total} {noun}
      </p>
      <div className="flex items-center gap-1">
        <StepButton href={page.page > 1 ? hrefFor(basePath, params, pageParam, page.page - 1) : null} label="Previous page">
          <ChevronLeft aria-hidden className="size-5" />
        </StepButton>
        {numbers.map((number) => (
          <Link
            key={number}
            href={hrefFor(basePath, params, pageParam, number)}
            scroll={false}
            aria-current={number === page.page ? "page" : undefined}
            className={cn(
              "flex size-10 items-center justify-center rounded-full text-sm transition-colors duration-200 ease-out hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none",
              number === page.page && "bg-primary/15 font-medium text-foreground",
            )}
          >
            {number}
          </Link>
        ))}
        <StepButton href={page.page < page.pageCount ? hrefFor(basePath, params, pageParam, page.page + 1) : null} label="Next page">
          <ChevronRight aria-hidden className="size-5" />
        </StepButton>
      </div>
    </nav>
  );
}
