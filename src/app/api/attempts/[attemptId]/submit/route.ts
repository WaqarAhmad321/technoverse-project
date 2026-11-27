import { NextResponse } from "next/server";
import { attemptState, notFoundResponse, ownAttemptFromRequest } from "@/features/delivery/api";
import { submitAttempt } from "@/features/delivery/attempts";

export async function POST(_request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const owned = await ownAttemptFromRequest(params);
  if (!owned) return notFoundResponse();
  const submitted = await submitAttempt(owned.attempt);
  return NextResponse.json(attemptState(submitted));
}
