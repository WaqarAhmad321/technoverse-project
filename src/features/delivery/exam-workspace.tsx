"use client";

// Rendered only in the browser (see exam-workspace-loader): it reads answers kept on this phone at start.

import { Check, CircleAlert, Clock, Flag, Megaphone, WifiOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import type { AnswerResponse } from "@/lib/exam-types";
import { cn } from "@/lib/utils";
import { clearAttemptStorage, loadQueue, nextSeq, storeQueue, type AnswerQueue, type QueuedAnswer } from "./answer-queue";
import type { PaperQuestion, SavedAnswer } from "./attempts";

const HEARTBEAT_MS = 15_000;
const FLUSH_DELAY_MS = 400;
const RETRY_DELAYS_MS = [1_000, 2_000, 4_000, 8_000, 10_000];
const TICK_MS = 1_000;
const LOW_TIME_MS = 5 * 60 * 1_000;
const MS_PER_SECOND = 1_000;
const SECONDS_PER_MINUTE = 60;

type Announcement = { id: string; body: string; question_position: number | null; created_at: string };
type AnswerState = { response: AnswerResponse; marked: boolean };
type ServerState = { status: string; deadline: string; server_now: string; receipt_code: string | null };

type WorkspaceProps = {
  attemptId: string;
  examId: string;
  examTitle: string;
  paper: PaperQuestion[];
  saved: SavedAnswer[];
  deadline: string;
  serverNow: string;
  announcements: Announcement[];
};

function isAnswered(state: AnswerState | undefined): boolean {
  if (!state) return false;
  return (state.response.choices?.length ?? 0) > 0 || (state.response.text?.trim().length ?? 0) > 0;
}

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / MS_PER_SECOND));
  const minutes = Math.floor(totalSeconds / SECONDS_PER_MINUTE);
  const seconds = totalSeconds % SECONDS_PER_MINUTE;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function readServerState(value: unknown): ServerState | null {
  if (typeof value !== "object" || value === null) return null;
  const body = value as Record<string, unknown>;
  if (typeof body.status !== "string" || typeof body.deadline !== "string" || typeof body.server_now !== "string") return null;
  return {
    status: body.status,
    deadline: body.deadline,
    server_now: body.server_now,
    receipt_code: typeof body.receipt_code === "string" ? body.receipt_code : null,
  };
}

function readSavedSeqs(value: unknown): number[] {
  if (typeof value !== "object" || value === null) return [];
  const saved = (value as Record<string, unknown>).saved;
  return Array.isArray(saved) ? saved.filter((seq): seq is number => typeof seq === "number") : [];
}

function readAnnouncements(value: unknown): Announcement[] | null {
  if (typeof value !== "object" || value === null) return null;
  const list = (value as Record<string, unknown>).announcements;
  if (!Array.isArray(list)) return null;
  return list.filter(
    (item): item is Announcement =>
      typeof item === "object" && item !== null && typeof item.id === "string" && typeof item.body === "string",
  );
}

