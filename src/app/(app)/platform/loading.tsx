import { PageSkeleton, TableSkeleton } from "@/components/skeletons";

export default function Loading() {
  return <PageSkeleton><TableSkeleton rows={5} columns={6} /></PageSkeleton>;
}
