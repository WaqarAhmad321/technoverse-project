import "server-only";
import { myCandidateIds, type Member } from "@/lib/access";
import { db, unwrap } from "@/lib/db";
import { examPhase } from "@/lib/exam-rules";
import type { Exam } from "@/lib/exam-types";

async function countRows(table: string, filters: Record<string, string>): Promise<number> {
  let query = db().from(table).select("id", { count: "exact", head: true });
  for (const [column, value] of Object.entries(filters)) query = query.eq(column, value);
  const { count, error } = await query;
  if (error) throw new Error(`Database request failed: ${error.message}`);
  return count ?? 0;
}

export type StaffSummary = { openNow: number; drafts: number; toPublish: number; questions: number; people: number; auditEvents: number };

export async function loadStaffSummary(member: Member): Promise<StaffSummary> {
  const institutionId = member.institution.id;
  const [exams, questions, people, auditEvents]: [Pick<Exam, "status" | "opens_at" | "closes_at" | "results_published_at">[], number, number, number] =
    await Promise.all([
      db().from("exams").select("status, opens_at, closes_at, results_published_at").eq("institution_id", institutionId).then(unwrap),
      countRows("questions", { institution_id: institutionId }),
      countRows("memberships", { institution_id: institutionId }),
      countRows("audit_events", { institution_id: institutionId }),
    ]);
  const now = new Date();
  return {
    openNow: exams.filter((exam) => examPhase(exam, now) === "open").length,
    drafts: exams.filter((exam) => exam.status === "draft").length,
    toPublish: exams.filter((exam) => examPhase(exam, now) === "closed" && !exam.results_published_at).length,
    questions,
    people,
    auditEvents,
  };
}

export type CandidateSummary = { nextExam: Pick<Exam, "id" | "title" | "duration_minutes" | "closes_at" | "opens_at"> | null; nextIsOpen: boolean; upcoming: number; results: number };

export async function loadCandidateSummary(member: Member): Promise<CandidateSummary> {
  const candidateIds = await myCandidateIds(member);
  if (candidateIds.length === 0) return { nextExam: null, nextIsOpen: false, upcoming: 0, results: 0 };
  const enrollments: { exam_id: string }[] = unwrap(await db().from("enrollments").select("exam_id").in("candidate_id", candidateIds));
  const examIds = enrollments.map((row) => row.exam_id);
  if (examIds.length === 0) return { nextExam: null, nextIsOpen: false, upcoming: 0, results: 0 };

  const [exams, attempts, results]: [Exam[], { exam_id: string; status: string }[], { id: string }[]] = await Promise.all([
    db().from("exams").select("*").in("id", examIds).eq("status", "published").then(unwrap),
    db().from("attempts").select("exam_id, status").in("candidate_id", candidateIds).eq("is_sandbox", false).then(unwrap),
    db().from("results").select("id").in("candidate_id", candidateIds).eq("is_current", true).lte("published_at", new Date().toISOString()).then(unwrap),
  ]);
  const now = new Date();
  const finished = new Set(attempts.filter((row) => row.status !== "in_progress").map((row) => row.exam_id));
  const open = exams.filter((exam) => examPhase(exam, now) === "open" && !finished.has(exam.id));
  const upcoming = exams.filter((exam) => examPhase(exam, now) === "upcoming").sort((a, b) => a.opens_at.localeCompare(b.opens_at));
  const next = open[0] ?? upcoming[0] ?? null;
  return { nextExam: next, nextIsOpen: next !== null && open.includes(next), upcoming: upcoming.length, results: results.length };
}
