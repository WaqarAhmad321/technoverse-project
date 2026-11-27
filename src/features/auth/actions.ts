"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { syncCandidateMemberships, syncInvitations } from "@/lib/access";
import { DEMO_ROLES, type DemoRole } from "@/lib/demo-accounts";
import { REQUESTABLE_ROLES } from "@/features/people/roles";
import { displayNameSchema } from "@/lib/profile";
import { getEnv } from "@/lib/env";
import { APP_HOME } from "@/lib/site";
import { createSessionClient } from "@/lib/supabase/session";
import { createAccount, demoSignIn, ensureDemoWorld, startSession } from "./accounts";

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 72;
const MAX_INSTITUTION_NAME_LENGTH = 80;
const TRY_AGAIN = "That did not work just now. Try again in a moment.";

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(1).max(MAX_PASSWORD_LENGTH),
});

const newAccountSchema = z.object({
  name: displayNameSchema,
  email: z.email(),
  password: z.string().min(MIN_PASSWORD_LENGTH).max(MAX_PASSWORD_LENGTH),
  kind: z.enum(["examiner", "candidate", "staff"]),
  institutionName: z.string().trim().max(MAX_INSTITUTION_NAME_LENGTH),
  joinInstitutionId: z.uuid().optional(),
  joinRole: z.enum(REQUESTABLE_ROLES).optional(),
});

export type AuthFormState = { error: string; name: string; email: string } | null;

function typedText(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
}

async function afterSignIn(userId: string, email: string): Promise<never> {
  await syncCandidateMemberships(userId, email);
  await syncInvitations(userId, email);
  redirect(APP_HOME);
}

export async function signIn(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const typed = { name: "", email: typedText(formData, "email") };

  const credentials = credentialsSchema.safeParse({ email: typed.email, password: formData.get("password") });
  if (!credentials.success) {
    return { ...typed, error: "Enter your email and your password." };
  }

  const result = await startSession(credentials.data.email, credentials.data.password);
  if (result.outcome === "wrong-credentials") {
    return { ...typed, error: "That email and password do not match an account." };
  }
  if (result.outcome === "failed") {
    return { ...typed, error: TRY_AGAIN };
  }
  return afterSignIn(result.userId, credentials.data.email);
}

export async function signUp(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const typed = { name: typedText(formData, "name"), email: typedText(formData, "email") };

  const account = newAccountSchema.safeParse({
    ...typed,
    password: formData.get("password"),
    kind: formData.get("kind"),
    institutionName: typedText(formData, "institutionName"),
    joinInstitutionId: typedText(formData, "joinInstitutionId") || undefined,
    joinRole: typedText(formData, "joinRole") || undefined,
  });
  if (account.success && account.data.kind === "staff" && !(account.data.joinInstitutionId && account.data.joinRole)) {
    return { ...typed, error: "Pick the institution you want to join and the role you need." };
  }
  if (!account.success) {
    return { ...typed, error: "Enter your name, your email, a password of at least 8 characters, and what you will do here." };
  }

  const institutionName = account.data.institutionName || `${account.data.name}'s institution`;
  const created = await createAccount({ ...account.data, institutionName });
  if (created === "email-taken") {
    return { ...typed, error: "An account with that email already exists. Sign in instead." };
  }
  if (created === "failed") {
    return { ...typed, error: TRY_AGAIN };
  }

  const result = await startSession(account.data.email, account.data.password);
  if (result.outcome !== "signed-in") redirect("/login?notice=account-created");
  return afterSignIn(result.userId, account.data.email);
}

const demoRoleSchema = z.enum(DEMO_ROLES);

// The first click on any "Try as …" button builds the whole demo institution.
export async function signInAsDemo(formData: FormData): Promise<void> {
  const role = demoRoleSchema.safeParse(formData.get("role"));
  if (!role.success) redirect("/login?notice=demo-unavailable");

  const env = getEnv();
  const credentials = demoSignIn(env, role.data satisfies DemoRole);

  let result = await startSession(credentials.email, credentials.password);
  if (result.outcome === "wrong-credentials") {
    try {
      await ensureDemoWorld(env);
      result = await startSession(credentials.email, credentials.password);
    } catch (error) {
      console.error("Could not prepare the demo accounts:", error);
    }
  }

  if (result.outcome !== "signed-in") redirect("/login?notice=demo-unavailable");
  return afterSignIn(result.userId, credentials.email);
}

export async function signOut(): Promise<void> {
  const supabase = await createSessionClient();
  // "local" ends this browser's session only. The demo accounts are shared, so other people stay signed in.
  await supabase.auth.signOut({ scope: "local" });
  redirect("/");
}
