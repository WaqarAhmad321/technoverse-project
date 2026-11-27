"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addPerson } from "./actions";
import { ROLE_CHOICES } from "./roles";

export function AddPersonForm() {
  const [state, formAction] = useActionState(addPerson, null);

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-3xl bg-card p-4 md:p-6">
      <h2 className="text-xl font-medium">Add someone who already has an account</h2>
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="add-email">Email</Label>
          <Input id="add-email" name="email" type="email" autoComplete="off" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="add-role">Role</Label>
          <select
            id="add-role"
            name="role"
            defaultValue="examiner"
            className="h-11 rounded-xl border border-input bg-card px-4 text-base focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none"
          >
            {ROLE_CHOICES.map((choice) => (
              <option key={choice.role} value={choice.role}>
                {choice.label}
              </option>
            ))}
          </select>
        </div>
        <SubmitButton size="lg">Add person</SubmitButton>
      </div>
      {state && <FormMessage tone={state.status === "saved" ? "done" : "error"}>{state.message}</FormMessage>}
    </form>
  );
}
