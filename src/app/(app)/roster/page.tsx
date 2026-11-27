import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/states";
import { requireMember } from "@/lib/access";
import { listCandidates } from "@/features/authoring/roster/data";
import { plural } from "@/features/authoring/format";

export default async function RosterPage() {
  const member = await requireMember("examiner", "institution_admin");
  const candidates = await listCandidates(member);

  return (
    <div>
      <PageHeader title="Roster" description={`${plural(candidates.length, "candidate")} at ${member.institution.name}.`} />
      {candidates.length === 0 ? (
        <EmptyState message="No candidates yet. Add them to enroll them in exams." />
      ) : (
        <ul className="flex flex-col rounded-3xl bg-card p-2 md:p-4">
          {candidates.map((candidate) => (
            <li key={candidate.id} className="flex min-h-14 flex-wrap items-center justify-between gap-x-4 border-b border-border px-3 py-2 last:border-0">
              <span className="flex flex-col">
                <span className="text-base">{candidate.full_name}</span>
                <span className="text-sm text-muted-foreground">{candidate.email}</span>
              </span>
              <span className="flex gap-4 text-sm text-muted-foreground">
                <span>Roll {candidate.roll_number}</span>
                <span>{candidate.cnic_masked}</span>
                {candidate.extra_time_pct > 0 && <span className="text-foreground">+{candidate.extra_time_pct}% time</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
