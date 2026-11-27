import { EmptyState } from "@/components/states";
import { SubmitButton } from "@/components/submit-button";
import { AddInstitutionForm } from "@/features/people/add-institution-form";
import { setInstitutionStatus } from "@/features/people/platform-actions";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { loadInstitutions } from "@/features/people/data";
import { Pagination } from "@/components/pagination";
import { requireSuperAdmin } from "@/lib/access";
import { paginate } from "@/lib/pagination";
import { formatDate } from "@/lib/format";

export default async function PlatformPage({ searchParams }: { searchParams: Promise<{ page?: string | string[] }> }) {
  await requireSuperAdmin();
  const [institutions, { page: requestedPage }] = await Promise.all([loadInstitutions(), searchParams]);
  const shown = paginate(institutions, requestedPage);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Institutions" description="Every college, university and board on Imtihaan. Exam content stays private to each institution." />
      {institutions.length === 0 ? (
        <EmptyState message="No institutions yet. Add the first one to give its admin access." />
      ) : (
        <div className="overflow-x-auto rounded-3xl bg-card p-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">People</TableHead>
              <TableHead className="text-right">Exams</TableHead>
              <TableHead>Since</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.rows.map(({ institution, memberCount, examCount }) => (
              <TableRow key={institution.id}>
                <TableCell className="font-medium">{institution.name}</TableCell>
                <TableCell>{institution.city}</TableCell>
                <TableCell className="capitalize">{institution.status}</TableCell>
                <TableCell className="text-right">{memberCount}</TableCell>
                <TableCell className="text-right">{examCount}</TableCell>
                <TableCell>{formatDate(institution.created_at)}</TableCell>
                <TableCell className="text-right">
                  <form action={setInstitutionStatus}>
                    <input type="hidden" name="institutionId" value={institution.id} />
                    <input type="hidden" name="status" value={institution.status === "active" ? "suspended" : "active"} />
                    <SubmitButton variant="ghost">{institution.status === "active" ? "Suspend" : "Reactivate"}</SubmitButton>
                  </form>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      )}
      <Pagination page={shown} basePath="/platform" noun="institutions" />
      <AddInstitutionForm />
    </div>
  );
}
