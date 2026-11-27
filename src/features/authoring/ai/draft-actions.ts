"use server";

import { z } from "zod";
import { requireMember } from "@/lib/access";
import { db, unwrap } from "@/lib/db";
import type { DraftResult } from "@/components/ai-fill-button";
import { getDispute } from "../disputes/data";
import { isAiConfigured } from "./second-marker";
import { writeDraft, type DraftKind } from "./drafts";

const MAX_DRAFT_CHARS = 4000;
const UNAVAILABLE = "The AI is not set up on this server yet. Write it yourself; nothing is lost.";
const FAILED = "The AI could not write this just now. Try again, or write it yourself.";

const draftText = z.string().max(MAX_DRAFT_CHARS).catch("");

async function attempt(kind: DraftKind, context: string, current: string, recorded: () => string): Promise<DraftResult> {
  if (!isAiConfigured()) return { error: UNAVAILABLE };
  try {
    const text = await writeDraft(kind, context, draftText.parse(current), recorded);
    return text ? { text } : { error: FAILED };
  } catch (error) {
    console.error(`AI draft (${kind}) failed`, error);
    return { error: FAILED };
  }
}

export async function draftFeedback(attemptId: string, questionId: string, current: string): Promise<DraftResult> {
  const member = await requireMember("examiner", "institution_admin");
  const scope = member.institution.id;
  const [question, answer, ai]: [
    { body: string; rubric: string | null; marks: number } | null,
    { response: { text?: string } } | null,
    { marks_awarded: number; lines: { criterion: string; awarded: number; quote: string }[] } | null,
  ] = await Promise.all([
    db().from("attempt_questions").select("body, rubric, marks").eq("institution_id", scope).eq("attempt_id", attemptId).eq("question_id", questionId).maybeSingle().then(unwrap),
    db().from("answers").select("response").eq("institution_id", scope).eq("attempt_id", attemptId).eq("question_id", questionId).maybeSingle().then(unwrap),
    db().from("ai_marks").select("marks_awarded, lines").eq("institution_id", scope).eq("attempt_id", attemptId).eq("question_id", questionId).maybeSingle().then(unwrap),
  ]);
  if (!question) return { error: "This answer is no longer available." };
  const lines = ai?.lines.map((line) => `${line.awarded} for ${line.criterion}${line.quote ? ` ("${line.quote}")` : " (not shown)"}`).join("\n") ?? "none";
  const context = `Question (${question.marks} marks): ${question.body}\nRubric: ${question.rubric ?? ""}\nCandidate's answer: ${answer?.response.text ?? "(blank)"}\nSecond marker's notes:\n${lines}`;
  const recorded = () =>
    ai && ai.lines.length > 0
      ? `You earned marks for ${ai.lines.filter((line) => line.awarded > 0).map((line) => line.criterion.replace(/^\d+(\.\d+)? marks?: /, "")).join(" and ") || "parts of the answer"}. To earn the rest, follow the marking guide line by line and give one clear everyday example.`
      : "Your answer shows the main idea. To earn full marks, explain each step and give one clear everyday example.";
  return attempt("feedback", context, current, recorded);
}

export async function draftRubric(body: string, marks: string, current: string): Promise<DraftResult> {
  await requireMember("examiner", "institution_admin");
  const total = Number(marks) || 0;
  if (body.trim().length < 5 || total < 1) return { error: "Write the question and its marks first, then the AI can draft a guide." };
  const context = `Question (${total} marks): ${body.slice(0, MAX_DRAFT_CHARS)}`;
  const recorded = () => {
    const first = Math.ceil(total / 2);
    const rest = total - first;
    return rest > 0 ? `${first} marks: states the main idea correctly.\n${rest} marks: explains it with working or a clear everyday example.` : `${first} marks: states the main idea correctly.`;
  };
  return attempt("rubric", context, current, recorded);
}

export async function draftDisputeReply(disputeId: string, decision: string, current: string): Promise<DraftResult> {
  const member = await requireMember("examiner", "institution_admin");
  const dispute = await getDispute(member, disputeId);
  const key = (dispute.question.answer_key ?? []).map((id) => id.toUpperCase()).join(", ") || "written question";
  const context = `Question: ${dispute.question.body}\nKey or rubric: ${dispute.question.rubric ?? key}\nCandidate's answer: ${dispute.answerText || dispute.choices.join(", ") || "(none)"}\nMarks given: ${dispute.awarded} of ${dispute.question.marks}\nCandidate's challenge: ${dispute.body}\nThe examiner leans towards: ${decision || "not decided yet"}`;
  const recorded = () =>
    `Thank you for raising this. I have re-read your answer against the ${dispute.question.rubric ? "marking guide" : "answer key"} for this question. ${dispute.question.rubric ? "Your answer earns marks where it matches the guide; the remaining marks need the missing step." : `The keyed answer is ${key}.`}`;
  return attempt("dispute_reply", context, current, recorded);
}
