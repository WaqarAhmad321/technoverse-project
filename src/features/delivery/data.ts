import "server-only";
import { notFound } from "next/navigation";
import { myCandidateIds, type Member } from "@/lib/access";
import { db, unwrap } from "@/lib/db";
import { examPhase, type ExamPhase } from "@/lib/exam-rules";
import type { Attempt, Candidate, Exam, Result } from "@/lib/exam-types";

// Candidate screens never select answer keys or seeds: only these columns leave the server.
const CANDIDATE_EXAM_COLUMNS =
  "id, institution_id, user_id, created_at, title, instructions, opens_at, closes_at, duration_minutes, total_marks, shuffle_questions, shuffle_options, status, published_at, results_published_at, settings";
const CANDIDATE_ATTEMPT_COLUMNS =
  "id, institution_id, user_id, created_at, exam_id, candidate_id, is_sandbox, status, started_at, deadline_at, credit_seconds, submitted_at, receipt_code, last_seen_at";

export type CandidateAttempt = Omit<Attempt, "seed">;

export type MyExam = {
  exam: Exam;
  phase: ExamPhase;
  attempt: CandidateAttempt | null;
  result: Result | null;
};

export async function loadMyExams(member: Member): Promise<MyExam[]> {
  const candidateIds = await myCandidateIds(member);
  if (candidateIds.length === 0) return [];

  const enrollments: { exam_id: string }[] = unwrap(
    await db().from("enrollments").select("exam_id").eq("institution_id", member.institution.id).in("candidate_id", candidateIds),
  );
  const examIds = [...new Set(enrollments.map((row) => row.exam_id))];
  if (examIds.length === 0) return [];

  const [exams, attempts, results]: [Exam[], CandidateAttempt[], Result[]] = await Promise.all([
    db().from("exams").select(CANDIDATE_EXAM_COLUMNS).in("id", examIds).eq("status", "published").then(unwrap),
    db()
      .from("attempts")
      .select(CANDIDATE_ATTEMPT_COLUMNS)
      .in("exam_id", examIds)
      .in("candidate_id", candidateIds)
      .eq("is_sandbox", false)
      .then(unwrap),
    db()
      .from("results")
      .select("*")
      .in("exam_id", examIds)
      .in("candidate_id", candidateIds)
      .eq("is_current", true)
      .not("published_at", "is", null)
      .then(unwrap),
  ]);

  const now = new Date();
  return exams
    .map((exam) => ({
      exam,
      phase: examPhase(exam, now),
      attempt: attempts.find((attempt) => attempt.exam_id === exam.id) ?? null,
      result: results.find((result) => result.exam_id === exam.id) ?? null,
    }))
    .sort((a, b) => a.exam.opens_at.localeCompare(b.exam.opens_at));
}

export async function loadMyExam(member: Member, examId: string): Promise<MyExam> {
  const mine = (await loadMyExams(member)).find((entry) => entry.exam.id === examId);
  if (!mine) notFound();
  return mine;
}

export type ExamQuestionPreview = { position: number; body: string; kind: string; marks: number };

export async function loadQuestionPreviews(examId: string, institutionId: string): Promise<ExamQuestionPreview[]> {
  const links: { question_id: string; position: number }[] = unwrap(
    await db().from("exam_questions").select("question_id, position").eq("exam_id", examId).eq("institution_id", institutionId),
  );
  if (links.length === 0) return [];
  const questions: { id: string; body: string; kind: string; marks: number }[] = unwrap(
    await db().from("questions").select("id, body, kind, marks").in("id", links.map((link) => link.question_id)),
  );
  return links
    .flatMap((link) => {
      const question = questions.find((row) => row.id === link.question_id);
      return question ? [{ position: link.position, body: question.body, kind: question.kind, marks: question.marks }] : [];
    })
    .sort((a, b) => a.position - b.position);
}

export type MonitorRow = { candidate: Candidate; attempt: CandidateAttempt | null; answeredCount: number };

export async function loadExamForStaff(member: Member, examId: string): Promise<Exam> {
  const exam: Exam | null = unwrap(
    await db().from("exams").select("*").eq("id", examId).eq("institution_id", member.institution.id).maybeSingle(),
  );
  if (!exam) notFound();
  return exam;
}

