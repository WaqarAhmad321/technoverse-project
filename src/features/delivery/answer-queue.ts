import type { AnswerResponse } from "@/lib/exam-types";

export type QueuedAnswer = {
  question_id: string;
  response: AnswerResponse;
  marked_for_review: boolean;
  client_seq: number;
  saved_offline: boolean;
};

export type AnswerQueue = Record<string, QueuedAnswer>;

const queueKey = (attemptId: string) => `imtihaan:queue:${attemptId}`;
const seqKey = (attemptId: string) => `imtihaan:seq:${attemptId}`;

// Storage can be missing or blocked (private mode, full disk). The queue then lives in memory only.
function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null): void {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Memory still holds the answers; they are sent as soon as the connection allows.
  }
}

function isQueuedAnswer(value: unknown): value is QueuedAnswer {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.question_id === "string" && typeof candidate.client_seq === "number";
}

export function loadQueue(attemptId: string): AnswerQueue {
  const raw = read(queueKey(attemptId));
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};
    return Object.fromEntries(Object.entries(parsed).filter(([, value]) => isQueuedAnswer(value))) as AnswerQueue;
  } catch {
    return {};
  }
}

export function storeQueue(attemptId: string, queue: AnswerQueue): void {
  write(queueKey(attemptId), Object.keys(queue).length === 0 ? null : JSON.stringify(queue));
}

// Each change gets a higher number than any before it, so the server keeps only the newest.
export function nextSeq(attemptId: string, floor: number): number {
  const stored = Number(read(seqKey(attemptId)) ?? "0");
  const next = Math.max(Number.isFinite(stored) ? stored : 0, floor) + 1;
  write(seqKey(attemptId), String(next));
  return next;
}

// After submit nothing of the attempt stays on a possibly shared phone.
export function clearAttemptStorage(attemptId: string): void {
  write(queueKey(attemptId), null);
  write(seqKey(attemptId), null);
}
