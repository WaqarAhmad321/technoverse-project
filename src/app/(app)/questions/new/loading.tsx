import { HeaderSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex max-w-3xl flex-col gap-4" aria-busy="true" aria-label="Loading">
      <Skeleton className="h-4 w-24 rounded-full" />
      <HeaderSkeleton />
      <div className="flex flex-col gap-5 rounded-3xl bg-card p-4 md:p-6">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="flex flex-col gap-2">
            <Skeleton className="h-4 w-32 rounded-full" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        ))}
        <Skeleton className="h-11 w-36 rounded-full" />
      </div>
    </div>
  );
}
