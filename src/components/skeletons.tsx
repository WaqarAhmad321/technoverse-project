import { Skeleton } from "@/components/ui/skeleton";

// Loading states in the shape of what is coming, so nothing jumps when it arrives.

export function HeaderSkeleton() {
  return (
    <div className="flex flex-col gap-2 pb-6" aria-hidden>
      <Skeleton className="h-9 w-64 rounded-full" />
      <Skeleton className="h-5 w-96 max-w-full rounded-full" />
    </div>
  );
}

export function TableSkeleton({ rows = 6, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="flex flex-col gap-1 rounded-3xl bg-card p-4" aria-busy="true" aria-label="Loading">
      <div className="flex gap-6 pb-3">
        {Array.from({ length: columns }, (_, index) => (
          <Skeleton key={index} className="h-4 flex-1 rounded-full opacity-60" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className="flex h-14 items-center gap-6 border-t border-border">
          {Array.from({ length: columns }, (_, column) => (
            <Skeleton key={column} className="h-4 flex-1 rounded-full" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2 rounded-3xl bg-card p-2" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex h-16 items-center justify-between gap-4 rounded-xl px-4">
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-48 rounded-full" />
            <Skeleton className="h-3.5 w-72 max-w-full rounded-full" />
          </div>
          <Skeleton className="h-10 w-28 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function TilesSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="flex flex-col gap-4 rounded-3xl bg-card p-5">
          <Skeleton className="size-11 rounded-full" />
          <Skeleton className="h-8 w-16 rounded-full" />
          <Skeleton className="h-4 w-36 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="flex max-w-3xl flex-col gap-4" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-4 w-24 rounded-full" />
      <HeaderSkeleton />
      <Skeleton className="h-28 w-full rounded-3xl" />
      <Skeleton className="h-48 w-full rounded-3xl" />
    </div>
  );
}

export function PageSkeleton({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <HeaderSkeleton />
      {children}
    </div>
  );
}
