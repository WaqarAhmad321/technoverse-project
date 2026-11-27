import "server-only";
import { saveProfile } from "@/lib/profile";
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

  await saveProfile({ userId: data.user.id, displayName: account.name, email: account.email });
  await seedSampleData(data.user.id);
  return "created";
}

const USERS_PAGE_SIZE = 1000;

async function findUserIdByEmail(email: string): Promise<string | null> {
  const { data, error } = await db().auth.admin.listUsers({ perPage: USERS_PAGE_SIZE });
  if (error) {
    console.error("Could not list accounts:", error.message);
    return null;
  }
  const wanted = email.toLowerCase();
  return data.users.find((user) => user.email?.toLowerCase() === wanted)?.id ?? null;
}

// Every laptop shares the demo accounts; one created with an older DEMO_PASSWORD is brought in line.
export async function resetDemoPassword(email: string, password: string): Promise<boolean> {
  const userId = await findUserIdByEmail(email);
  if (!userId) return false;
  const { error } = await db().auth.admin.updateUserById(userId, { password });
  if (error) {
    console.error("Could not reset the demo password:", error.message);
    return false;
  }
  console.warn(`Demo account ${email} had an older password; it now uses DEMO_PASSWORD.`);
  return true;
}

export async function startSession(email: string, password: string): Promise<StartSessionResult> {
  const supabase = await createSessionClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (!error) return "signed-in";
  if (error.code === "invalid_credentials") return "wrong-credentials";
  console.error("Could not sign in:", error.message);
  return "failed";
}
