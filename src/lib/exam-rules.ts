import type { Answer, Attempt, Exam } from "@/lib/exam-types";

export type ExamPhase = "draft" | "upcoming" | "open" | "closed";

const MS_PER_SECOND = 1000;

export function examPhase(exam: Pick<Exam, "status" | "opens_at" | "closes_at">, now: Date = new Date()): ExamPhase {
  if (exam.status === "draft") return "draft";
  if (now < new Date(exam.opens_at)) return "upcoming";
  if (now < new Date(exam.closes_at)) return "open";
  return "closed";
}

export function attemptDeadline(attempt: Pick<Attempt, "deadline_at" | "credit_seconds">): Date {
  return new Date(new Date(attempt.deadline_at).getTime() + attempt.credit_seconds * MS_PER_SECOND);
}

export function isAttemptFinished(
  attempt: Pick<Attempt, "status" | "deadline_at" | "credit_seconds">,
  now: Date = new Date(),
): boolean {
  return attempt.status !== "in_progress" || now >= attemptDeadline(attempt);
}

// An answer counts only if the server received it before the attempt's deadline.
export function answerCounts(
  answer: Pick<Answer, "received_at">,
  attempt: Pick<Attempt, "deadline_at" | "credit_seconds">,
): boolean {
  return new Date(answer.received_at) <= attemptDeadline(attempt);
}
