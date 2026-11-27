"use server";

import { revalidatePath } from "next/cache";
import { can, requireMember } from "@/lib/access";
import { APPROVAL_BLOCK_MESSAGE, approvalGate, isApproved } from "@/lib/approvals";
import { recordAudit } from "@/lib/audit";
import { db, unwrap } from "@/lib/db";
import { getExam } from "../exams/data";
import { listFinishedAttempts } from "./data";
import { loadKeyDoctor } from "./key-doctor-data";
import { computeScores, insertFirstResults } from "./results";

export type PublishResultsState = { status: "error"; message: string } | null;

export async function publishResults(examId: string): Promise<PublishResultsState> {
  const member = await requireMember("examiner", "institution_admin");
  const exam = await getExam(member, examId);
  if (!can(member, "results.publish", exam)) return { status: "error", message: "You cannot publish results for this exam." };
  if (exam.results_published_at) return null;

  const attempts = await listFinishedAttempts(member, exam.id);
  const doctor = await loadKeyDoctor(member, exam.id, attempts);
  if (doctor.open.length > 0) return { status: "error", message: `Resolve ${doctor.open.length} flagged question first.` };
  if (!isApproved(await approvalGate(member, exam.id, "results"))) return { status: "error", message: APPROVAL_BLOCK_MESSAGE.results };

  const publishedAt = new Date().toISOString();
  const claimed: { id: string }[] = unwrap(
    await db().from("exams").update({ results_published_at: publishedAt }).eq("id", exam.id).is("results_published_at", null).select("id"),
  );
  if (claimed.length === 0) return null;
  const scores = await computeScores(member, exam, attempts);
  await insertFirstResults(member, exam, scores, publishedAt);
  await recordAudit(member, "results.published", exam.id, { count: scores.length });
  revalidatePath(`/marking/${exam.id}`);
  return null;
}
