import { NextResponse } from "next/server";
import { attemptState, notFoundResponse, ownAttemptFromRequest } from "@/features/delivery/api";
import { loadAnnouncements, recordHeartbeat } from "@/features/delivery/attempts";

export async function POST(_request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const owned = await ownAttemptFromRequest(params);
  if (!owned) return notFoundResponse();
  const { member, attempt } = owned;
  if (attempt.status === "in_progress") await recordHeartbeat(member, attempt);
  const announcements = await loadAnnouncements(attempt.exam_id);
  return NextResponse.json({ ...attemptState(attempt), announcements });
}
