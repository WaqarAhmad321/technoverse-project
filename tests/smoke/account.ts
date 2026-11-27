import { randomUUID } from "node:crypto";
import { test as base, expect, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

export type Account = { name: string; email: string; password: string };

// Someone who sets exams gets a seeded institution at sign-up: about 1,300 rows.
const SIGN_UP_WITH_SEED_MS = 45_000;

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

type AccountKind = "examiner" | "candidate";

const KIND_LABELS: Record<AccountKind, string> = {
  examiner: "Set and mark exams for my institution",
  candidate: "Sit exams my institution gives me",
};

// Same rule as taggedEmail in src/lib/demo-accounts.ts: the seeded Ayesha of an examiner's world.
function pairedCandidateEmail(examinerEmail: string): string {
  const [local, domain] = examinerEmail.split("@");
  return `${local}${local?.includes("+") ? "-" : "+"}ayesha@${domain}`;
}

async function signUp(page: Page, account: Account, kind: AccountKind = "examiner"): Promise<void> {
  await page.goto("/sign-up");
  await page.getByLabel("Your name").fill(account.name);
  await page.getByLabel("Email").fill(account.email);
  await page.getByLabel("Password").fill(account.password);
  await page.getByLabel(KIND_LABELS[kind]).check();
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/home$/, { timeout: SIGN_UP_WITH_SEED_MS });
  if (kind === "examiner") await approveInstitutionOf(account);
}

// A new institution starts pending; tests act as the platform admin would and approve it.
async function approveInstitutionOf(account: Account): Promise<void> {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const noSession = { auth: { persistSession: false, autoRefreshToken: false } };
  const visitor = createClient(url, requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"), noSession);
  const { data } = await visitor.auth.signInWithPassword({ email: account.email, password: account.password });
  if (!data.user) return;
  const admin = createClient(url, requireEnv("SUPABASE_SECRET_KEY"), noSession);
  await admin.from("institutions").update({ status: "active" }).eq("user_id", data.user.id);
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

export type World = { examiner: Account; candidate: Account; candidatePage: Page };
type WorldAccounts = { examiner: Account; candidate: Account };

async function signIn(page: Page, account: Account): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Email").fill(account.email);
  await page.getByLabel("Password").fill(account.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/home$/);
}

// A test that asks for `account` starts signed in as an examiner of a freshly seeded institution, shared by
// the tests on this worker: add to it freely, but do not rely on another test's changes.
// A test that asks for `world` gets an examiner on `page` and that institution's Ayesha on `candidatePage`.
// The world's accounts are made once per worker, because seeding an institution is slow; tests that share
// it must not depend on each other's changes. Every account is removed at the end.
// A test that asks for `accountCandidate` also gets the `account` institution's Ayesha, signed in on her own page.
export const test = base.extend<
  { account: Account; freshAccount: Account; world: World; accountCandidate: Page },
  { worldAccounts: WorldAccounts; examinerAccount: Account }
>({
  // One seeded examiner per worker: seeding an institution is the slowest step of the whole check.
  examinerAccount: [
    async ({ browser }, runWorker, workerInfo) => {
      const account = newAccount();
      const setupContext = await browser.newContext({ baseURL: workerInfo.project.use.baseURL });
      try {
        await signUp(await setupContext.newPage(), account);
        await setupContext.close();
        await runWorker(account);
      } finally {
        await removeAccount(account);
      }
    },
    { scope: "worker" },
  ],
  worldAccounts: [
    async ({ browser }, runWorker, workerInfo) => {
      const examiner = newAccount();
      const candidate = { name: "Ayesha Khan", email: pairedCandidateEmail(examiner.email), password: randomUUID() };
      const setupContext = await browser.newContext({ baseURL: workerInfo.project.use.baseURL });
      try {
        const setupPage = await setupContext.newPage();
        await signUp(setupPage, examiner, "examiner");
        await setupContext.clearCookies();
        await signUp(setupPage, candidate, "candidate");
        await setupContext.close();
        await runWorker({ examiner, candidate });
      } finally {
        await removeAccount(candidate);
        await removeAccount(examiner);
      }
    },
    { scope: "worker" },
  ],
  world: async ({ page, browser, worldAccounts }, runTest) => {
    const candidateContext = await browser.newContext();
    try {
      await signIn(page, worldAccounts.examiner);
      const candidatePage = await candidateContext.newPage();
      await signIn(candidatePage, worldAccounts.candidate);
      await runTest({ ...worldAccounts, candidatePage });
    } finally {
      await candidateContext.close();
    }
  },
  accountCandidate: async ({ account, browser }, runTest, testInfo) => {
    const candidate = { name: "Ayesha Khan", email: pairedCandidateEmail(account.email), password: randomUUID() };
    const context = await browser.newContext({ baseURL: testInfo.project.use.baseURL });
    try {
      const candidatePage = await context.newPage();
      await signUp(candidatePage, candidate, "candidate");
      await runTest(candidatePage);
    } finally {
      await context.close();
      await removeAccount(candidate);
    }
  },
  // For a test that needs the seeded institution untouched (marking, the key check): its own, seeded fresh.
  freshAccount: async ({ page }, runTest) => {
    const account = newAccount();
    try {
      await signUp(page, account);
      await runTest(account);
    } finally {
      await removeAccount(account);
    }
  },
  account: async ({ page, examinerAccount }, runTest) => {
    await signIn(page, examinerAccount);
    await runTest(examinerAccount);
  },
});

export { expect };
