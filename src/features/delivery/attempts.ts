import "server-only";
import { myCandidateIds, type Member } from "@/lib/access";
import { newReceiptCode } from "@/lib/codes";
import { db, unwrap } from "@/lib/db";
import { attemptDeadline, examPhase, isAttemptFinished } from "@/lib/exam-rules";
import type { Announcement, Answer, AnswerResponse, Attempt, Exam, Question } from "@/lib/exam-types";
import { buildPaper, newPaperSeed } from "@/lib/paper";

const UNIQUE_VIOLATION = "23505";
const PERCENT = 100;
const MS_PER_MINUTE = 60 * 1000;
const MS_PER_SECOND = 1000;
const OFFLINE_GAP_SECONDS = 30;

// Everything about an attempt a candidate's browser may see: no seed, no answer keys.
const ATTEMPT_COLUMNS =
  "id, institution_id, user_id, created_at, exam_id, candidate_id, is_sandbox, status, started_at, deadline_at, credit_seconds, submitted_at, receipt_code, last_seen_at";
const PAPER_COLUMNS = "question_id, position, kind, body, topic, marks, multiple_rule, options";

export type CandidateAttempt = Omit<Attempt, "seed">;
export type PaperQuestion = {
  question_id: string;
  position: number;
  kind: Question["kind"];
  body: string;
  topic: string;
  marks: number;
  multiple_rule: Question["multiple_rule"];
  options: Question["options"];
};
export type SavedAnswer = Pick<Answer, "question_id" | "response" | "marked_for_review" | "client_seq" | "received_at">;

async function candidateIdFor(member: Member, examId: string): Promise<string | null> {
  const candidateIds = await myCandidateIds(member);
  if (candidateIds.length === 0) return null;
  const enrollment: { candidate_id: string } | null = unwrap(
    await db()
      .from("enrollments")
      .select("candidate_id")
      .eq("exam_id", examId)
      .eq("institution_id", member.institution.id)
      .in("candidate_id", candidateIds)
      .limit(1)
      .maybeSingle(),
  );
  return enrollment?.candidate_id ?? null;
}

async function findAttempt(examId: string, candidateId: string): Promise<CandidateAttempt | null> {
  return unwrap(
    await db()
      .from("attempts")
      .select(ATTEMPT_COLUMNS)
      .eq("exam_id", examId)
      .eq("candidate_id", candidateId)
      .eq("is_sandbox", false)
      .maybeSingle(),
  );
}

// The server finishes an attempt at its deadline, whoever reads it next.
export async function finishIfExpired(attempt: CandidateAttempt, now: Date = new Date()): Promise<CandidateAttempt> {
  if (attempt.status !== "in_progress" || !isAttemptFinished(attempt, now)) return attempt;
  const finished: CandidateAttempt | null = unwrap(
    await db()
      .from("attempts")
      .update({ status: "auto_submitted", submitted_at: attemptDeadline(attempt).toISOString(), receipt_code: newReceiptCode() })
      .eq("id", attempt.id)
      .eq("status", "in_progress")
      .select(ATTEMPT_COLUMNS)
      .maybeSingle(),
  );
  return finished ?? (await reloadAttempt(attempt.id)) ?? attempt;
}

async function reloadAttempt(attemptId: string): Promise<CandidateAttempt | null> {
  return unwrap(await db().from("attempts").select(ATTEMPT_COLUMNS).eq("id", attemptId).maybeSingle());
}

export async function loadMyAttempt(member: Member, examId: string): Promise<CandidateAttempt | null> {
  const candidateId = await candidateIdFor(member, examId);
  if (!candidateId) return null;
  const attempt = await findAttempt(examId, candidateId);
  return attempt ? finishIfExpired(attempt) : null;
}

export type StartOutcome = { kind: "started"; attempt: CandidateAttempt } | { kind: "refused"; reason: string };

async function loadPublishedExam(member: Member, examId: string): Promise<Exam | null> {
  return unwrap(
    await db()
      .from("exams")
      .select("*")
      .eq("id", examId)
      .eq("institution_id", member.institution.id)
      .eq("status", "published")
      .maybeSingle(),
  );
}

async function loadExamItems(exam: Exam): Promise<{ position: number; question: Question }[]> {
  const links: { question_id: string; position: number }[] = unwrap(
    await db().from("exam_questions").select("question_id, position").eq("exam_id", exam.id),
  );
  if (links.length === 0) return [];
  const questions: Question[] = unwrap(
    await db().from("questions").select("*").in("id", links.map((link) => link.question_id)),
  );
  return links.flatMap((link) => {
    const question = questions.find((row) => row.id === link.question_id);
    return question ? [{ position: link.position, question }] : [];
  });
}

