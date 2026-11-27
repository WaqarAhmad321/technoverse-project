import "server-only";
import type { Member } from "@/lib/access";
import { auditHash } from "@/lib/audit";
import { db, unwrap } from "@/lib/db";
import type { AuditEvent } from "@/lib/exam-types";

const SHOWN_EVENTS = 200;

export type AuditRow = { event: AuditEvent; actorName: string };

export async function loadAuditRows(member: Member): Promise<AuditRow[]> {
  const events: AuditEvent[] = unwrap(
    await db()
      .from("audit_events")
      .select("*")
      .eq("institution_id", member.institution.id)
      .order("created_at", { ascending: false })
      .limit(SHOWN_EVENTS),
  );
  const actorIds = [...new Set(events.map((event) => event.actor_id))];
  const profiles: { id: string; display_name: string }[] =
    actorIds.length === 0 ? [] : unwrap(await db().from("profiles").select("id, display_name").in("id", actorIds));
  return events.map((event) => ({
    event,
    actorName: profiles.find((profile) => profile.id === event.actor_id)?.display_name ?? "Someone",
  }));
}

export type ChainCheck = { ok: true; count: number } | { ok: false; count: number; brokenAt: number; action: string };

// Walks the chain from the first event: each hash must match its content and the hash before it.
export async function verifyAuditChain(member: Member): Promise<ChainCheck> {
  const events: AuditEvent[] = unwrap(
    await db()
      .from("audit_events")
      .select("*")
      .eq("institution_id", member.institution.id)
      .order("created_at", { ascending: true }),
  );
  let previous = "";
  for (const [index, event] of events.entries()) {
    const expected = auditHash(previous, event.action, event.entity_id, event.payload);
    if (event.prev_hash !== previous || event.hash !== expected) {
      return { ok: false, count: events.length, brokenAt: index + 1, action: event.action };
    }
    previous = event.hash;
  }
  return { ok: true, count: events.length };
}
