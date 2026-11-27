import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { memberOrNull, type Member } from "@/lib/access";
import { attemptDeadline } from "@/lib/exam-rules";
import { loadOwnAttempt, type CandidateAttempt } from "./attempts";

const MAX_OPS_PER_REQUEST = 200;
const MAX_TEXT_LENGTH = 10_000;
const MAX_CHOICES = 10;

export const answerOpsSchema = z.object({
  ops: z
    .array(
      z.object({
        question_id: z.uuid(),
        response: z.object({
          choices: z.array(z.string().max(4)).max(MAX_CHOICES).optional(),
          text: z.string().max(MAX_TEXT_LENGTH).optional(),
        }),
        marked_for_review: z.boolean(),
        client_seq: z.number().int().nonnegative(),
        saved_offline: z.boolean(),
      }),
    )
    .max(MAX_OPS_PER_REQUEST),
});

export function notFoundResponse(): NextResponse {
  return NextResponse.json({ error: "We could not find that exam attempt." }, { status: 404 });
}

export function attemptState(attempt: CandidateAttempt) {
  return {
    status: attempt.status,
    deadline: attemptDeadline(attempt).toISOString(),
    server_now: new Date().toISOString(),
    receipt_code: attempt.receipt_code,
  };
}

export async function ownAttemptFromRequest(
  params: Promise<{ attemptId: string }>,
): Promise<{ member: Member; attempt: CandidateAttempt } | null> {
  const { attemptId } = await params;
  if (!z.uuid().safeParse(attemptId).success) return null;
  const member = await memberOrNull("candidate", "examiner", "institution_admin");
  if (!member) return null;
  const attempt = await loadOwnAttempt(member, attemptId);
  return attempt ? { member, attempt } : null;
}
