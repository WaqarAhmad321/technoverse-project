import { PageSkeleton, TableSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return (
    <PageSkeleton>
      <Skeleton className="mb-4 h-11 w-full rounded-full" />
      <TableSkeleton rows={8} columns={5} />
    </PageSkeleton>
  );
}
