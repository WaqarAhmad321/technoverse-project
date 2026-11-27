"use server";

import { revalidatePath } from "next/cache";
import { can, requireMember, type Member } from "@/lib/access";
import { db, unwrap } from "@/lib/db";
import type { Exam } from "@/lib/exam-types";
import { getExam } from "./data";

async function editableExam(examId: string): Promise<{ member: Member; exam: Exam } | null> {
  const member = await requireMember("examiner", "institution_admin");
  const exam = await getExam(member, examId);
  return can(member, "exam.edit", exam) ? { member, exam } : null;
}

async function enroll(member: Member, exam: Exam, candidateIds: string[]): Promise<void> {
  if (candidateIds.length === 0) return;
  const valid: { id: string }[] = unwrap(
    await db().from("candidates").select("id").eq("institution_id", member.institution.id).in("id", candidateIds),
  );
  const rows = valid.map((candidate) => ({
    user_id: member.user.id,
    institution_id: member.institution.id,
    exam_id: exam.id,
    candidate_id: candidate.id,
  }));
  unwrap(await db().from("enrollments").upsert(rows, { onConflict: "exam_id,candidate_id", ignoreDuplicates: true }));
  revalidatePath(`/manage/${exam.id}`);
  revalidatePath("/manage");
  revalidatePath("/roster");
}

export async function enrollAll(examId: string): Promise<void> {
  const editable = await editableExam(examId);
  if (!editable) return;
  const all: { id: string }[] = unwrap(
    await db().from("candidates").select("id").eq("institution_id", editable.member.institution.id),
  );
  await enroll(editable.member, editable.exam, all.map((candidate) => candidate.id));
}

export async function enrollOne(examId: string, candidateId: string): Promise<void> {
  const editable = await editableExam(examId);
  if (!editable) return;
  await enroll(editable.member, editable.exam, [candidateId]);
}

// A candidate who has started keeps their place: their attempt belongs to this enrollment.
export async function unenrollOne(examId: string, candidateId: string): Promise<void> {
  const editable = await editableExam(examId);
  if (!editable) return;
  const { member, exam } = editable;
  const started: { id: string }[] = unwrap(
    await db()
      .from("attempts")
      .select("id")
      .eq("institution_id", member.institution.id)
      .eq("exam_id", exam.id)
      .eq("candidate_id", candidateId)
      .eq("is_sandbox", false)
      .limit(1),
  );
  if (started.length > 0) return;
  unwrap(
    await db()
      .from("enrollments")
      .delete()
      .eq("institution_id", member.institution.id)
      .eq("exam_id", exam.id)
      .eq("candidate_id", candidateId),
  );
  revalidatePath(`/manage/${exam.id}`);
  revalidatePath("/manage");
  revalidatePath("/roster");
}
