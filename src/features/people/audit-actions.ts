"use server";

import { requireMember } from "@/lib/access";
import { verifyAuditChain } from "./audit-data";

export type VerifyState = { ok: boolean; message: string } | null;

export async function verifyChain(): Promise<VerifyState> {
  const member = await requireMember("institution_admin", "controller", "observer");
  const result = await verifyAuditChain(member);
  if (result.ok) return { ok: true, message: `All ${result.count} events verified. Nobody has changed the history.` };
  return { ok: false, message: `Event ${result.brokenAt} (${result.action}) does not match: the log was changed after it was written.` };
}
