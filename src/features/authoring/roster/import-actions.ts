"use server";

import { revalidatePath } from "next/cache";
import { requireMember } from "@/lib/access";
import { db, unwrap } from "@/lib/db";
import { checkImport, type ImportReport } from "./import";
import { maskCnic } from "./schema";

export type ImportState = { report: ImportReport; imported: number } | null;

const MAX_FILE_CHARS = 500_000;

export async function importCandidates(_previous: ImportState, formData: FormData): Promise<ImportState> {
  const member = await requireMember("examiner", "institution_admin");
  const text = String(formData.get("file_text") ?? "").slice(0, MAX_FILE_CHARS);
  const existing: { roll_number: string }[] = unwrap(
    await db().from("candidates").select("roll_number").eq("institution_id", member.institution.id),
  );
  const report = checkImport(text, new Set(existing.map((row) => row.roll_number)));
  const wantsImport = formData.get("mode") === "import";
  if (!wantsImport || report.problems.length > 0 || report.ready.length === 0) return { report, imported: 0 };

  // One insert is one statement, so the whole file lands or none of it does.
  unwrap(
    await db().from("candidates").insert(
      report.ready.map((candidate) => ({
        user_id: member.user.id,
        institution_id: member.institution.id,
        full_name: candidate.full_name,
        roll_number: candidate.roll_number,
        email: candidate.email,
        cnic_masked: maskCnic(candidate.cnic),
        extra_time_pct: candidate.extra_time_pct,
        section: candidate.section,
      })),
    ),
  );
  revalidatePath("/roster");
  return { report: { ready: [], problems: [] }, imported: report.ready.length };
}
