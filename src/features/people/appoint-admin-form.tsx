"use client";

import { UserPlus } from "lucide-react";
import { useActionState } from "react";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isActionError, useActionToast } from "@/components/use-action-toast";
import { appointAdmin } from "./platform-actions";

export function AppointAdminForm({ institutionId }: { institutionId: string }) {
  const [state, formAction] = useActionState(appointAdmin, null);
  useActionToast(state);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-3xl bg-card p-4 md:p-6">
      <h2 className="text-xl font-medium">Appoint an institution admin</h2>
      <input type="hidden" name="institutionId" value={institutionId} />
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="appoint-email">Email of an existing account</Label>
          <Input id="appoint-email" name="email" type="email" required />
        </div>
        <SubmitButton size="lg">
          <UserPlus aria-hidden className="size-5" />
          Appoint admin
        </SubmitButton>
      </div>
      {isActionError(state) && <FormMessage tone="error">{state.message}</FormMessage>}
    </form>
  );
}
