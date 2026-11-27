import { NextResponse } from "next/server";
import { z } from "zod";
import { notFoundResponse, ownAttemptFromRequest } from "@/features/delivery/api";
import { saveScratch } from "@/features/delivery/attempts";

const MAX_SCRATCH_LENGTH = 20_000;
const scratchSchema = z.object({ question_id: z.uuid(), body: z.string().max(MAX_SCRATCH_LENGTH) });

export async function POST(request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const owned = await ownAttemptFromRequest(params);
  if (!owned) return notFoundResponse();
  const body = scratchSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "That rough work could not be read." }, { status: 400 });
  if (owned.attempt.status !== "in_progress") return NextResponse.json({ saved: false }, { status: 409 });
  await saveScratch(owned.member, owned.attempt, body.data.question_id, body.data.body);
  return NextResponse.json({ saved: true });
}
