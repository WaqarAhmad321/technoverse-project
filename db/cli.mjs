import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const MIGRATIONS_DIR = "db/migrations";
const ENV_FILE = ".env.local";
const FUNCTION_NOT_FOUND = "PGRST202";
const SMOKE_EMAIL_PREFIX = "smoke-";
const SMOKE_ACCOUNT_MAX_AGE_MS = 10 * 60 * 1000;
const USERS_PER_PAGE = 1000;

const USAGE = `Usage:
  scripts/db push               apply the new files in ${MIGRATIONS_DIR}
  scripts/db new <short-name>   start a new file, named so it sorts after the others
  scripts/db reset-demo         remove the demo accounts, their institution and leftover test accounts`;

function fail(message) {
  console.error(message);
  process.exit(1);
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) fail(`db: ${name} is not set. Fill it in ${ENV_FILE}; .env.example lists the names.`);
  return value;
}

function connect() {
  if (existsSync(ENV_FILE)) process.loadEnvFile(ENV_FILE);
  return createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("SUPABASE_SECRET_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function hasStatements(sql) {
  const withoutComments = sql.replace(/\/\*[\s\S]*?\*\//g, "").replace(/--.*$/gm, "");
  return withoutComments.trim() !== "";
}

async function push() {
  const supabase = connect();
  const names = readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith(".sql"))
    .sort();
  let appliedCount = 0;

  for (const name of names) {
    const sql = readFileSync(path.join(MIGRATIONS_DIR, name), "utf8");
    if (!hasStatements(sql)) {
      console.log(`db: skipped ${name}, it has no SQL yet`);
      continue;
    }

    const { data: outcome, error } = await supabase.rpc("hack_apply_migration", {
      migration_name: name,
      migration_sql: sql,
    });
    if (error?.code === FUNCTION_NOT_FOUND) {
      fail("db: the database is not prepared. Run db/bootstrap.sql once in the Supabase SQL editor, then run this again.");
    }
    if (error) {
      fail(`db: ${name} failed, and nothing from it was kept: ${error.message}\nFix the file and run scripts/db push again.`);
    }

    if (outcome === "applied") {
      appliedCount += 1;
      console.log(`db: applied ${name}`);
    }
    if (outcome === "changed") {
      console.warn(`db: WARNING ${name} was edited after it was applied. The edit is NOT in the database. Put the change in a new file: scripts/db new <short-name>`);
    }
  }

  console.log(appliedCount === 0 ? "db: up to date" : `db: applied ${appliedCount} file(s)`);
}

function newMigration(shortName) {
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(shortName ?? "")) {
    fail("Usage: scripts/db new <short-name>   for example: scripts/db new add-orders");
  }
  const owner = execFileSync("git", ["config", "--default", "core", "--get", "hack.me"], { encoding: "utf8" }).trim();
  const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15).replace("T", "-");
  const file = path.join(MIGRATIONS_DIR, `${stamp}-${owner}-${shortName}.sql`);

  writeFileSync(file, "-- What this adds, in one line.\n", { flag: "wx" });
  console.log(file);
}

async function listAllUsers(supabase) {
  const users = [];
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: USERS_PER_PAGE });
    if (error) fail(`db: could not list the accounts: ${error.message}`);
    users.push(...data.users);
    if (data.users.length < USERS_PER_PAGE) return users;
  }
}

// Same rule as taggedEmail in src/lib/demo-accounts.ts: this script cannot import the app's TypeScript.
const DEMO_TAGS = ["examiner", "candidate", "admin", "platform", "bilal"];

function taggedEmail(baseEmail, tag) {
  const [local, domain] = baseEmail.toLowerCase().split("@");
  return `${local}${local.includes("+") ? "-" : "+"}${tag}@${domain}`;
}

async function resetDemo() {
  const supabase = connect();
  const baseDemoEmail = requireEnv("DEMO_EMAIL").toLowerCase();
  const demoEmails = new Set([baseDemoEmail, ...DEMO_TAGS.map((tag) => taggedEmail(baseDemoEmail, tag))]);
  const oldestRunningSmokeTest = Date.now() - SMOKE_ACCOUNT_MAX_AGE_MS;

  const users = await listAllUsers(supabase);
  const toRemove = users.filter((user) => {
    const isDemo = demoEmails.has(user.email?.toLowerCase() ?? "");
    const isLeftoverSmoke =
      user.email?.startsWith(SMOKE_EMAIL_PREFIX) && Date.parse(user.created_at) < oldestRunningSmokeTest;
    return isDemo || isLeftoverSmoke;
  });

  for (const user of toRemove) {
    const { error } = await supabase.auth.admin.deleteUser(user.id);
    if (error) fail(`db: could not remove ${user.email}: ${error.message}`);
  }

  console.log(`db: removed ${toRemove.length} account(s) and everything they owned.`);
  console.log('db: the next "Try as …" click rebuilds Ravi Science College with fresh sample data.');
}

const [command, argument] = process.argv.slice(2);

if (command === "push") await push();
else if (command === "new") newMigration(argument);
else if (command === "reset-demo") await resetDemo();
else fail(USAGE);
