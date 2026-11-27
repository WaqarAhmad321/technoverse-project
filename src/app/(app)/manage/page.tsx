import { Plus } from "lucide-react";
import Link from "next/link";
import { Pagination } from "@/components/pagination";
import { paginate } from "@/lib/pagination";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/states";
import { Button } from "@/components/ui/button";
import { requireMember } from "@/lib/access";
import { listExams } from "@/features/authoring/exams/data";
import { StatusDot, type StatusTone } from "@/components/status-dot";
import { PHASE_LABEL, formatPakistanTime } from "@/features/authoring/format";
import type { ExamPhase } from "@/lib/exam-rules";

const PHASE_TONE: Record<ExamPhase, StatusTone> = { draft: "draft", upcoming: "ready", open: "live", closed: "done" };

export default async function ManageExamsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const member = await requireMember("examiner", "institution_admin");
  const [allExams, { page }] = await Promise.all([listExams(member), searchParams]);
  const shown = paginate(allExams, page);
  const exams = shown.rows;

  return (
    <div>
      <PageHeader title="Exams" description="Set them up, publish them, then mark and release results.">
        <Button asChild size="lg">
          <Link href="/manage/new">
            <Plus aria-hidden /> New exam
          </Link>
        </Button>
      </PageHeader>
      {allExams.length === 0 ? (
        <EmptyState
          message="No exams yet. Create one and pick its questions from your bank."
          action={
            <Button asChild variant="outline" size="lg">
              <Link href="/manage/new">
                <Plus aria-hidden /> New exam
              </Link>
            </Button>
          }
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {exams.map((exam) => (
            <li key={exam.id}>
              <Link
                href={`/manage/${exam.id}`}
                className="lift flex flex-col gap-1 rounded-2xl bg-card p-5 md:flex-row md:items-center md:justify-between"
              >
                <span className="flex flex-col gap-1">
                  <span className="text-xl font-medium">{exam.title}</span>
                  <span className="text-sm text-muted-foreground">
                    {formatPakistanTime(exam.opens_at)} to {formatPakistanTime(exam.closes_at)} · {exam.duration_minutes} min ·{" "}
                    {exam.total_marks} marks
                  </span>
                </span>
                <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm md:justify-end">
                  <StatusDot tone={PHASE_TONE[exam.phase]} className="text-foreground">{PHASE_LABEL[exam.phase]}</StatusDot>
                  <span className="text-muted-foreground">{exam.enrolledCount} enrolled</span>
                  <span className="text-muted-foreground">{exam.submittedCount} submitted</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Pagination page={shown} basePath="/manage" noun="exams" />
    </div>
  );
}
