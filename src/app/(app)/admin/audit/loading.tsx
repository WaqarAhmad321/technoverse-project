import { PageSkeleton, TableSkeleton } from "@/components/skeletons";

export default function Loading() {
  return <PageSkeleton><TableSkeleton rows={8} columns={3} /></PageSkeleton>;
}
