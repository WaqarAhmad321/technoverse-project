"use server";

import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { z } from "zod";
import { requireMember } from "@/lib/access";
import { db, unwrap } from "@/lib/db";

export type WrittenMarkState = { status: "error"; message: string } | { status: "saved"; message: string } | null;

const HALF_STEPS = 2;
const markSchema = z.object({
  attempt_id: z.uuid(),
  question_id: z.uuid(),
  marks: z.coerce.number({ message: "Marks must be a number." }).min(0, "Marks cannot be below zero."),
  feedback: z.string().trim().max(1000).optional(),
});

export async function saveWrittenMark(examId: string, _previous: WrittenMarkState, formData: FormData): Promise<WrittenMarkState> {
  const member = await requireMember("examiner", "institution_admin");
  const parsed = markSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the marks and try again." };
  const input = parsed.data;

  const row: { marks: number } | null = unwrap(
    await db()
      .from("attempt_questions")
      .select("marks, attempt:attempts!inner(exam_id)")
      .eq("institution_id", member.institution.id)
      .eq("attempt_id", input.attempt_id)
      .eq("question_id", input.question_id)
      .eq("kind", "written")
      .eq("attempt.exam_id", examId)
      .maybeSingle(),
  );
  if (!row) notFound();
  if (input.marks > row.marks) return { status: "error", message: `This question is worth ${row.marks} marks.` };
  if (!Number.isInteger(input.marks * HALF_STEPS)) return { status: "error", message: "Give marks in steps of 0.5." };

  unwrap(
    await db()
      .from("grades")
      .upsert(
        {
          user_id: member.user.id,
          institution_id: member.institution.id,
          attempt_id: input.attempt_id,
          question_id: input.question_id,
          marks_awarded: input.marks,
          source: "manual",
          graded_by: member.user.id,
          feedback: input.feedback || null,
        },
        { onConflict: "attempt_id,question_id" },
      ),
  );
  revalidatePath(`/marking/${examId}`);
  return { status: "saved", message: `Saved ${input.marks} of ${row.marks}.` };
}
