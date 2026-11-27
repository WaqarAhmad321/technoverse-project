import "server-only";
import type { Member } from "@/lib/access";
import { db, unwrap } from "@/lib/db";
import type { Attempt, Candidate } from "@/lib/exam-types";

export type MarkingAttempt = Attempt & { candidate: Pick<Candidate, "full_name" | "roll_number"> | null };

// Sandbox attempts never count, so they never reach marking.
export async function listFinishedAttempts(member: Member, examId: string): Promise<MarkingAttempt[]> {
  return unwrap(
    await db()
      .from("attempts")
      .select("*, candidate:candidates(full_name, roll_number)")
      .eq("institution_id", member.institution.id)
      .eq("exam_id", examId)
      .eq("is_sandbox", false)
      .in("status", ["submitted", "auto_submitted"])
      .order("submitted_at", { ascending: true }),
  );
}
