import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatMarks, formatPkt } from "@/lib/format";
import type { MyExam } from "./data";

function ExamAction({ entry }: { entry: MyExam }) {
  const { exam, phase, attempt, result } = entry;
  if (phase === "open" && attempt?.status === "in_progress") {
    return (
      <Button asChild size="lg">
        <Link href={`/exams/${exam.id}/take`}>Continue exam</Link>
      </Button>
    );
  }
  if (phase === "open" && !attempt) {
    return (
      <Button asChild size="lg">
        <Link href={`/exams/${exam.id}`}>Start exam</Link>
      </Button>
    );
  }
  if (result) {
    return (
      <Button asChild size="lg" variant="outline">
        <Link href={`/results/${result.id}`}>See result</Link>
      </Button>
    );
  }
  return null;
}

function statusLine({ exam, phase, attempt, result }: MyExam): string {
  if (phase === "upcoming") return `Opens ${formatPkt(exam.opens_at)}`;
  if (phase === "open" && !attempt) return `${exam.duration_minutes} minutes · closes ${formatPkt(exam.closes_at)}`;
  if (attempt?.status === "in_progress") return "In progress";
  if (result) return `Result: ${formatMarks(result.total)} of ${result.max_total}`;
  if (attempt) return "Submitted · result not published yet";
  return `Closed ${formatPkt(exam.closes_at)} · not attempted`;
}

export function MyExamList({ title, entries, empty }: { title: string; entries: MyExam[]; empty: string }) {
  return (
    <section className="flex flex-col gap-3" aria-labelledby={`section-${title}`}>
      <h2 id={`section-${title}`} className="text-lg font-semibold">
        {title}
      </h2>
      {entries.length === 0 ? (
        <p className="text-base text-muted-foreground">{empty}</p>
      ) : (
        <ul className="flex flex-col divide-y rounded-lg border">
          {entries.map((entry) => (
            <li key={entry.exam.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-base font-medium">{entry.exam.title}</span>
                <span className="text-base text-muted-foreground">{statusLine(entry)}</span>
              </div>
              <ExamAction entry={entry} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
