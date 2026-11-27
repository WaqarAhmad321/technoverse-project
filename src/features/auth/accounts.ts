import "server-only";
import { saveDisplayName } from "@/lib/profile";
import { db } from "@/lib/db";
import { seedSampleData } from "@/lib/sample-data";
import { createSessionClient } from "@/lib/supabase/session";

type NewAccount = { name: string; email: string; password: string };

export type CreateAccountResult = "created" | "email-taken" | "failed";
export type StartSessionResult = "signed-in" | "wrong-credentials" | "failed";

// Created through the admin API, so the account is usable at once and no email is sent.
export async function createAccount(account: NewAccount): Promise<CreateAccountResult> {
  const { data, error } = await db().auth.admin.createUser({
    email: account.email,
    password: account.password,
    email_confirm: true,
  });
  if (error) {
    if (error.code === "email_exists") return "email-taken";
    console.error("Could not create the account:", error.message);
    return "failed";
  }

  await saveDisplayName(data.user.id, account.name);
  await seedSampleData(data.user.id);
  return "created";
}

export async function startSession(email: string, password: string): Promise<StartSessionResult> {
  const supabase = await createSessionClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (!error) return "signed-in";
  if (error.code === "invalid_credentials") return "wrong-credentials";
  console.error("Could not sign in:", error.message);
  return "failed";
}
