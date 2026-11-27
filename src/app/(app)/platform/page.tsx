import { EmptyState } from "@/components/states";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/features/delivery/page-header";
import { loadInstitutions } from "@/features/people/data";
import { requireSuperAdmin } from "@/lib/access";
import { formatDate } from "@/lib/format";

export default async function PlatformPage() {
  await requireSuperAdmin();
  const institutions = await loadInstitutions();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Institutions" description="Every college, university and board on Imtihaan. Exam content stays private to each institution." />
      {institutions.length === 0 ? (
        <EmptyState message="No institutions yet. Add the first one to give its admin access." />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">People</TableHead>
              <TableHead className="text-right">Exams</TableHead>
              <TableHead>Since</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {institutions.map(({ institution, memberCount, examCount }) => (
              <TableRow key={institution.id}>
                <TableCell className="font-medium">{institution.name}</TableCell>
                <TableCell>{institution.city}</TableCell>
                <TableCell className="capitalize">{institution.status}</TableCell>
                <TableCell className="text-right">{memberCount}</TableCell>
                <TableCell className="text-right">{examCount}</TableCell>
                <TableCell>{formatDate(institution.created_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
