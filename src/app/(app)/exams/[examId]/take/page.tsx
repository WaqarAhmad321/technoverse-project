import { redirect } from "next/navigation";
import { loadAnnouncements, loadMyAttempt, loadPaper, loadSavedAnswers } from "@/features/delivery/attempts";
import { loadMyExam } from "@/features/delivery/data";
import { ExamWorkspaceLoader } from "@/features/delivery/exam-workspace-loader";
import { requireMember } from "@/lib/access";
import { attemptDeadline } from "@/lib/exam-rules";

export default async function TakeExamPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;
  const member = await requireMember("candidate");
  const [{ exam }, attempt] = await Promise.all([loadMyExam(member, examId), loadMyAttempt(member, examId)]);
  if (!attempt) redirect(`/exams/${exam.id}`);
  if (attempt.status !== "in_progress") redirect(`/exams/${exam.id}/receipt`);

  const [paper, saved, announcements] = await Promise.all([
    loadPaper(attempt.id),
    loadSavedAnswers(attempt.id),
    loadAnnouncements(exam.id),
  ]);

  return (
    <ExamWorkspaceLoader
      attemptId={attempt.id}
      examId={exam.id}
      examTitle={exam.title}
      paper={paper}
      saved={saved}
      deadline={attemptDeadline(attempt).toISOString()}
      serverNow={new Date().toISOString()}
      announcements={announcements}
    />
  );
}
