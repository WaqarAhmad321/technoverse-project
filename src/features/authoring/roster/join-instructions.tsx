"use client";

import { Copy, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const JOIN_PATH = "/sign-up?as=candidate";

// How a candidate on this roster gets in: they sign up with the same email, and see only exams they are enrolled in.
export function JoinInstructions() {
  async function copy() {
    const link = `${window.location.origin}${JOIN_PATH}`;
    try {
      await window.navigator.clipboard.writeText(link);
      toast.success("Join link copied. Share it with your candidates.");
    } catch {
      toast.error(`Copy this link: ${link}`);
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-3xl bg-primary/10 p-4 md:flex-row md:items-center md:justify-between md:p-6">
      <div className="flex items-start gap-3">
        <KeyRound aria-hidden className="mt-0.5 size-5 shrink-0 text-primary" />
        <div className="flex flex-col gap-1">
          <p className="text-base font-medium">How candidates get in</p>
          <p className="text-base text-muted-foreground">
            Share the join link. Each candidate signs up with the email on this roster and sees only the exams you enroll them, or their section, in.
          </p>
        </div>
      </div>
      <Button type="button" variant="outline" onClick={() => void copy()} className="shrink-0">
        <Copy aria-hidden className="size-4" />
        Copy join link
      </Button>
    </section>
  );
}
