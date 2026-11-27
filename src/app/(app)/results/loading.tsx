import { ListSkeleton, PageSkeleton } from "@/components/skeletons";

export default function Loading() {
  return <PageSkeleton><ListSkeleton rows={3} /></PageSkeleton>;
}
