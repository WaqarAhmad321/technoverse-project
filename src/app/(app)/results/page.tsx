import Link from "next/link";
import { EmptyState } from "@/components/states";
import { loadMyResults } from "@/features/delivery/data";
import { PageHeader } from "@/components/page-header";
import { requireMember } from "@/lib/access";
import { formatDate, formatMarks } from "@/lib/format";

const PERCENT = 100;

export default async function MyResultsPage() {
  const member = await requireMember("candidate");
  const results = await loadMyResults(member);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="My results" description="Only results your examiner has published appear here." />
      {results.length === 0 ? (
        <EmptyState message="No published results yet. They appear here as soon as your examiner publishes them." />
      ) : (
        <ul className="flex flex-col divide-y rounded-lg border">
          {results.map(({ result, exam }) => (
            <li key={result.id}>
              <Link href={`/results/${result.id}`} className="flex min-h-14 flex-col gap-1 p-4 hover:bg-muted sm:flex-row sm:items-center sm:justify-between">
                <span className="text-base font-medium">{exam.title}</span>
                <span className="text-base text-muted-foreground">
                  {formatMarks(result.total)} of {result.max_total} · {Math.round((result.total / result.max_total) * PERCENT)}% ·{" "}
                  {result.published_at ? formatDate(result.published_at) : ""}
                  {result.version > 1 ? ` · version ${result.version}` : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
