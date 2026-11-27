"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveName } from "./actions";

export function NameForm({ currentName }: { currentName: string }) {
  const [state, formAction] = useActionState(saveName, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Your name</Label>
        <Input id="name" name="name" defaultValue={currentName} autoComplete="name" required maxLength={60} />
      </div>
      {state?.status === "error" && <FormMessage tone="error">{state.message}</FormMessage>}
      {state?.status === "saved" && <FormMessage tone="done">Your name is saved.</FormMessage>}
      <SubmitButton size="lg" className="self-start">
        Save name
      </SubmitButton>
    </form>
  );
}
