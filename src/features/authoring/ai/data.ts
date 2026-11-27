import "server-only";
import type { Member } from "@/lib/access";
import { db, unwrap } from "@/lib/db";
import { aiMarkWritten, isAiConfigured, type AiMark, type WrittenToMark } from "./second-marker";

export type StoredAiMark = AiMark & { attempt_id: string; question_id: string };

export const SECOND_LOOK_GAP = 1;

// Reads the stored AI mark, or asks the AI once and stores it. Returns null when the AI is unavailable.
export async function getOrCreateAiMark(member: Member, attemptId: string, questionId: string, item: WrittenToMark): Promise<StoredAiMark | null> {
  const stored: StoredAiMark | null = unwrap(
    await db().from("ai_marks").select("attempt_id, question_id, marks_awarded, lines, summary").eq("attempt_id", attemptId).eq("question_id", questionId).maybeSingle(),
  );
  if (stored) return { ...stored, marks_awarded: Number(stored.marks_awarded) };
  if (!isAiConfigured()) return null;
  try {
    const mark = await aiMarkWritten(item);
    unwrap(
      await db()
        .from("ai_marks")
        .upsert({ user_id: member.user.id, institution_id: member.institution.id, attempt_id: attemptId, question_id: questionId, ...mark }, { onConflict: "attempt_id,question_id" }),
    );
    return { ...mark, attempt_id: attemptId, question_id: questionId };
  } catch (error) {
    console.error("AI second marker failed", error);
    return null;
  }
}

export type SecondLook = { attempt_id: string; question_id: string; roll: string; human: number; ai: number; marks: number };

// Scripts where the examiner and the AI differ by more than the gap: a person takes a second look.
export async function listSecondLooks(member: Member, attemptIds: string[], rolls: Map<string, string>): Promise<SecondLook[]> {
  if (attemptIds.length === 0) return [];
  const scope = member.institution.id;
  const [ai, human, paper]: [{ attempt_id: string; question_id: string; marks_awarded: number }[], { attempt_id: string; question_id: string; marks_awarded: number }[], { attempt_id: string; question_id: string; marks: number }[]] =
    await Promise.all([
      db().from("ai_marks").select("attempt_id, question_id, marks_awarded").eq("institution_id", scope).in("attempt_id", attemptIds).then(unwrap),
      db().from("grades").select("attempt_id, question_id, marks_awarded").eq("institution_id", scope).eq("source", "manual").in("attempt_id", attemptIds).then(unwrap),
      db().from("attempt_questions").select("attempt_id, question_id, marks").eq("institution_id", scope).eq("kind", "written").in("attempt_id", attemptIds).then(unwrap),
    ]);
  const key = (row: { attempt_id: string; question_id: string }) => `${row.attempt_id}:${row.question_id}`;
  const humanBy = new Map(human.map((row) => [key(row), Number(row.marks_awarded)]));
  const marksBy = new Map(paper.map((row) => [key(row), row.marks]));
  return ai.flatMap((row) => {
    const given = humanBy.get(key(row));
    const aiMarks = Number(row.marks_awarded);
    if (given === undefined || Math.abs(given - aiMarks) <= SECOND_LOOK_GAP) return [];
    return [{ attempt_id: row.attempt_id, question_id: row.question_id, roll: rolls.get(row.attempt_id) ?? "", human: given, ai: aiMarks, marks: marksBy.get(key(row)) ?? 0 }];
  });
}
