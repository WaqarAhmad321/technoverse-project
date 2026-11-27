import "server-only";
import type { Member } from "@/lib/access";
import { db, unwrap } from "@/lib/db";
import type { Candidate } from "@/lib/exam-types";

export async function listCandidates(member: Member): Promise<Candidate[]> {
  return unwrap(
    await db().from("candidates").select("*").eq("institution_id", member.institution.id).order("roll_number", { ascending: true }),
  );
}
