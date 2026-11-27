import { Skeleton } from "@/components/ui/skeleton";

const ROWS = 5;

export function ListSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-8 w-56" />
      {Array.from({ length: ROWS }, (_, index) => (
        <Skeleton key={index} className="h-14 w-full" />
      ))}
    </div>
  );
}
