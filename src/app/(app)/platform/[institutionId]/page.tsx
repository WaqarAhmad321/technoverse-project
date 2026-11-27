import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { StatusDot } from "@/components/status-dot";
import { SubmitButton } from "@/components/submit-button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppointAdminForm } from "@/features/people/appoint-admin-form";
import { loadInstitutionDetail } from "@/features/people/data";
import { setInstitutionStatus } from "@/features/people/platform-actions";
import { ReviewInstitutionForm } from "@/features/people/review-institution-form";
import { ROLE_LABELS } from "@/features/people/roles";
import { requireSuperAdmin } from "@/lib/access";
import { formatDate } from "@/lib/format";

export default async function InstitutionPage({ params }: { params: Promise<{ institutionId: string }> }) {
  const { institutionId } = await params;
  await requireSuperAdmin();
  const detail = await loadInstitutionDetail(institutionId);
  if (!detail) notFound();
  const { institution } = detail;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        back={{ href: "/platform", label: "Institutions" }}
        title={institution.name}
        description={`${institution.city || "City not given"} · joined ${formatDate(institution.created_at)}`}
      >
        {(institution.status === "active" || institution.status === "suspended") && (
          <form action={setInstitutionStatus}>
            <input type="hidden" name="institutionId" value={institution.id} />
            <input type="hidden" name="status" value={institution.status === "active" ? "suspended" : "active"} />
            <SubmitButton variant="outline" size="lg">
              {institution.status === "active" ? "Suspend institution" : "Reactivate institution"}
            </SubmitButton>
          </form>
        )}
      </PageHeader>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="At a glance">
        {[
          { label: "People with a role", value: detail.members.length },
          { label: "Candidates on the roster", value: detail.candidateCount },
          { label: "Exams", value: detail.examCount },
          { label: "Published", value: detail.publishedCount },
        ].map((tile) => (
          <div key={tile.label} className="flex flex-col gap-1 rounded-3xl bg-card p-5">
            <span className="text-3xl font-medium tracking-tight">{tile.value}</span>
            <span className="text-sm text-muted-foreground">{tile.label}</span>
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-3 rounded-3xl bg-card p-4 md:p-6">
        <h2 className="text-xl font-medium">Platform review</h2>
        <StatusDot tone={institution.status === "active" ? "ready" : institution.status === "pending" ? "live" : "warn"}>
          {institution.status === "pending" ? "Waiting for your approval" : institution.status === "active" ? "Approved and active" : institution.status === "rejected" ? "Rejected" : "Suspended"}
          {institution.reviewed_at ? ` · reviewed ${formatDate(institution.reviewed_at)}` : ""}
        </StatusDot>
        {institution.review_note && <p className="rounded-xl bg-muted/60 px-3 py-2 text-base">“{institution.review_note}”</p>}
        {institution.status === "pending" && <ReviewInstitutionForm institutionId={institution.id} name={institution.name} />}
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="who">
        <h2 id="who" className="text-xl font-medium">
          Who runs it
        </h2>
        <div className="overflow-x-auto rounded-3xl bg-card p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead>Roles</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detail.members.map((person) => (
                <TableRow key={person.email}>
                  <TableCell className="font-medium">{person.name}</TableCell>
                  <TableCell className="hidden md:table-cell">{person.email}</TableCell>
                  <TableCell>{person.roles.map((role) => ROLE_LABELS[role] ?? role).join(", ")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <AppointAdminForm institutionId={institution.id} />
    </div>
  );
}
