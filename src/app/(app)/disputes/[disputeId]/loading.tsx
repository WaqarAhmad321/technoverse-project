import { HeaderSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex max-w-3xl flex-col gap-4" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-4 w-24 rounded-full" />
      <HeaderSkeleton />
      <Skeleton className="h-64 w-full rounded-3xl" />
      <Skeleton className="h-48 w-full rounded-3xl" />
    </div>
  );
}
