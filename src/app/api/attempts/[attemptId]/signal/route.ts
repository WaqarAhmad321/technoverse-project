import { NextResponse } from "next/server";
import { z } from "zod";
import { notFoundResponse, ownAttemptFromRequest } from "@/features/delivery/api";
import { recordIncident } from "@/features/delivery/attempts";

const MAX_SECONDS = 24 * 60 * 60;
const MAX_CHARS = 100_000;

// Signals for the examiner to review, never a penalty. The pasted text itself is never sent.
const signalSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("tab_hidden"), seconds: z.number().int().min(1).max(MAX_SECONDS) }),
  z.object({ kind: z.literal("copy"), chars: z.number().int().min(0).max(MAX_CHARS) }),
  z.object({ kind: z.literal("paste"), chars: z.number().int().min(1).max(MAX_CHARS) }),
]);

export async function POST(request: Request, { params }: { params: Promise<{ attemptId: string }> }) {
  const owned = await ownAttemptFromRequest(params);
  if (!owned) return notFoundResponse();
  const body = signalSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "That signal could not be read." }, { status: 400 });
  if (owned.attempt.status !== "in_progress" || owned.attempt.is_sandbox) return NextResponse.json({ recorded: false });
  const { kind, ...details } = body.data;
  await recordIncident(owned.member, owned.attempt, kind, details);
  return NextResponse.json({ recorded: true });
}
