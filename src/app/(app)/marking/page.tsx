import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/states";
import { requireMember } from "@/lib/access";
import { listExams, type ExamRow } from "@/features/authoring/exams/data";
import { formatPakistanTime, plural } from "@/features/authoring/format";

function statusWords(exam: ExamRow): string {
  if (exam.results_published_at) return `Results published ${formatPakistanTime(exam.results_published_at)}`;
  if (exam.phase === "closed") return "Closed · check keys, mark written answers, publish results";
  return "Open now · marking starts when it closes";
}

export default async function MarkingListPage() {
  const member = await requireMember("examiner", "institution_admin");
  const exams = (await listExams(member)).filter((exam) => exam.submittedCount > 0);
  const toMark = exams.filter((exam) => !exam.results_published_at && exam.phase === "closed").length;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Marking"
        description={toMark > 0 ? `${plural(toMark, "exam")} waiting for marking and results.` : "Every closed exam has its results out."}
      />
      {exams.length === 0 ? (
        <EmptyState message="No submissions yet. Exams appear here once candidates submit." />
      ) : (
        <ul aria-label="Exams to mark" className="flex flex-col rounded-3xl bg-card p-2">
          {exams.map((exam) => (
            <li key={exam.id} className="border-b border-border last:border-0">
              <Link href={`/marking/${exam.id}`} className="flex min-h-16 items-center gap-4 rounded-2xl px-4 py-3 transition-colors duration-200 hover:bg-accent">
                <ClipboardCheck aria-hidden className="size-5 shrink-0 text-muted-foreground" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-base font-medium">{exam.title}</span>
                  <span className="text-sm text-muted-foreground">{statusWords(exam)}</span>
                </span>
                <span className="shrink-0 text-sm text-muted-foreground tabular-nums">{plural(exam.submittedCount, "submission")}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
