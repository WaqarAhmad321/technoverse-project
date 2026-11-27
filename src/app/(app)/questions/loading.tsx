import { Skeleton } from "@/components/ui/skeleton";

const ROWS = 8;

export default function Loading() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-9 w-56" />
      <Skeleton className="h-11 w-full rounded-full" />
      <div className="flex flex-col gap-2 rounded-3xl bg-card p-4">
        {Array.from({ length: ROWS }, (_, index) => (
          <Skeleton key={index} className="h-14 w-full" />
        ))}
      </div>
    </div>
  );
}
