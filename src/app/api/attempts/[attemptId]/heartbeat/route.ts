import { NextResponse } from "next/server";
import { attemptState, notFoundResponse, ownAttemptFromRequest } from "@/features/delivery/api";
import { z } from "zod";
import { loadAnnouncements, loadOwnAttempt, recordHeartbeat } from "@/features/delivery/attempts";

const MAX_OFFLINE_ANSWERS = 1_000;
const heartbeatSchema = z.object({ answered_offline: z.number().int().min(0).max(MAX_OFFLINE_ANSWERS) });

export async function POST(request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const owned = await ownAttemptFromRequest(params);
  if (!owned) return notFoundResponse();
  const body = heartbeatSchema.safeParse(await request.json().catch(() => null));
  const { member, attempt } = owned;
  if (attempt.status === "in_progress") await recordHeartbeat(member, attempt, body.success ? body.data.answered_offline : 0);
  const [announcements, latest] = await Promise.all([loadAnnouncements(attempt.exam_id), loadOwnAttempt(member, attempt.id)]);
  const current = latest ?? attempt;
  return NextResponse.json({ ...attemptState(current), credit_seconds: current.credit_seconds, announcements });
}
