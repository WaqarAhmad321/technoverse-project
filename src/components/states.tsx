import { CircleAlert, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyState({ message, action }: { message: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl bg-card px-6 py-12 text-center">
      <Inbox aria-hidden className="size-6 text-muted-foreground" />
      <p className="max-w-md text-base text-muted-foreground">{message}</p>
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-4 rounded-3xl bg-card px-6 py-12 text-center">
      <CircleAlert aria-hidden className="size-6 text-destructive" />
      <p className="max-w-md text-base">{message}</p>
      <Button variant="outline" size="lg" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
