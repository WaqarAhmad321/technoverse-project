"use server";

import { revalidatePath } from "next/cache";
import { requireMember } from "@/lib/access";
import { db, unwrap } from "@/lib/db";
import { checkQuestionImport, type QuestionImportReport } from "./import";
import { questionColumns } from "./schema";

export type QuestionImportState = { report: QuestionImportReport; imported: number } | null;

const MAX_FILE_CHARS = 500_000;

export async function importQuestions(_previous: QuestionImportState, formData: FormData): Promise<QuestionImportState> {
  const member = await requireMember("examiner", "institution_admin");
  const report = checkQuestionImport(String(formData.get("file_text") ?? "").slice(0, MAX_FILE_CHARS));
  if (formData.get("mode") !== "import" || report.problems.length > 0 || report.ready.length === 0) return { report, imported: 0 };

  // One insert is one statement: the whole file lands or none of it does.
  unwrap(
    await db()
      .from("questions")
      .insert(report.ready.map((question) => ({ ...questionColumns(question), user_id: member.user.id, institution_id: member.institution.id, version: 1 }))),
  );
  revalidatePath("/questions");
  return { report: { ready: [], problems: [] }, imported: report.ready.length };
}
