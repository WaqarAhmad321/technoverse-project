"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUp } from "./actions";

export function SignUpForm({ defaultKind }: { defaultKind: "examiner" | "candidate" }) {
  const [state, formAction] = useActionState(signUp, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Your name</Label>
        <Input id="name" name="name" autoComplete="name" defaultValue={state?.name} required maxLength={60} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" defaultValue={state?.email} required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          aria-describedby="password-hint"
        />
        <p id="password-hint" className="text-base text-muted-foreground">
          At least 8 characters.
        </p>
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-base font-medium">What will you do here?</legend>
        <label className="flex min-h-11 items-center gap-3 text-base">
          <input type="radio" name="kind" value="examiner" defaultChecked={defaultKind === "examiner"} className="size-5 accent-primary" />
          Set and mark exams for my institution
        </label>
        <label className="flex min-h-11 items-center gap-3 text-base">
          <input type="radio" name="kind" value="candidate" defaultChecked={defaultKind === "candidate"} className="size-5 accent-primary" />
          Sit exams my institution gives me
        </label>
      </fieldset>
      <div className="flex flex-col gap-2">
        <Label htmlFor="institutionName">Institution name</Label>
        <Input id="institutionName" name="institutionName" maxLength={80} aria-describedby="institution-hint" />
        <p id="institution-hint" className="text-base text-muted-foreground">
          Only if you set exams. Leave it empty to name it after you.
        </p>
      </div>
      {state && <FormMessage tone="error">{state.error}</FormMessage>}
      <SubmitButton size="lg">Create account</SubmitButton>
    </form>
  );
}
