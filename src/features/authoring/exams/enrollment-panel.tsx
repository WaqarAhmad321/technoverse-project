import { UserMinus, UserPlus } from "lucide-react";
import { SubmitButton } from "@/components/submit-button";
import { plural } from "../format";
import { enrollAll, enrollOne, unenrollOne } from "./enrollment-actions";
import type { EnrollmentView } from "./enrollment-data";

export function EnrollmentPanel({ examId, view, canEdit }: { examId: string; view: EnrollmentView; canEdit: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-4 rounded-3xl bg-card p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-medium">
            <span className="tabular-nums">{view.enrolled.length}</span> enrolled
          </h2>
          {canEdit && view.notEnrolled.length > 0 && (
            <form action={enrollAll.bind(null, examId)}>
              <SubmitButton variant="secondary" size="lg">
                Enroll all on roster
              </SubmitButton>
            </form>
          )}
        </div>
        {view.enrolled.length === 0 ? (
          <p className="rounded-xl bg-muted px-4 py-6 text-center text-muted-foreground">
            Nobody is enrolled yet. Only enrolled candidates can enter this exam.
          </p>
        ) : (
          <ul aria-label="Enrolled candidates" className="flex flex-col">
            {view.enrolled.map((candidate) => (
              <li key={candidate.id} className="flex min-h-14 items-center justify-between gap-3 border-b border-border px-3 last:border-0">
                <span className="flex min-w-0 flex-col">
                  <span className="text-base">{candidate.full_name}</span>
                  <span className="text-sm text-muted-foreground">
                    Roll {candidate.roll_number} · {candidate.email}
                  </span>
                </span>
                {candidate.hasStarted ? (
                  <span className="text-sm text-muted-foreground">Started, stays enrolled</span>
                ) : (
                  canEdit && (
                    <form action={unenrollOne.bind(null, examId, candidate.id)}>
                      <SubmitButton variant="ghost" size="icon" className="size-11 rounded-full" aria-label={`Remove ${candidate.full_name}`}>
                        <UserMinus className="size-5" aria-hidden />
                      </SubmitButton>
                    </form>
                  )
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
      {canEdit && view.notEnrolled.length > 0 && (
        <section className="flex flex-col gap-4 rounded-3xl bg-card p-4 md:p-6">
          <h2 className="text-xl font-medium">Not enrolled ({plural(view.notEnrolled.length, "candidate")})</h2>
          <ul className="flex flex-col">
            {view.notEnrolled.map((candidate) => (
              <li key={candidate.id} className="flex min-h-14 items-center justify-between gap-3 border-b border-border px-3 last:border-0">
                <span className="flex min-w-0 flex-col">
                  <span className="text-base">{candidate.full_name}</span>
                  <span className="text-sm text-muted-foreground">Roll {candidate.roll_number}</span>
                </span>
                <form action={enrollOne.bind(null, examId, candidate.id)}>
                  <SubmitButton variant="outline" className="rounded-full" aria-label={`Enroll ${candidate.full_name}`}>
                    <UserPlus className="size-5" aria-hidden /> Enroll
                  </SubmitButton>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
