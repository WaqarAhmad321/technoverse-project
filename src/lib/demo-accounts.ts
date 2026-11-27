import "server-only";
import type { Env } from "@/lib/env-rules";

export const DEMO_INSTITUTION = { name: "Ravi Science College, Lahore", kind: "college", city: "Lahore" } as const;

export type DemoRole = "examiner" | "candidate" | "admin" | "platform";

export const DEMO_ROLES: readonly DemoRole[] = ["examiner", "candidate", "admin", "platform"];

type DemoPerson = { name: string; tag: string };

export const DEMO_PEOPLE: Record<DemoRole | "bilal", DemoPerson> = {
  examiner: { name: "Kamran Siddiqui", tag: "examiner" },
  candidate: { name: "Ayesha Khan", tag: "candidate" },
  admin: { name: "Sana Iqbal", tag: "admin" },
  platform: { name: "Farah Naveed", tag: "platform" },
  bilal: { name: "Bilal Ahmed", tag: "bilal" },
};

// demo@x.pk becomes demo+examiner@x.pk; an address that already has a tag gets "-examiner" added to it.
export function taggedEmail(baseEmail: string, tag: string): string {
  const [local, domain] = baseEmail.toLowerCase().split("@");
  const separator = local?.includes("+") ? "-" : "+";
  return `${local}${separator}${tag}@${domain}`;
}

export function demoEmail(env: Pick<Env, "DEMO_EMAIL">, person: DemoRole | "bilal"): string {
  return taggedEmail(env.DEMO_EMAIL, DEMO_PEOPLE[person].tag);
}
