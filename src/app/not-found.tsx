import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-start justify-center gap-4 px-4">
      <h1 className="text-2xl font-semibold tracking-tight">This page does not exist</h1>
      <p className="text-base text-muted-foreground">The link may be old, or the address may have a typo.</p>
      <Button asChild size="lg">
        <Link href="/">Go to the start</Link>
      </Button>
    </main>
  );
}
