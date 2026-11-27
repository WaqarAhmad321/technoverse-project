import { Skeleton } from "@/components/ui/skeleton";

const ROWS = 4;

export default function Loading() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-9 w-40" />
      {Array.from({ length: ROWS }, (_, index) => (
        <Skeleton key={index} className="h-24 w-full rounded-2xl" />
      ))}
    </div>
  );
}
