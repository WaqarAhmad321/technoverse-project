import "server-only";
import { createHash } from "node:crypto";
import type { Member } from "@/lib/access";
import { db, unwrap } from "@/lib/db";

const UNIQUE_VIOLATION = "23505";
const MAX_TRIES = 3;

export function auditHash(prevHash: string, action: string, entityId: string | null, payload: unknown): string {
  return createHash("sha256")
    .update(`${prevHash}|${action}|${entityId ?? ""}|${JSON.stringify(payload)}`)
    .digest("hex");
}

async function lastHash(institutionId: string): Promise<string> {
  const last: { hash: string } | null = unwrap(
    await db()
      .from("audit_events")
      .select("hash")
      .eq("institution_id", institutionId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  );
  return last?.hash ?? "";
}

// Appends to the institution's hash chain. A racing writer takes the same previous hash and
// hits the unique key, so this retries on the new tip instead of forking the chain.
export async function recordAudit(
  member: Member,
  action: string,
  entityId: string | null,
  payload: Record<string, unknown> = {},
): Promise<void> {
  for (let attempt = 1; attempt <= MAX_TRIES; attempt += 1) {
    const prevHash = await lastHash(member.institution.id);
    const { error } = await db()
      .from("audit_events")
      .insert({
        user_id: member.user.id,
        institution_id: member.institution.id,
        actor_id: member.user.id,
        action,
        entity_id: entityId,
        payload,
        prev_hash: prevHash,
        hash: auditHash(prevHash, action, entityId, payload),
      });
    if (!error) return;
    if (error.code !== UNIQUE_VIOLATION) throw new Error(`Database request failed: ${error.message}`);
  }
  throw new Error("Could not record the audit event: the chain kept moving.");
}
