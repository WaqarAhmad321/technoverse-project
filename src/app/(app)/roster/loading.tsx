import { PageSkeleton, TableSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return (
    <PageSkeleton>
      <Skeleton className="mb-4 h-20 w-full rounded-3xl" />
      <TableSkeleton rows={8} columns={5} />
    </PageSkeleton>
  );
}
