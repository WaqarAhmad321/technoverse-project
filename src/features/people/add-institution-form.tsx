"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { isActionError, useActionToast } from "@/components/use-action-toast";
import { addInstitution } from "./platform-actions";

const KINDS = [
  { value: "university", label: "University" },
  { value: "college", label: "College" },
  { value: "board", label: "Exam board" },
  { value: "test_body", label: "Testing body" },
];

export function AddInstitutionForm() {
  const [state, formAction] = useActionState(addInstitution, null);
  useActionToast(state);

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-3xl bg-card p-4 md:p-6">
      <h2 className="text-xl font-medium">Add an institution</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="inst-name">Name</Label>
          <Input id="inst-name" name="name" required placeholder="Punjab Group of Colleges, Gujranwala" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="inst-kind">Type</Label>
          <Select name="kind" defaultValue="college">
            <SelectTrigger id="inst-kind" className="h-11 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KINDS.map((kind) => (
                <SelectItem key={kind.value} value={kind.value}>
                  {kind.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="inst-city">City</Label>
          <Input id="inst-city" name="city" required placeholder="Gujranwala" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="inst-admin">First admin&apos;s email</Label>
          <Input id="inst-admin" name="adminEmail" type="email" required />
        </div>
      </div>
      <SubmitButton size="lg" className="self-start">
        Add institution
      </SubmitButton>
      {isActionError(state) && <FormMessage tone="error">{state.message}</FormMessage>}
    </form>
  );
}
