import "server-only";
import type { Member } from "@/lib/access";
import { db, unwrap } from "@/lib/db";
import type { Candidate } from "@/lib/exam-types";

export type RosterRow = Candidate & { enrolledCount: number };

export async function listCandidates(member: Member): Promise<Candidate[]> {
  return unwrap(
    await db().from("candidates").select("*").eq("institution_id", member.institution.id).order("roll_number", { ascending: true }),
  );
}

export async function listRoster(member: Member): Promise<RosterRow[]> {
  const [candidates, enrollments]: [Candidate[], { candidate_id: string }[]] = await Promise.all([
    listCandidates(member),
    db().from("enrollments").select("candidate_id").eq("institution_id", member.institution.id).then(unwrap),
  ]);
  const counts = new Map<string, number>();
  for (const row of enrollments) counts.set(row.candidate_id, (counts.get(row.candidate_id) ?? 0) + 1);
  return candidates.map((candidate) => ({ ...candidate, enrolledCount: counts.get(candidate.id) ?? 0 }));
}
