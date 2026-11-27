import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/states";
import { requireMember } from "@/lib/access";
import { getExam } from "@/features/authoring/exams/data";
import { listFinishedAttempts } from "@/features/authoring/marking/data";
import { formatPakistanTime, plural } from "@/features/authoring/format";

export default async function MarkingPage({ params }: { params: Promise<{ examId: string }> }) {
  const member = await requireMember("examiner", "institution_admin");
  const { examId } = await params;
  const exam = await getExam(member, examId);
  const attempts = await listFinishedAttempts(member, exam.id);

  return (
    <div>
      <PageHeader title={`Marking: ${exam.title}`} description={`${plural(attempts.length, "submitted attempt")}.`} />
      {attempts.length === 0 ? (
        <EmptyState message="Nobody has submitted this exam yet. Submitted attempts appear here for marking." />
      ) : (
        <ul className="flex flex-col rounded-3xl bg-card p-2 md:p-4">
          {attempts.map((attempt) => (
            <li key={attempt.id} className="flex min-h-14 items-center justify-between gap-4 border-b border-border px-3 last:border-0">
              <span>{attempt.candidate?.full_name ?? "Unknown candidate"}</span>
              <span className="text-sm text-muted-foreground">
                Roll {attempt.candidate?.roll_number} · {attempt.submitted_at ? formatPakistanTime(attempt.submitted_at) : "auto-submitted"}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
