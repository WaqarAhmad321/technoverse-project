import { randomUUID } from "node:crypto";
import { test as base, expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

export type Account = { name: string; email: string; password: string };

// Someone who sets exams gets a seeded institution at sign-up: about 1,300 rows.
const SIGN_UP_WITH_SEED_MS = 20_000;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set. Fill it in .env.local; .env.example lists the names.`);
  return value;
}

function newAccount(): Account {
  const demoDomain = requireEnv("DEMO_EMAIL").split("@")[1];
  return {
    name: "Hana Idris",
    email: `smoke-${randomUUID()}@${demoDomain}`,
    password: randomUUID(),
  };
}

async function signUp(page: Page, account: Account): Promise<void> {
  await page.goto("/sign-up");
  await page.getByLabel("Your name").fill(account.name);
  await page.getByLabel("Email").fill(account.email);
  await page.getByLabel("Password").fill(account.password);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/home$/, { timeout: SIGN_UP_WITH_SEED_MS });
}

async function removeAccount(account: Account): Promise<void> {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const noSession = { auth: { persistSession: false, autoRefreshToken: false } };

  const visitor = createClient(url, requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"), noSession);
  const { data, error } = await visitor.auth.signInWithPassword({ email: account.email, password: account.password });
  if (error || !data.user) return;

  const admin = createClient(url, requireEnv("SUPABASE_SECRET_KEY"), noSession);
  const removal = await admin.auth.admin.deleteUser(data.user.id);
  if (removal.error) {
    console.warn(`Could not remove the test account ${account.email}: ${removal.error.message}. scripts/db reset-demo clears leftovers.`);
  }
}

// A test that asks for `account` starts signed in as a brand-new person with fresh sample data.
// The account and everything it owns are removed when the test ends.
export const test = base.extend<{ account: Account }>({
  account: async ({ page }, runTest) => {
    const account = newAccount();
    try {
      await signUp(page, account);
      await runTest(account);
    } finally {
      await removeAccount(account);
    }
  },
});

export { expect };
