import { PageSkeleton, TableSkeleton } from "@/components/skeletons";

export default function Loading() {
  return <PageSkeleton><TableSkeleton rows={6} columns={4} /></PageSkeleton>;
}
