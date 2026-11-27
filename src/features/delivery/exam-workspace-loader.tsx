"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

function WorkspaceSkeleton() {
  return (
    <div className="flex flex-col gap-4 lg:flex-row" aria-busy="true" aria-label="Loading your exam">
      <Skeleton className="h-96 flex-1 rounded-3xl" />
      <Skeleton className="h-72 rounded-3xl lg:w-72" />
    </div>
  );
}

// The workspace reads answers kept on this phone, which exist only in the browser.
export const ExamWorkspaceLoader = dynamic(() => import("./exam-workspace").then((module) => module.ExamWorkspace), {
  ssr: false,
  loading: WorkspaceSkeleton,
});
