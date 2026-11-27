import { HeaderSkeleton, TableSkeleton, TilesSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-4 w-24 rounded-full" />
      <HeaderSkeleton />
      <Skeleton className="h-40 w-full rounded-3xl" />
      <TilesSkeleton count={3} />
      <TableSkeleton rows={6} columns={3} />
    </div>
  );
}