// Starting twice returns the first attempt: the unique key allows one real attempt per candidate.
export async function startAttempt(member: Member, examId: string): Promise<StartOutcome> {
  const [candidateId, exam] = await Promise.all([candidateIdFor(member, examId), loadPublishedExam(member, examId)]);
  if (!candidateId || !exam) return { kind: "refused", reason: "You are not enrolled in this exam." };

  const [existing, items, candidate]: [CandidateAttempt | null, { position: number; question: Question }[], { extra_time_pct: number } | null] =
    await Promise.all([
      findAttempt(examId, candidateId),
      loadExamItems(exam),
      db().from("candidates").select("extra_time_pct").eq("id", candidateId).maybeSingle().then(unwrap),
    ]);
  if (existing) return { kind: "started", attempt: await finishIfExpired(existing) };
  if (examPhase(exam) !== "open") return { kind: "refused", reason: "This exam is not open right now." };
  if (items.length === 0) return { kind: "refused", reason: "This exam has no questions yet. Tell your examiner." };

  const seed = newPaperSeed();
  const startedAt = new Date();
  const minutes = exam.duration_minutes * (1 + (candidate?.extra_time_pct ?? 0) / PERCENT);
  const owned = { user_id: member.user.id, institution_id: member.institution.id };

  const { data, error } = await db()
    .from("attempts")
    .insert({
      ...owned,
      exam_id: exam.id,
      candidate_id: candidateId,
      is_sandbox: false,
      status: "in_progress",
      seed,
      started_at: startedAt.toISOString(),
      deadline_at: new Date(startedAt.getTime() + minutes * MS_PER_MINUTE).toISOString(),
      last_seen_at: startedAt.toISOString(),
    })
    .select(ATTEMPT_COLUMNS)
    .single();
  if (error?.code === UNIQUE_VIOLATION) {
    const raced = await findAttempt(examId, candidateId);
    if (raced) return { kind: "started", attempt: raced };
  }
  if (error || !data) throw new Error(`Database request failed: ${error?.message ?? "no attempt returned"}`);
  const attempt: CandidateAttempt = data;

  const paper = buildPaper(exam, items, seed).map((row) => ({ ...owned, attempt_id: attempt.id, ...row }));
  unwrap(await db().from("attempt_questions").insert(paper));
  return { kind: "started", attempt };
}

export async function loadPaper(attemptId: string): Promise<PaperQuestion[]> {
  return unwrap(
    await db().from("attempt_questions").select(PAPER_COLUMNS).eq("attempt_id", attemptId).order("position", { ascending: true }),
  );
}

export async function loadSavedAnswers(attemptId: string): Promise<SavedAnswer[]> {
  return unwrap(
    await db().from("answers").select("question_id, response, marked_for_review, client_seq, received_at").eq("attempt_id", attemptId),
  );
}

export async function loadAnnouncements(examId: string): Promise<Pick<Announcement, "id" | "body" | "question_position" | "created_at">[]> {
  return unwrap(
    await db()
      .from("announcements")
      .select("id, body, question_position, created_at")
      .eq("exam_id", examId)
      .order("created_at", { ascending: false }),
  );
}

// Route handlers: the attempt must belong to one of this person's roster rows, or be their own sandbox.
export async function loadOwnAttempt(member: Member, attemptId: string): Promise<CandidateAttempt | null> {
  const candidateIds = await myCandidateIds(member);
  const attempt: CandidateAttempt | null = unwrap(
    await db()
      .from("attempts")
      .select(ATTEMPT_COLUMNS)
      .eq("id", attemptId)
      .eq("institution_id", member.institution.id)
      .maybeSingle(),
  );
  if (!attempt) return null;
  const isMine = attempt.is_sandbox
    ? attempt.user_id === member.user.id
    : attempt.candidate_id !== null && candidateIds.includes(attempt.candidate_id);
  return isMine ? finishIfExpired(attempt) : null;
}

async function createAttempt(member: Member, exam: Exam, candidateId: string | null, extraTimePct: number): Promise<CandidateAttempt> {
  const items = await loadExamItems(exam);
  const seed = newPaperSeed();
  const startedAt = new Date();
  const minutes = exam.duration_minutes * (1 + extraTimePct / PERCENT);
  const owned = { user_id: member.user.id, institution_id: member.institution.id };
  const created: CandidateAttempt | null = unwrap(
    await db()
      .from("attempts")
      .insert({
        ...owned,
        exam_id: exam.id,
        candidate_id: candidateId,
        is_sandbox: candidateId === null,
        status: "in_progress",
        seed,
        started_at: startedAt.toISOString(),
        deadline_at: new Date(startedAt.getTime() + minutes * MS_PER_MINUTE).toISOString(),
        last_seen_at: startedAt.toISOString(),
      })
      .select(ATTEMPT_COLUMNS)
      .single(),
  );
  if (!created) throw new Error("The preview attempt was not created.");
  const attempt = created;
  const paper = buildPaper(exam, items, seed).map((row) => ({ ...owned, attempt_id: attempt.id, ...row }));
  if (paper.length > 0) unwrap(await db().from("attempt_questions").insert(paper));
  return attempt;
}

