import Link from "next/link";
import { EmptyState } from "@/components/states";
import { loadOpenExamsForStaff } from "@/features/delivery/data";
import { PageHeader } from "@/components/page-header";
import { requireMember } from "@/lib/access";
import { examPhase } from "@/lib/exam-rules";
import { formatPkt } from "@/lib/format";

export default async function MonitorIndexPage() {
  const member = await requireMember("examiner", "institution_admin");
  const exams = (await loadOpenExamsForStaff(member)).filter((exam) => examPhase(exam) === "open");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Live monitor" description="Exams that are open right now." />
      {exams.length === 0 ? (
        <EmptyState message="No exam is open right now. Publish one to watch it live here." />
      ) : (
        <ul className="flex flex-col divide-y rounded-lg border">
          {exams.map((exam) => (
            <li key={exam.id}>
              <Link href={`/monitor/${exam.id}`} className="flex min-h-14 flex-col justify-center gap-1 p-4 hover:bg-muted">
                <span className="text-base font-medium">{exam.title}</span>
                <span className="text-base text-muted-foreground">Closes {formatPkt(exam.closes_at)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
