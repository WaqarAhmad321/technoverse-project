"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Live screens re-read the server on a timer; no database push needed.
export function AutoRefresh({ everyMs }: { everyMs: number }) {
  const router = useRouter();
  useEffect(() => {
    const timer = window.setInterval(() => router.refresh(), everyMs);
    return () => window.clearInterval(timer);
  }, [everyMs, router]);
  return null;
}
