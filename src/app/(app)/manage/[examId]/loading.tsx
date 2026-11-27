import { HeaderSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-4 w-24 rounded-full" />
      <HeaderSkeleton />
      <div className="flex gap-2 pb-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-11 w-28 rounded-full" />
        ))}
      </div>
      <Skeleton className="h-96 w-full max-w-3xl rounded-3xl" />
    </div>
  );
}
