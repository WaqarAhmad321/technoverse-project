import { Button } from "@/components/ui/button";

export function EmptyState({ message, action }: { message: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-4 rounded-lg border border-dashed p-8">
      <p className="text-base text-muted-foreground">{message}</p>
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-4 rounded-lg border p-8">
      <p className="text-base">{message}</p>
      <Button variant="outline" size="lg" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}
