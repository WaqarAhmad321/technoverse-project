"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireMember } from "@/lib/access";
import { startAttempt } from "./attempts";

export async function startExam(formData: FormData): Promise<void> {
  const member = await requireMember("candidate");
  const examId = z.uuid().safeParse(formData.get("examId"));
  if (!examId.success) redirect("/exams");

  const outcome = await startAttempt(member, examId.data);
  if (outcome.kind === "refused") redirect(`/exams/${examId.data}?notice=${encodeURIComponent(outcome.reason)}`);
  redirect(`/exams/${examId.data}/take`);
}
