import { notFound, redirect } from "next/navigation";
import { SubmitButton } from "@/components/submit-button";
import { restartPreview } from "@/features/delivery/actions";
import {
  loadAnnouncements,
  loadMyAttempt,
  loadOrStartSandbox,
  loadPaper,
  loadSavedAnswers,
  loadScratch,
  type CandidateAttempt,
} from "@/features/delivery/attempts";
import { loadExamForStaff, loadMyExam } from "@/features/delivery/data";
import { DEFAULT_PREFS, type WorkspacePrefs } from "@/features/delivery/display-settings";
import { ExamWorkspaceLoader } from "@/features/delivery/exam-workspace-loader";
import { can, requireMember, type Member } from "@/lib/access";
import { db, unwrap } from "@/lib/db";
import { attemptDeadline } from "@/lib/exam-rules";
import type { Exam } from "@/lib/exam-types";

async function loadPrefs(userId: string): Promise<WorkspacePrefs> {
  const row: WorkspacePrefs | null = unwrap(
    await db().from("preferences").select("font_scale, contrast, layout").eq("user_id", userId).maybeSingle(),
  );
  return row ?? DEFAULT_PREFS;
}

async function previewAttempt(examId: string): Promise<{ member: Member; exam: Exam; attempt: CandidateAttempt }> {
  const member = await requireMember("examiner", "institution_admin");
  const exam = await loadExamForStaff(member, examId);
  if (!can(member, "exam.edit", exam)) notFound();
  return { member, exam, attempt: await loadOrStartSandbox(member, exam) };
}

async function realAttempt(examId: string): Promise<{ member: Member; exam: Exam; attempt: CandidateAttempt }> {
  const member = await requireMember("candidate");
  const [{ exam }, attempt] = await Promise.all([loadMyExam(member, examId), loadMyAttempt(member, examId)]);
  if (!attempt) redirect(`/exams/${exam.id}`);
  if (attempt.status !== "in_progress") redirect(`/exams/${exam.id}/receipt`);
  return { member, exam, attempt };
}

export default async function TakeExamPage({
  params,
  searchParams,
}: {
  params: Promise<{ examId: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { examId } = await params;
  const isPreview = (await searchParams).preview === "1";
  const { member, exam, attempt } = isPreview ? await previewAttempt(examId) : await realAttempt(examId);

  const [paper, saved, announcements, preferences, scratch] = await Promise.all([
    loadPaper(attempt.id),
    loadSavedAnswers(attempt.id),
    loadAnnouncements(exam.id),
    loadPrefs(member.user.id),
    loadScratch(attempt.id),
  ]);

  return (
    <ExamWorkspaceLoader
      attemptId={attempt.id}
      examTitle={exam.title}
      paper={paper}
      saved={saved}
      deadline={attemptDeadline(attempt).toISOString()}
      serverNow={new Date().toISOString()}
      announcements={announcements}
      finishedUrl={isPreview ? `/manage/${exam.id}` : `/exams/${exam.id}/receipt`}
      isPreview={isPreview}
      preferences={preferences}
      scratch={scratch}
      restartPreview={
        isPreview ? (
          <form action={restartPreview}>
            <input type="hidden" name="examId" value={exam.id} />
            <SubmitButton variant="outline">Restart preview</SubmitButton>
          </form>
        ) : undefined
      }
    />
  );
}
