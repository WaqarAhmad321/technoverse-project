"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireMember } from "@/lib/access";
import { db, unwrap } from "@/lib/db";
import type { Question } from "@/lib/exam-types";
import { examTitlesByQuestion } from "./data";
import { OPTION_IDS, questionSchema, type QuestionInput } from "./schema";

export type QuestionFormState = { status: "error"; message: string } | { status: "saved"; version: number } | null;

function readForm(formData: FormData): unknown {
  const kind = formData.get("kind");
  return {
    kind,
    topic: formData.get("topic") ?? "",
    difficulty: formData.get("difficulty") ?? "",
    body: formData.get("body") ?? "",
    marks: formData.get("marks") ?? "",
    options: formData.getAll("option").map(String),
    correct: formData.getAll("correct").map(String),
    multiple_rule: formData.get("multiple_rule") ?? "partial",
    rubric: formData.get("rubric") ?? "",
  };
}

function toColumns(input: QuestionInput) {
  const shared = { topic: input.topic, difficulty: input.difficulty, kind: input.kind, body: input.body, marks: input.marks };
  if (input.kind === "written") {
    return { ...shared, options: [], answer_key: null, multiple_rule: "partial", rubric: input.rubric };
  }
  const options = input.options.map((text, index) => ({ id: OPTION_IDS[index], text }));
  const validIds = options.map((option) => option.id as string);
  return {
    ...shared,
    options,
    answer_key: input.correct.filter((id) => validIds.includes(id)).sort(),
    multiple_rule: input.kind === "multiple" ? input.multiple_rule : "partial",
    rubric: null,
  };
}

export async function saveQuestion(
  questionId: string | null,
  _previous: QuestionFormState,
  formData: FormData,
): Promise<QuestionFormState> {
  const member = await requireMember("examiner", "institution_admin");
  const parsed = questionSchema.safeParse(readForm(formData));
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Check the question and try again." };
  const columns = toColumns(parsed.data);

  if (!questionId) {
    const created: { id: string } | null = unwrap(
      await db()
        .from("questions")
        .insert({ ...columns, user_id: member.user.id, institution_id: member.institution.id, version: 1 })
        .select("id")
        .single(),
    );
    revalidatePath("/questions");
    redirect(`/questions?added=${created?.id ?? ""}`);
  }

  const existing: Pick<Question, "id" | "version"> | null = unwrap(
    await db().from("questions").select("id, version").eq("id", questionId).eq("institution_id", member.institution.id).maybeSingle(),
  );
  if (!existing) return { status: "error", message: "This question is no longer in your bank." };

  const version = existing.version + 1;
  unwrap(
    await db().from("questions").update({ ...columns, version }).eq("id", questionId).eq("institution_id", member.institution.id),
  );
  revalidatePath("/questions");
  revalidatePath(`/questions/${questionId}`);
  return { status: "saved", version };
}

export type DeleteQuestionState = { status: "error"; message: string } | null;

export async function deleteQuestion(questionId: string): Promise<DeleteQuestionState> {
  const member = await requireMember("examiner", "institution_admin");
  const titles = (await examTitlesByQuestion(member)).get(questionId) ?? [];
  if (titles.length > 0) return { status: "error", message: `Remove it from ${titles.join(", ")} first.` };
  unwrap(await db().from("questions").delete().eq("id", questionId).eq("institution_id", member.institution.id));
  revalidatePath("/questions");
  redirect("/questions");
}