export function ExamWorkspace(props: WorkspaceProps) {
  const { attemptId, examId, examTitle, paper } = props;
  const router = useRouter();
  const receiptUrl = `/exams/${examId}/receipt`;

  const [initialQueue] = useState<AnswerQueue>(() => loadQueue(attemptId));
  const [answers, setAnswers] = useState<Record<string, AnswerState>>(() => ({
    ...Object.fromEntries(props.saved.map((row) => [row.question_id, { response: row.response, marked: row.marked_for_review }])),
    ...Object.fromEntries(
      Object.values(initialQueue).map((op) => [op.question_id, { response: op.response, marked: op.marked_for_review }]),
    ),
  }));
  const [pending, setPending] = useState<AnswerQueue>(initialQueue);
  const [isOnline, setIsOnline] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [deadlineMs, setDeadlineMs] = useState(() => Date.parse(props.deadline));
  const [offsetMs, setOffsetMs] = useState(() => Date.parse(props.serverNow) - Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [index, setIndex] = useState(0);
  const [announcements, setAnnouncements] = useState(props.announcements);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitProblem, setSubmitProblem] = useState<string | null>(null);

  const pendingRef = useRef<AnswerQueue>(initialQueue);
  const flushRef = useRef<() => Promise<boolean>>(async () => true);
  const isFlushing = useRef(false);
  const retryCount = useRef(0);
  const flushTimer = useRef<number | null>(null);
  const isFinishing = useRef(false);
  const highestSeq = useRef(
    Math.max(0, ...props.saved.map((row) => row.client_seq), ...Object.values(initialQueue).map((op) => op.client_seq)),
  );

  const updatePending = useCallback(
    (next: AnswerQueue) => {
      pendingRef.current = next;
      storeQueue(attemptId, next);
      setPending(next);
    },
    [attemptId],
  );

  const goToReceipt = useCallback(() => {
    clearAttemptStorage(attemptId);
    router.replace(receiptUrl);
    router.refresh();
  }, [attemptId, receiptUrl, router]);

  const applyServerState = useCallback(
    (state: ServerState) => {
      setDeadlineMs(Date.parse(state.deadline));
      setOffsetMs(Date.parse(state.server_now) - Date.now());
      if (state.status !== "in_progress") goToReceipt();
    },
    [goToReceipt],
  );

  const flush = useCallback(async (): Promise<boolean> => {
    if (isFlushing.current) return false;
    const ops = Object.values(pendingRef.current);
    if (ops.length === 0) return true;
    isFlushing.current = true;
    setIsSending(true);
    try {
      const response = await fetch(`/api/attempts/${attemptId}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ops }),
      });
      const body: unknown = await response.json().catch(() => null);
      const state = readServerState(body);
      if (response.status === 409 && state) {
        applyServerState(state);
        return false;
      }
      if (!response.ok || !state) throw new Error(`Saving answers failed with ${response.status}`);

      const savedSeqs = new Set(readSavedSeqs(body));
      const remaining = Object.fromEntries(
        Object.entries(pendingRef.current).filter(([, op]) => !savedSeqs.has(op.client_seq)),
      );
      updatePending(remaining);
      retryCount.current = 0;
      setIsOnline(true);
      applyServerState(state);
      return Object.keys(remaining).length === 0;
    } catch {
      setIsOnline(false);
      const delay = RETRY_DELAYS_MS[Math.min(retryCount.current, RETRY_DELAYS_MS.length - 1)] ?? FLUSH_DELAY_MS;
      retryCount.current += 1;
      window.setTimeout(() => void flushRef.current(), delay);
      return false;
    } finally {
      isFlushing.current = false;
      setIsSending(false);
    }
  }, [applyServerState, attemptId, updatePending]);

  const scheduleFlush = useCallback(() => {
    if (flushTimer.current !== null) window.clearTimeout(flushTimer.current);
    flushTimer.current = window.setTimeout(() => void flush(), FLUSH_DELAY_MS);
  }, [flush]);

  useEffect(() => {
    flushRef.current = flush;
  }, [flush]);

  // Answers kept on this phone from before a reload or an outage are sent first.
  useEffect(() => {
    if (Object.keys(initialQueue).length > 0) scheduleFlush();
  }, [initialQueue, scheduleFlush]);

  const heartbeat = useCallback(async () => {
    try {
      const response = await fetch(`/api/attempts/${attemptId}/heartbeat`, { method: "POST" });
      const body: unknown = await response.json().catch(() => null);
      const state = readServerState(body);
      if (!response.ok || !state) throw new Error(`Heartbeat failed with ${response.status}`);
      setIsOnline(true);
      applyServerState(state);
      const latest = readAnnouncements(body);
      if (latest) setAnnouncements(latest);
      if (Object.keys(pendingRef.current).length > 0) void flush();
    } catch {
      setIsOnline(false);
    }
  }, [applyServerState, attemptId, flush]);

  useEffect(() => {
    const ticker = window.setInterval(() => setNow(Date.now()), TICK_MS);
    const beat = window.setInterval(() => void heartbeat(), HEARTBEAT_MS);
    const onOnline = () => void heartbeat();
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.clearInterval(ticker);
      window.clearInterval(beat);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [heartbeat]);

  const finishAtDeadline = useCallback(async () => {
    if (isFinishing.current) return;
    isFinishing.current = true;
    await flush();
    try {
      const response = await fetch(`/api/attempts/${attemptId}/submit`, { method: "POST" });
      if (response.ok) goToReceipt();
    } finally {
      isFinishing.current = false;
    }
  }, [attemptId, flush, goToReceipt]);

  const remainingMs = deadlineMs - (now + offsetMs);
  useEffect(() => {
    if (remainingMs <= 0) void finishAtDeadline();
  }, [finishAtDeadline, remainingMs]);

  function record(questionId: string, next: AnswerState) {
    setAnswers((current) => ({ ...current, [questionId]: next }));
    const seq = nextSeq(attemptId, highestSeq.current);
    highestSeq.current = seq;
    const op: QueuedAnswer = {
      question_id: questionId,
      response: next.response,
      marked_for_review: next.marked,
      client_seq: seq,
      saved_offline: !isOnline,
    };
    updatePending({ ...pendingRef.current, [questionId]: op });
    scheduleFlush();
  }

  async function submit() {
    setIsSubmitting(true);
    setSubmitProblem(null);
    const allSent = await flush();
    if (!allSent && Object.keys(pendingRef.current).length > 0) {
      setSubmitProblem(
        "You are offline. Your answers are safe on this phone. Submit again when the connection is back; at the deadline the server keeps everything it received.",
      );
      setIsSubmitting(false);
      return;
    }
    try {
      const response = await fetch(`/api/attempts/${attemptId}/submit`, { method: "POST" });
      if (!response.ok) throw new Error(`Submit failed with ${response.status}`);
      goToReceipt();
    } catch {
      setSubmitProblem("We could not reach the exam server. Your answers are saved. Try submitting again in a moment.");
      setIsSubmitting(false);
    }
  }

  const question = paper[index];
  const answeredCount = useMemo(() => paper.filter((item) => isAnswered(answers[item.question_id])).length, [answers, paper]);
  const pendingCount = Object.keys(pending).length;
  const unansweredCount = paper.length - answeredCount;
  const isLowTime = remainingMs < LOW_TIME_MS;

  if (!question) return null;
  const current = answers[question.question_id] ?? { response: {}, marked: false };

  return (
    <div className="flex flex-col gap-4 pb-28">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {announcements.length > 0 && (
            <section aria-label="Announcements" aria-live="polite" className="flex flex-col gap-2 rounded-3xl bg-card p-4 md:p-6">
              {announcements.map((item) => (
                <p key={item.id} className="flex items-start gap-2 text-base">
                  <Megaphone aria-hidden className="mt-1 size-4 shrink-0 text-muted-foreground" />
                  <span>
                    {item.question_position ? <span className="font-medium">Q{item.question_position}: </span> : null}
                    {item.body}
                  </span>
                </p>
              ))}
            </section>
          )}

          <article aria-labelledby="question-text" className="rounded-3xl bg-card p-6 md:p-8">
            <p className="text-sm text-muted-foreground">
              Question {question.position} of {paper.length} · {question.marks} {question.marks === 1 ? "mark" : "marks"}
              {question.kind === "multiple" ? " · choose all that apply" : ""}
            </p>
            <h2 id="question-text" className="mt-2 text-lg leading-7 font-medium">
              {question.body}
            </h2>

            {question.kind === "written" ? (
              <div className="mt-6 flex flex-col gap-1.5">
                <label htmlFor="written-answer" className="text-sm font-medium">
                  Your answer
                </label>
                <Textarea
                  id="written-answer"
                  key={question.question_id}
                  defaultValue={current.response.text ?? ""}
                  rows={8}
                  onChange={(event) => record(question.question_id, { ...current, response: { text: event.target.value } })}
                />
              </div>
            ) : (
              <fieldset className="mt-6 space-y-2">
                <legend className="sr-only">Options</legend>
                {question.options.map((option, optionIndex) => {
                  const chosen = current.response.choices ?? [];
                  const isChosen = chosen.includes(option.id);
                  const letter = String.fromCharCode("A".charCodeAt(0) + optionIndex);
                  const nextChoices =
                    question.kind === "single"
                      ? [option.id]
                      : isChosen
                        ? chosen.filter((id) => id !== option.id)
                        : [...chosen, option.id];
                  return (
                    <label
                      key={option.id}
                      className={cn(
                        "flex min-h-14 cursor-pointer items-center gap-3 rounded-xl bg-muted px-4 text-base transition-colors duration-200 ease-out hover:bg-accent has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring",
                        isChosen && "bg-primary/10 ring-2 ring-primary hover:bg-primary/10",
                      )}
                    >
                      <input
                        type={question.kind === "single" ? "radio" : "checkbox"}
                        name={`question-${question.question_id}`}
                        checked={isChosen}
                        onChange={() => record(question.question_id, { ...current, response: { choices: nextChoices } })}
                        className="size-5 accent-primary"
                      />
                      <span className="w-4 text-sm text-muted-foreground">{letter}</span>
                      <span>{option.text}</span>
                    </label>
                  );
                })}
              </fieldset>
            )}

            <div className="mt-6">
              <Button
                type="button"
                variant={current.marked ? "secondary" : "ghost"}
                aria-pressed={current.marked}
                onClick={() => record(question.question_id, { ...current, marked: !current.marked })}
              >
                <Flag aria-hidden className="size-4" />
                {current.marked ? "Marked for review" : "Mark for review"}
              </Button>
            </div>
          </article>
        </div>

        <aside aria-label="Questions and time" className="flex flex-col gap-4 rounded-3xl bg-card p-4 lg:sticky lg:top-20 lg:w-72">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-muted-foreground">Time left</span>
            <span
              className={cn("flex items-center gap-1.5 font-mono text-xl tabular-nums", isLowTime && "text-destructive")}
              role="timer"
              aria-label={`${formatRemaining(remainingMs)} left`}
            >
              {isLowTime && <Clock aria-hidden className="size-5" />}
              {formatRemaining(remainingMs)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{examTitle}</p>
          <nav aria-label="Question navigator">
            <ol className="grid grid-cols-5 gap-2">
              {paper.map((item, itemIndex) => {
                const state = answers[item.question_id];
                const answered = isAnswered(state);
                const isCurrent = itemIndex === index;
                const label = `Question ${item.position}, ${answered ? "answered" : "not answered"}${state?.marked ? ", marked for review" : ""}`;
                return (
                  <li key={item.question_id}>
                    <button
                      type="button"
                      aria-label={label}
                      aria-current={isCurrent ? "step" : undefined}
                      onClick={() => setIndex(itemIndex)}
                      className={cn(
                        "relative flex size-11 items-center justify-center rounded-full text-sm font-medium transition-colors duration-200 ease-out focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none",
                        answered ? "bg-primary/15 text-foreground" : "bg-muted text-muted-foreground",
                        isCurrent && "bg-primary text-primary-foreground",
                      )}
                    >
                      {item.position}
                      {state?.marked && <Flag aria-hidden className="absolute -top-0.5 -right-0.5 size-3.5 fill-current text-foreground" />}
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>
          <p className="text-sm text-muted-foreground">
            Answered, filled · Not answered, grey · <Flag aria-hidden className="inline size-3.5" /> marked for review
          </p>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 bg-card/95 shadow-sm backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-8">
          <div className="flex flex-col gap-0.5" aria-live="polite">
            <SaveStatus isOnline={isOnline} isSending={isSending} pendingCount={pendingCount} />
            <span className="text-sm text-muted-foreground">
              {answeredCount} of {paper.length} answered
            </span>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="lg" disabled={index === 0} onClick={() => setIndex(index - 1)}>
              Previous
            </Button>
            {index < paper.length - 1 ? (
              <Button type="button" size="lg" onClick={() => setIndex(index + 1)}>
                Next
              </Button>
            ) : (
              <Button type="button" size="lg" onClick={() => setIsReviewOpen(true)}>
                Finish exam
              </Button>
            )}
          </div>
        </div>
      </div>

      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit your exam?</DialogTitle>
            <DialogDescription>
              {unansweredCount === 0
                ? "You have answered every question."
                : `You have ${unansweredCount} unanswered ${unansweredCount === 1 ? "question" : "questions"}.`}{" "}
              After you submit you cannot change your answers.
            </DialogDescription>
          </DialogHeader>
          {submitProblem && (
            <p role="alert" className="flex items-start gap-1.5 text-sm text-destructive">
              <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
              {submitProblem}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" size="lg" onClick={() => setIsReviewOpen(false)}>
              Keep working
            </Button>
            <Button type="button" size="lg" disabled={isSubmitting} onClick={() => void submit()}>
              {isSubmitting ? "Submitting…" : "Submit exam"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SaveStatus({ isOnline, isSending, pendingCount }: { isOnline: boolean; isSending: boolean; pendingCount: number }) {
  if (!isOnline) {
    return (
      <span className="flex items-center gap-1.5 text-sm text-foreground">
        <WifiOff aria-hidden className="size-4" />
        {pendingCount > 0
          ? `Offline: ${pendingCount} ${pendingCount === 1 ? "answer" : "answers"} kept on this phone`
          : "Offline: keep going, your answers are kept on this phone"}
      </span>
    );
  }
  if (isSending || pendingCount > 0) {
    return <span className="text-sm text-muted-foreground">Saving…</span>;
  }
  return (
    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Check aria-hidden className="size-4" />
      All answers saved
    </span>
  );
}
