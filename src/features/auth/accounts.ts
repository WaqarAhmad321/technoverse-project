import "server-only";
import { randomUUID } from "node:crypto";
import type { Role } from "@/lib/access";
import { db, unwrap } from "@/lib/db";
import { DEMO_INSTITUTION, DEMO_PEOPLE, demoEmail, taggedEmail, type DemoRole } from "@/lib/demo-accounts";
import type { Env } from "@/lib/env-rules";
import { saveProfile } from "@/lib/profile";
import { seedSampleData } from "@/lib/sample-data";
import { createSessionClient } from "@/lib/supabase/session";

export type AccountKind = "examiner" | "candidate" | "staff";
type NewAccount = {
  name: string;
  email: string;
  password: string;
  kind: AccountKind;
  institutionName: string;
  joinInstitutionId?: string;
  joinRole?: string;
};

export type CreateAccountResult = "created" | "email-taken" | "failed";
export type StartSessionResult =
  | { outcome: "signed-in"; userId: string }
  | { outcome: "wrong-credentials" }
  | { outcome: "failed" };

const USERS_PAGE_SIZE = 1000;

async function createUser(email: string, password: string): Promise<{ id: string } | "email-taken" | "failed"> {
  const { data, error } = await db().auth.admin.createUser({ email, password, email_confirm: true });
  if (!error) return { id: data.user.id };
  if (error.code === "email_exists") return "email-taken";
  console.error("Could not create the account:", error.message);
  return "failed";
}

async function grant(grantedBy: string, institutionId: string, memberId: string, roles: Role[]): Promise<void> {
  const rows = roles.map((role) => ({ user_id: grantedBy, institution_id: institutionId, member_id: memberId, role }));
  unwrap(await db().from("memberships").upsert(rows, { onConflict: "institution_id,member_id,role", ignoreDuplicates: true }));
}

type InstitutionStatus = "active" | "pending";

async function createInstitution(ownerId: string, name: string, status: InstitutionStatus): Promise<string> {
  const id = randomUUID();
  unwrap(await db().from("institutions").insert({ id, user_id: ownerId, name, kind: DEMO_INSTITUTION.kind, city: DEMO_INSTITUTION.city, status }));
  return id;
}

// Someone who sets exams gets their own institution, seeded so the product is alive from the first click.
export async function createAccount(account: NewAccount): Promise<CreateAccountResult> {
  const created = await createUser(account.email, account.password);
  if (typeof created === "string") return created;

  await saveProfile({ userId: created.id, displayName: account.name, email: account.email });
  if (account.kind === "candidate") return "created";
  if (account.kind === "staff") {
    if (!account.joinInstitutionId || !account.joinRole) return "failed";
    unwrap(
      await db().from("join_requests").insert({
        user_id: created.id,
        institution_id: account.joinInstitutionId,
        member_id: created.id,
        role_requested: account.joinRole,
      }),
    );
    return "created";
  }

  // A new institution waits for the platform admin; it can set everything up but not publish until approved.
  const institutionId = await createInstitution(created.id, account.institutionName, "pending");
  await grant(created.id, institutionId, created.id, ["institution_admin", "examiner"]);
  await seedSampleData({
    ownerId: created.id,
    institutionId,
    ayeshaEmail: taggedEmail(account.email, "ayesha"),
    bilalEmail: taggedEmail(account.email, "bilal"),
  });
  return "created";
}

export async function startSession(email: string, password: string): Promise<StartSessionResult> {
  const supabase = await createSessionClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (!error) return { outcome: "signed-in", userId: data.user.id };
  if (error.code === "invalid_credentials") return { outcome: "wrong-credentials" };
  console.error("Could not sign in:", error.message);
  return { outcome: "failed" };
}

async function userIdsByEmail(): Promise<Map<string, string>> {
  const { data, error } = await db().auth.admin.listUsers({ perPage: USERS_PAGE_SIZE });
  if (error) throw new Error(`Could not list accounts: ${error.message}`);
  return new Map(data.users.flatMap((user) => (user.email ? [[user.email.toLowerCase(), user.id] as const] : [])));
}

// Creates each missing demo account, brings an existing one onto the current DEMO_PASSWORD
// (every laptop shares them), and builds Ravi Science College the first time.
export async function ensureDemoWorld(env: Pick<Env, "DEMO_EMAIL" | "DEMO_PASSWORD">): Promise<void> {
  const existing = await userIdsByEmail();
  const people = (["examiner", "candidate", "admin", "platform", "bilal"] as const).map((key) => ({
    key,
    email: demoEmail(env, key),
    name: DEMO_PEOPLE[key].name,
  }));

  const ids = new Map<string, string>();
  for (const person of people) {
    const known = existing.get(person.email);
    if (known) {
      const { error } = await db().auth.admin.updateUserById(known, { password: env.DEMO_PASSWORD });
      if (error) throw new Error(`Could not reset the demo password: ${error.message}`);
      ids.set(person.key, known);
    } else {
      const created = await createUser(person.email, env.DEMO_PASSWORD);
      if (typeof created === "string") throw new Error(`Could not create the demo account ${person.email}.`);
      ids.set(person.key, created.id);
    }
    await saveProfile({ userId: ids.get(person.key) ?? "", displayName: person.name, email: person.email, isSuperAdmin: person.key === "platform" });
  }

  const kamranId = ids.get("examiner") ?? "";
  const found: { id: string } | null = unwrap(
    await db().from("institutions").select("id").eq("user_id", kamranId).eq("name", DEMO_INSTITUTION.name).maybeSingle(),
  );
  const institutionId = found?.id ?? (await createInstitution(kamranId, DEMO_INSTITUTION.name, "active"));

  await grant(kamranId, institutionId, kamranId, ["examiner"]);
  await grant(kamranId, institutionId, ids.get("admin") ?? "", ["institution_admin"]);
  await grant(kamranId, institutionId, ids.get("candidate") ?? "", ["candidate"]);
  await grant(kamranId, institutionId, ids.get("bilal") ?? "", ["candidate"]);
  if (found) return;

  await seedSampleData({
    ownerId: kamranId,
    institutionId,
    ayeshaEmail: demoEmail(env, "candidate"),
    bilalEmail: demoEmail(env, "bilal"),
  });
}

export function demoSignIn(env: Pick<Env, "DEMO_EMAIL" | "DEMO_PASSWORD">, role: DemoRole): { email: string; password: string } {
  return { email: demoEmail(env, role), password: env.DEMO_PASSWORD };
}
