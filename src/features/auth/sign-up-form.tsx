"use client";

import { GraduationCap, PenLine, UsersRound } from "lucide-react";
import { useActionState, useState } from "react";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { ThemedSelect } from "@/components/themed-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { REQUESTABLE_ROLES, ROLE_LABELS } from "@/features/people/roles";
import { cn } from "@/lib/utils";
import { signUp } from "./actions";

export type SignUpKind = "examiner" | "candidate" | "staff";
export type InstitutionOption = { id: string; name: string };

const KIND_CHOICES: { kind: SignUpKind; label: string; hint: string; icon: typeof PenLine }[] = [
  { kind: "examiner", label: "Set and mark exams for my institution", hint: "Start your own institution with sample data.", icon: PenLine },
  { kind: "candidate", label: "Sit exams my institution gives me", hint: "See only the exams you are enrolled in.", icon: GraduationCap },
  { kind: "staff", label: "Join an institution as staff", hint: "Ask an existing institution to take you on.", icon: UsersRound },
];

export function SignUpForm({
  defaultKind,
  defaultEmail,
  institutions,
}: {
  defaultKind: SignUpKind;
  defaultEmail: string;
  institutions: InstitutionOption[];
}) {
  const [state, formAction] = useActionState(signUp, null);
  const [kind, setKind] = useState<SignUpKind>(defaultKind);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-base font-medium">What will you do here?</legend>
        {KIND_CHOICES.map((choice) => (
          <label
            key={choice.kind}
            className={cn(
              "flex min-h-11 cursor-pointer items-start gap-3 rounded-2xl bg-card p-4 ring-1 ring-border transition-colors has-[:checked]:ring-2 has-[:checked]:ring-primary has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
            )}
          >
            <input type="radio" name="kind" value={choice.kind} checked={kind === choice.kind} onChange={() => setKind(choice.kind)} className="mt-1 size-5 accent-primary" />
            <choice.icon aria-hidden className="mt-0.5 size-5 shrink-0 text-primary" />
            <span className="flex flex-col">
              <span className="text-base font-medium">{choice.label}</span>
              <span className="text-base text-muted-foreground">{choice.hint}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Your name</Label>
        <Input id="name" name="name" autoComplete="name" defaultValue={state?.name} required maxLength={60} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" defaultValue={state?.email ?? defaultEmail} required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} aria-describedby="password-hint" />
        <p id="password-hint" className="text-base text-muted-foreground">
          At least 8 characters.
        </p>
      </div>
      {kind === "examiner" && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="institutionName">Institution name</Label>
          <Input id="institutionName" name="institutionName" maxLength={80} aria-describedby="institution-hint" />
          <p id="institution-hint" className="text-base text-muted-foreground">
            Leave it empty to name it after you.
          </p>
        </div>
      )}
      {kind === "staff" && (
        <>
          <div className="flex flex-col gap-2">
            <Label htmlFor="joinInstitutionId">Institution</Label>
            {institutions.length === 0 ? (
              <p className="text-base text-muted-foreground">No institution is open to requests yet.</p>
            ) : (
              <ThemedSelect id="joinInstitutionId" name="joinInstitutionId" className="w-full">
                {institutions.map((institution) => (
                  <option key={institution.id} value={institution.id}>
                    {institution.name}
                  </option>
                ))}
              </ThemedSelect>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="joinRole">Role you are asking for</Label>
            <ThemedSelect id="joinRole" name="joinRole" defaultValue="examiner" className="w-full">
              {REQUESTABLE_ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role] ?? role}
                </option>
              ))}
            </ThemedSelect>
          </div>
        </>
      )}
      {state && <FormMessage tone="error">{state.error}</FormMessage>}
      <SubmitButton size="lg">Create account</SubmitButton>
    </form>
  );
}
