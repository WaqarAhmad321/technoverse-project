"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/states";

export default function AppError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <ErrorState message="This screen could not load. Your data is safe." onRetry={retry} />;
}
