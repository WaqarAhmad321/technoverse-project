import { verifyResult } from "@/features/delivery/data";
import { formatDate, formatMarks } from "@/lib/format";
import { site } from "@/lib/site";

export default async function VerifyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const verified = await verifyResult(code);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-12">
      <p className="text-base font-semibold">{site.name} result check</p>
      {!verified ? (
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">We could not find a result with this code</h1>
          <p className="text-base text-muted-foreground">Check the code on the report, or scan its QR again.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">Valid result</h1>
          {verified.supersededBy && (
            <p role="status" className="rounded-lg border p-4 text-base">
              This report was superseded by version {verified.supersededBy.version} on {formatDate(verified.supersededBy.publishedAt)}.
            </p>
          )}
          <dl className="grid grid-cols-2 gap-4 rounded-lg border p-4 text-base">
            <div><dt className="text-muted-foreground">Institution</dt><dd className="font-medium">{verified.institutionName}</dd></div>
            <div><dt className="text-muted-foreground">Exam</dt><dd className="font-medium">{verified.examTitle}</dd></div>
            <div><dt className="text-muted-foreground">Candidate</dt><dd className="font-medium">{verified.candidateInitials}</dd></div>
            <div><dt className="text-muted-foreground">Score</dt><dd className="font-medium">{formatMarks(verified.total)} of {verified.maxTotal}</dd></div>
            <div><dt className="text-muted-foreground">Version</dt><dd className="font-medium">{verified.version}</dd></div>
            <div><dt className="text-muted-foreground">Published</dt><dd className="font-medium">{formatDate(verified.publishedAt)}</dd></div>
          </dl>
        </div>
      )}
    </main>
  );
}
