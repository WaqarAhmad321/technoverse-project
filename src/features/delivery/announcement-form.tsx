"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { isActionError, useActionToast } from "@/components/use-action-toast";
import { sendAnnouncement } from "./actions";

export function AnnouncementForm({ examId }: { examId: string }) {
  const [state, formAction] = useActionState(sendAnnouncement, null);
  useActionToast(state);

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-3xl bg-card p-4 md:p-6">
      <h2 className="text-xl font-medium">Announce to every candidate</h2>
      <input type="hidden" name="examId" value={examId} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="announcement-body">Message</Label>
        <Textarea id="announcement-body" name="body" rows={2} maxLength={500} placeholder="Take g = 10 m/s² in every question." required />
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="announcement-question">About question (optional)</Label>
          <Input id="announcement-question" name="questionPosition" type="number" min={1} className="w-32" />
        </div>
        <SubmitButton size="lg">Send announcement</SubmitButton>
      </div>
      {isActionError(state) && <FormMessage tone="error">{state.message}</FormMessage>}
    </form>
  );
}
