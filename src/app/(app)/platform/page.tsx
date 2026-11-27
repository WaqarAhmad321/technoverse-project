import { Building2, ChevronRight, Hourglass } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { EmptyState } from "@/components/states";
import { StatusDot, type StatusTone } from "@/components/status-dot";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AddInstitutionForm } from "@/features/people/add-institution-form";
import { loadInstitutions } from "@/features/people/data";
import { ReviewInstitutionForm } from "@/features/people/review-institution-form";
import { requireSuperAdmin } from "@/lib/access";
import type { Institution } from "@/lib/exam-types";
import { formatDate } from "@/lib/format";
import { paginate } from "@/lib/pagination";

const STATUS: Record<Institution["status"], { tone: StatusTone; label: string }> = {
  active: { tone: "ready", label: "Active" },
  pending: { tone: "live", label: "Waiting for approval" },
  suspended: { tone: "warn", label: "Suspended" },
  rejected: { tone: "done", label: "Rejected" },
};

export default async function PlatformPage({ searchParams }: { searchParams: Promise<{ page?: string | string[] }> }) {
  await requireSuperAdmin();
  const [institutions, { page: requestedPage }] = await Promise.all([loadInstitutions(), searchParams]);
  const pending = institutions.filter(({ institution }) => institution.status === "pending");
  const shown = paginate(institutions, requestedPage);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Institutions" description="Every college, university and board on Imtihaan. You approve who joins and who runs them; exam content stays private to each institution." />

      <section className="flex flex-col gap-3" aria-labelledby="applications">
        <h2 id="applications" className="flex items-center gap-2 text-xl font-medium">
          <Hourglass aria-hidden className="size-5 text-primary" />
          Waiting for approval ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="rounded-3xl bg-card px-5 py-4 text-base text-muted-foreground">No applications right now. New institutions appear here when they sign up.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {pending.map(({ institution, memberCount }) => (
              <li key={institution.id} className="flex flex-col gap-3 rounded-3xl bg-card p-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-col gap-1">
                  <Link href={`/platform/${institution.id}`} className="text-base font-medium underline-offset-4 hover:underline">
                    {institution.name}
                  </Link>
                  <span className="text-sm text-muted-foreground">
                    {institution.city || "City not given"} · applied {formatDate(institution.created_at)} · {memberCount} {memberCount === 1 ? "person" : "people"}
                  </span>
                </div>
                <ReviewInstitutionForm institutionId={institution.id} name={institution.name} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="all">
        <h2 id="all" className="text-xl font-medium">
          All institutions
        </h2>
        {institutions.length === 0 ? (
          <EmptyState message="No institutions yet. Add the first one below." />
        ) : (
          <div className="overflow-x-auto rounded-3xl bg-card p-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">People</TableHead>
                  <TableHead className="text-right">Exams</TableHead>
                  <TableHead className="hidden md:table-cell">Since</TableHead>
                  <TableHead>
                    <span className="sr-only">Open</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shown.rows.map(({ institution, memberCount, examCount }) => (
                  <TableRow key={institution.id}>
                    <TableCell>
                      <Link href={`/platform/${institution.id}`} className="flex items-center gap-3 font-medium">
                        <Building2 aria-hidden className="size-4 text-muted-foreground" />
                        {institution.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <StatusDot tone={STATUS[institution.status].tone}>{STATUS[institution.status].label}</StatusDot>
                    </TableCell>
                    <TableCell className="text-right">{memberCount}</TableCell>
                    <TableCell className="text-right">{examCount}</TableCell>
                    <TableCell className="hidden md:table-cell">{formatDate(institution.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <Link href={`/platform/${institution.id}`} aria-label={`Open ${institution.name}`} className="inline-flex size-10 items-center justify-center rounded-full hover:bg-accent">
                        <ChevronRight aria-hidden className="size-5" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination page={shown} basePath="/platform" noun="institutions" />
          </div>
        )}
      </section>
      <AddInstitutionForm />
    </div>
  );
}
