import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { paginate } from "@/lib/pagination";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/states";
import { requireMember } from "@/lib/access";
import { CandidateForm } from "@/features/authoring/roster/candidate-form";
import { listRoster } from "@/features/authoring/roster/data";
import { plural } from "@/features/authoring/format";

export default async function RosterPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const member = await requireMember("examiner", "institution_admin");
  const [roster, { page: requestedPage }] = await Promise.all([listRoster(member), searchParams]);
  const shown = paginate(roster, requestedPage);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Roster" description={`${plural(roster.length, "candidate")} at ${member.institution.name}.`}>
        <Button asChild variant="outline" size="lg">
          <Link href="/roster/import">Import candidates</Link>
        </Button>
      </PageHeader>
      <details className="group rounded-3xl bg-card p-4 md:p-6">
        <summary className="flex min-h-11 cursor-pointer list-none items-center text-xl font-medium">
          Add candidate
          <span className="ml-2 text-sm font-normal text-muted-foreground group-open:hidden">Name, roll number, email and CNIC</span>
        </summary>
        <div className="pt-4">
          <CandidateForm />
        </div>
      </details>
      {roster.length === 0 ? (
        <EmptyState message="No candidates yet. Add one above to enroll them in exams." />
      ) : (
        <div className="rounded-3xl bg-card p-2 md:p-4">
          <div className="hidden grid-cols-[1fr_6rem_10rem_6rem_6rem] gap-3 px-3 pb-2 text-sm text-muted-foreground md:grid">
            <span>Candidate</span>
            <span>Roll number</span>
            <span>CNIC</span>
            <span className="text-right">Extra time</span>
            <span className="text-right">Exams</span>
          </div>
          <ul aria-label="Roster" className="flex flex-col">
            {shown.rows.map((candidate) => (
              <li
                key={candidate.id}
                className="grid gap-1 border-b border-border px-3 py-3 last:border-0 md:min-h-14 md:grid-cols-[1fr_6rem_10rem_6rem_6rem] md:items-center md:gap-3"
              >
                <span className="flex min-w-0 flex-col">
                  <span className="text-base">{candidate.full_name}</span>
                  <span className="truncate text-sm text-muted-foreground">{candidate.email}</span>
                </span>
                <span className="text-sm text-muted-foreground md:text-base md:text-foreground">
                  <span className="md:hidden">Roll </span>
                  {candidate.roll_number}
                  <span className="md:hidden">
                    {" "}
                    · {candidate.cnic_masked} · {plural(candidate.enrolledCount, "exam")}
                    {candidate.extra_time_pct > 0 && ` · +${candidate.extra_time_pct}% time`}
                  </span>
                </span>
                <span className="hidden font-mono text-sm md:inline">{candidate.cnic_masked}</span>
                <span className="hidden text-right tabular-nums md:inline">{candidate.extra_time_pct > 0 ? `+${candidate.extra_time_pct}%` : "None"}</span>
                <span className="hidden text-right tabular-nums md:inline">{candidate.enrolledCount}</span>
              </li>
            ))}
          </ul>
          <Pagination page={shown} basePath="/roster" noun="candidates" />
        </div>
      )}
    </div>
  );
}
