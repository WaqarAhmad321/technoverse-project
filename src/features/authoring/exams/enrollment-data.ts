import "server-only";
import type { Member } from "@/lib/access";
import { db, unwrap } from "@/lib/db";
import type { Candidate } from "@/lib/exam-types";
import { listCandidates } from "../roster/data";

export type EnrolledRow = Candidate & { hasStarted: boolean };
export type EnrollmentView = { enrolled: EnrolledRow[]; notEnrolled: Candidate[] };

export async function getEnrollment(member: Member, examId: string): Promise<EnrollmentView> {
  const [candidates, enrollments, attempts]: [Candidate[], { candidate_id: string }[], { candidate_id: string | null }[]] =
    await Promise.all([
      listCandidates(member),
      db().from("enrollments").select("candidate_id").eq("institution_id", member.institution.id).eq("exam_id", examId).then(unwrap),
      db()
        .from("attempts")
        .select("candidate_id")
        .eq("institution_id", member.institution.id)
        .eq("exam_id", examId)
        .eq("is_sandbox", false)
        .then(unwrap),
    ]);
  const enrolledIds = new Set(enrollments.map((row) => row.candidate_id));
  const startedIds = new Set(attempts.map((row) => row.candidate_id));
  return {
    enrolled: candidates.filter((c) => enrolledIds.has(c.id)).map((c) => ({ ...c, hasStarted: startedIds.has(c.id) })),
    notEnrolled: candidates.filter((c) => !enrolledIds.has(c.id)),
  };
}