async function findSandbox(member: Member, examId: string): Promise<CandidateAttempt | null> {
  return unwrap(
    await db()
      .from("attempts")
      .select(ATTEMPT_COLUMNS)
      .eq("exam_id", examId)
      .eq("is_sandbox", true)
      .eq("user_id", member.user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  );
}

// The examiner's preview: the real workspace on a sandbox attempt that no grade, result or statistic counts.
export async function loadOrStartSandbox(member: Member, exam: Exam): Promise<CandidateAttempt> {
  const existing = await findSandbox(member, exam.id);
  if (existing && !isAttemptFinished(existing)) return existing;
  if (existing) await restartSandbox(member, exam.id);
  return createAttempt(member, exam, null, 0);
}

export async function restartSandbox(member: Member, examId: string): Promise<void> {
  unwrap(
    await db()
      .from("attempts")
      .delete()
      .eq("exam_id", examId)
      .eq("is_sandbox", true)
      .eq("user_id", member.user.id)
      .eq("institution_id", member.institution.id),
  );
}

export async function loadScratch(attemptId: string): Promise<Record<string, string>> {
  const rows: { question_id: string; body: string }[] = unwrap(
    await db().from("scratchpads").select("question_id, body").eq("attempt_id", attemptId),
  );
  return Object.fromEntries(rows.map((row) => [row.question_id, row.body]));
}

export async function saveScratch(member: Member, attempt: CandidateAttempt, questionId: string, body: string): Promise<void> {
  unwrap(
    await db()
      .from("scratchpads")
      .upsert(
        {
          user_id: member.user.id,
          institution_id: member.institution.id,
          attempt_id: attempt.id,
          question_id: questionId,
          body,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "attempt_id,question_id" },
      ),
  );
}

export type AnswerOp = {
  question_id: string;
  response: AnswerResponse;
  marked_for_review: boolean;
  client_seq: number;
  saved_offline: boolean;
};

// Idempotent: an op only lands if its client_seq is newer than what the server holds.
export async function saveAnswers(member: Member, attempt: CandidateAttempt, ops: AnswerOp[]): Promise<number[]> {
  const paperIds = new Set((await loadPaper(attempt.id)).map((question) => question.question_id));
  const valid = ops.filter((op) => paperIds.has(op.question_id));
  const current = await loadSavedAnswers(attempt.id);
  const newest = new Map<string, AnswerOp>();
  for (const op of valid) {
    const held = newest.get(op.question_id);
    if (!held || op.client_seq > held.client_seq) newest.set(op.question_id, op);
  }
  const toWrite = [...newest.values()].filter(
    (op) => op.client_seq > (current.find((row) => row.question_id === op.question_id)?.client_seq ?? -1),
  );

  if (toWrite.length > 0) {
    const receivedAt = new Date().toISOString();
    unwrap(
      await db()
        .from("answers")
        .upsert(
          toWrite.map((op) => ({
            user_id: member.user.id,
            institution_id: member.institution.id,
            attempt_id: attempt.id,
            question_id: op.question_id,
            response: op.response,
            marked_for_review: op.marked_for_review,
            client_seq: op.client_seq,
            saved_offline: op.saved_offline,
            received_at: receivedAt,
          })),
          { onConflict: "attempt_id,question_id" },
        ),
    );
  }
  return valid.map((op) => op.client_seq);
}

export async function recordIncident(
  member: Member,
  attempt: CandidateAttempt,
  kind: string,
  details: Record<string, unknown>,
): Promise<void> {
  unwrap(
    await db()
      .from("incidents")
      .insert({ user_id: member.user.id, institution_id: member.institution.id, attempt_id: attempt.id, kind, details }),
  );
}

// A heartbeat after a long silence means the candidate was cut off: recorded as a signal, never a penalty.
export async function recordHeartbeat(member: Member, attempt: CandidateAttempt): Promise<void> {
  const now = new Date();
  if (attempt.last_seen_at) {
    const gapSeconds = Math.round((now.getTime() - new Date(attempt.last_seen_at).getTime()) / MS_PER_SECOND);
    if (gapSeconds > OFFLINE_GAP_SECONDS) await recordIncident(member, attempt, "offline", { seconds: gapSeconds });
  }
  unwrap(await db().from("attempts").update({ last_seen_at: now.toISOString() }).eq("id", attempt.id));
}

// Submitting twice returns the first receipt: only an in-progress attempt changes.
export async function submitAttempt(attempt: CandidateAttempt): Promise<CandidateAttempt> {
  if (attempt.status !== "in_progress") return attempt;
  const submitted: CandidateAttempt | null = unwrap(
    await db()
      .from("attempts")
      .update({ status: "submitted", submitted_at: new Date().toISOString(), receipt_code: newReceiptCode() })
      .eq("id", attempt.id)
      .eq("status", "in_progress")
      .select(ATTEMPT_COLUMNS)
      .maybeSingle(),
  );
  return submitted ?? (await reloadAttempt(attempt.id)) ?? attempt;
}
