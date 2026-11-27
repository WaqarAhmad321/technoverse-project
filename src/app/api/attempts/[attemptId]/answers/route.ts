import { NextResponse } from "next/server";
import { answerOpsSchema, attemptState, notFoundResponse, ownAttemptFromRequest } from "@/features/delivery/api";
import { recordIncident, saveAnswers } from "@/features/delivery/attempts";

export async function POST(request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const owned = await ownAttemptFromRequest(params);
  if (!owned) return notFoundResponse();

  const body = answerOpsSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "That answer could not be read. Try again." }, { status: 400 });

  const { member, attempt } = owned;
  if (attempt.status !== "in_progress") {
    if (body.data.ops.length > 0) await recordIncident(member, attempt, "late_answer", { count: body.data.ops.length });
    return NextResponse.json({ ...attemptState(attempt), saved: [] }, { status: 409 });
  }

  const saved = await saveAnswers(member, attempt, body.data.ops);
  return NextResponse.json({ ...attemptState(attempt), saved });
}
