"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { displayNameSchema } from "@/lib/profile";
import { getEnv } from "@/lib/env";
import { APP_HOME, site } from "@/lib/site";
import { createSessionClient } from "@/lib/supabase/session";
import { createAccount, startSession } from "./accounts";

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 72;
const TRY_AGAIN = "That did not work just now. Try again in a moment.";

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(1).max(MAX_PASSWORD_LENGTH),
});

const newAccountSchema = z.object({
  name: displayNameSchema,
  email: z.email(),
  password: z.string().min(MIN_PASSWORD_LENGTH).max(MAX_PASSWORD_LENGTH),
});

export type AuthFormState = { error: string; name: string; email: string } | null;

function typedText(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
}

export async function signIn(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const typed = { name: "", email: typedText(formData, "email") };

  const credentials = credentialsSchema.safeParse({ email: typed.email, password: formData.get("password") });
  if (!credentials.success) {
    return { ...typed, error: "Enter your email and your password." };
  }

  const result = await startSession(credentials.data.email, credentials.data.password);
  if (result === "wrong-credentials") {
    return { ...typed, error: "That email and password do not match an account." };
  }
  if (result === "failed") {
    return { ...typed, error: TRY_AGAIN };
  }
  redirect(APP_HOME);
}

export async function signUp(_previous: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const typed = { name: typedText(formData, "name"), email: typedText(formData, "email") };

  const account = newAccountSchema.safeParse({ ...typed, password: formData.get("password") });
  if (!account.success) {
    return { ...typed, error: "Enter your name, your email and a password of at least 8 characters." };
  }

  const created = await createAccount(account.data);
  if (created === "email-taken") {
    return { ...typed, error: "An account with that email already exists. Sign in instead." };
  }
  if (created === "failed") {
    return { ...typed, error: TRY_AGAIN };
  }

  const result = await startSession(account.data.email, account.data.password);
  if (result !== "signed-in") redirect("/login?notice=account-created");
  redirect(APP_HOME);
}

export async function signInAsDemo(): Promise<void> {
  const env = getEnv();
  const demo = { name: site.demoAccountName, email: env.DEMO_EMAIL, password: env.DEMO_PASSWORD };

  let result = await startSession(demo.email, demo.password);
  if (result === "wrong-credentials") {
    const created = await createAccount(demo);
    if (created !== "failed") {
      result = await startSession(demo.email, demo.password);
    }
  }

  if (result !== "signed-in") redirect("/login?notice=demo-unavailable");
  redirect(APP_HOME);
}

export async function signOut(): Promise<void> {
  const supabase = await createSessionClient();
  // "local" ends this browser's session only. The demo account is shared, so other people stay signed in.
  await supabase.auth.signOut({ scope: "local" });
  redirect("/");
}