export async function loadMonitorRows(member: Member, examId: string): Promise<MonitorRow[]> {
  const enrollments: { candidate_id: string }[] = unwrap(
    await db().from("enrollments").select("candidate_id").eq("exam_id", examId).eq("institution_id", member.institution.id),
  );
  const candidateIds = enrollments.map((row) => row.candidate_id);
  if (candidateIds.length === 0) return [];

  const [candidates, attempts]: [Candidate[], CandidateAttempt[]] = await Promise.all([
    db().from("candidates").select("*").in("id", candidateIds).order("roll_number").then(unwrap),
    db()
      .from("attempts")
      .select(CANDIDATE_ATTEMPT_COLUMNS)
      .eq("exam_id", examId)
      .eq("is_sandbox", false)
      .then(unwrap),
  ]);
  const answers: { attempt_id: string }[] =
    attempts.length === 0
      ? []
      : unwrap(await db().from("answers").select("attempt_id").in("attempt_id", attempts.map((attempt) => attempt.id)));

  return candidates.map((candidate) => {
    const attempt = attempts.find((row) => row.candidate_id === candidate.id) ?? null;
    return {
      candidate,
      attempt,
      answeredCount: attempt ? answers.filter((answer) => answer.attempt_id === attempt.id).length : 0,
    };
  });
}

export async function loadOpenExamsForStaff(member: Member): Promise<Exam[]> {
  const exams: Exam[] = unwrap(
    await db()
      .from("exams")
      .select("*")
      .eq("institution_id", member.institution.id)
      .eq("status", "published")
      .order("opens_at", { ascending: false }),
  );
  return exams;
}

export type MyResult = { result: Result; exam: Pick<Exam, "id" | "title" | "total_marks"> };

export async function loadMyResults(member: Member): Promise<MyResult[]> {
  const candidateIds = await myCandidateIds(member);
  if (candidateIds.length === 0) return [];
  const results: Result[] = unwrap(
    await db()
      .from("results")
      .select("*")
      .eq("institution_id", member.institution.id)
      .in("candidate_id", candidateIds)
      .eq("is_current", true)
      .not("published_at", "is", null)
      .order("published_at", { ascending: false }),
  );
  if (results.length === 0) return [];
  const exams: Pick<Exam, "id" | "title" | "total_marks">[] = unwrap(
    await db().from("exams").select("id, title, total_marks").in("id", results.map((result) => result.exam_id)),
  );
  return results.flatMap((result) => {
    const exam = exams.find((row) => row.id === result.exam_id);
    return exam ? [{ result, exam }] : [];
  });
}

export async function loadMyResult(member: Member, resultId: string): Promise<MyResult> {
  const mine = (await loadMyResults(member)).find((entry) => entry.result.id === resultId);
  if (!mine) notFound();
  return mine;
}

export type VerifiedResult = {
  institutionName: string;
  examTitle: string;
  candidateInitials: string;
  total: number;
  maxTotal: number;
  version: number;
  publishedAt: string;
  supersededBy: { version: number; publishedAt: string } | null;
};

function initials(fullName: string): string {
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() ?? ""}.`)
    .join(" ");
}

// Public: shows only what proves the result is genuine. No email, CNIC, roll number or answers.
export async function verifyResult(code: string): Promise<VerifiedResult | null> {
  const result: Result | null = unwrap(
    await db().from("results").select("*").eq("verify_code", code.toUpperCase()).not("published_at", "is", null).maybeSingle(),
  );
  if (!result?.published_at) return null;

  const [exam, candidate, institution, newer]: [
    { title: string } | null,
    { full_name: string } | null,
    { name: string } | null,
    { version: number; published_at: string | null }[],
  ] = await Promise.all([
    db().from("exams").select("title").eq("id", result.exam_id).maybeSingle().then(unwrap),
    db().from("candidates").select("full_name").eq("id", result.candidate_id).maybeSingle().then(unwrap),
    db().from("institutions").select("name").eq("id", result.institution_id).maybeSingle().then(unwrap),
    db()
      .from("results")
      .select("version, published_at")
      .eq("attempt_id", result.attempt_id)
      .gt("version", result.version)
      .not("published_at", "is", null)
      .order("version", { ascending: false })
      .limit(1)
      .then(unwrap),
  ]);

  const latest = newer[0];
  return {
    institutionName: institution?.name ?? "",
    examTitle: exam?.title ?? "",
    candidateInitials: initials(candidate?.full_name ?? ""),
    total: result.total,
    maxTotal: result.max_total,
    version: result.version,
    publishedAt: result.published_at,
    supersededBy: latest?.published_at ? { version: latest.version, publishedAt: latest.published_at } : null,
  };
}
