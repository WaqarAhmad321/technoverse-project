"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { ThemedSelect } from "@/components/themed-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { isActionError, useActionToast } from "@/components/use-action-toast";
import { requestToJoin } from "./invite-actions";
import { REQUESTABLE_ROLES, ROLE_LABELS } from "./roles";

export function JoinForm({ institutions }: { institutions: { id: string; name: string }[] }) {
  const [state, formAction] = useActionState(requestToJoin, null);
  useActionToast(state);

  if (institutions.length === 0) return <p className="rounded-3xl bg-card p-6 text-base">No institution is open to requests yet.</p>;
  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-4 rounded-3xl bg-card p-4 md:p-6">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="join-institution">Institution</Label>
        <ThemedSelect id="join-institution" name="institutionId" className="w-full">
          {institutions.map((institution) => (
            <option key={institution.id} value={institution.id}>
              {institution.name}
            </option>
          ))}
        </ThemedSelect>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="join-role">Role you are asking for</Label>
        <ThemedSelect id="join-role" name="role" defaultValue="examiner" className="w-full">
          {REQUESTABLE_ROLES.map((role) => (
            <option key={role} value={role}>
              {ROLE_LABELS[role] ?? role}
            </option>
          ))}
        </ThemedSelect>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="join-note">Note for the admin (optional)</Label>
        <Input id="join-note" name="note" maxLength={300} autoComplete="off" />
      </div>
      {isActionError(state) && <FormMessage tone="error">{state.message}</FormMessage>}
      <SubmitButton size="lg">Send request</SubmitButton>
    </form>
  );
}
