"use server";

import { revalidatePath } from "next/cache";
import { requireMember, type Member } from "@/lib/access";
import { recordAudit } from "@/lib/audit";
import { db, unwrap } from "@/lib/db";
import type { Question, QuestionVariant } from "@/lib/exam-types";
import { isVariantWriterAvailable, writeVariants } from "../ai/variants";
import { getQuestion } from "./data";

export type VariantRunState = { status: "error"; message: string } | { status: "done"; kept: number; dropped: number } | null;

async function saveVariants(member: Member, question: Question, variants: QuestionVariant[]): Promise<void> {
  unwrap(await db().from("questions").update({ variants }).eq("id", question.id).eq("institution_id", member.institution.id));
  revalidatePath(`/questions/${question.id}`);
  revalidatePath("/manage", "layout");
}

// Versions written for an older wording are dropped: they no longer match the question.
function current(question: Question): QuestionVariant[] {
  return (question.variants ?? []).filter((variant) => variant.source_version === question.version);
}

export async function writeQuestionVariants(questionId: string): Promise<VariantRunState> {
  const member = await requireMember("examiner", "institution_admin");
  const question = await getQuestion(member, questionId);
  if (question.kind === "written") return { status: "error", message: "Variants are for single-answer and multiple-select questions." };
  if (!isVariantWriterAvailable()) {
    return { status: "error", message: "Writing variants is unavailable: the AI key is not set on this server. Everyone gets the original question." };
  }

  try {
    const run = await writeVariants(question);
    if (run.kept.length === 0 && run.dropped === 0) {
      return { status: "error", message: "No recorded variants exist for this question in demo mode. Try a seeded Kinematics or Forces question." };
    }
    const approved = current(question).filter((variant) => variant.status === "approved");
    await saveVariants(member, question, [...approved, ...run.kept]);
    return { status: "done", kept: run.kept.length, dropped: run.dropped };
  } catch (error) {
    console.error("Writing question variants failed", error);
    return { status: "error", message: "The AI could not write variants just now. Try again in a minute." };
  }
}

// An approved variant puts a new, AI-written answer key onto papers, so every change is in the audit chain.
async function changeVariant(
  questionId: string,
  key: string,
  action: "variant.approved" | "variant.removed",
  change: (variant: QuestionVariant) => QuestionVariant | null,
): Promise<void> {
  const member = await requireMember("examiner", "institution_admin");
  const question = await getQuestion(member, questionId);
  const target = current(question).find((variant) => variant.key === key);
  if (!target) return;
  const next = current(question).flatMap((variant) => {
    if (variant.key !== key) return [variant];
    const changed = change(variant);
    return changed ? [changed] : [];
  });
  await saveVariants(member, question, next);
  await recordAudit(member, action, question.id, { variant_key: key, answer_key: target.answer_key, body: target.body });
}

export async function approveVariant(questionId: string, key: string): Promise<void> {
  await changeVariant(questionId, key, "variant.approved", (variant) => ({ ...variant, status: "approved" }));
}

export async function removeVariant(questionId: string, key: string): Promise<void> {
  await changeVariant(questionId, key, "variant.removed", () => null);
}
