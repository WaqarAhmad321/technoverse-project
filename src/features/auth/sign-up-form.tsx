"use client";

import { useActionState } from "react";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUp } from "./actions";

export function SignUpForm() {
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
      {state && <FormMessage tone="error">{state.error}</FormMessage>}
      <SubmitButton size="lg">Create account</SubmitButton>
    </form>
  );
}
