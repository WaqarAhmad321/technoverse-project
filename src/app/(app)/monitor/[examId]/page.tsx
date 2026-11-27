import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Wifi, WifiOff } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { TableSkeleton } from "@/components/skeletons";
import { EmptyState } from "@/components/states";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AnnouncementForm } from "@/features/delivery/announcement-form";
import { ApproveCreditButton } from "@/features/delivery/approve-credit-button";
import { loadAnnouncements } from "@/features/delivery/attempts";
import { AutoRefresh } from "@/features/delivery/auto-refresh";
import { loadExamForStaff, loadMonitorRows, loadQuestionPreviews, type MonitorRow } from "@/features/delivery/data";
import { Pagination } from "@/components/pagination";
import { can, requireMember } from "@/lib/access";
import { paginate } from "@/lib/pagination";
import type { Exam } from "@/lib/exam-types";
import { formatPkt } from "@/lib/format";

const REFRESH_MS = 5_000;
const ONLINE_WITHIN_SECONDS = 30;
const MS_PER_SECOND = 1_000;

function secondsSince(iso: string | null): number | null {
  return iso ? Math.round((Date.now() - new Date(iso).getTime()) / MS_PER_SECOND) : null;
}

function signalText(signal: MonitorRow["signals"][number]): string {
  const seconds = typeof signal.details.seconds === "number" ? signal.details.seconds : null;
  const when = formatPkt(signal.occurred_at);
  if (signal.kind === "offline") {
    const kept = typeof signal.details.answered_offline === "number" && signal.details.answered_offline > 0;
    return `No connection for ${seconds ?? "?"} s${kept ? ", kept answering offline" : ""}, ${when}`;
  }
  if (signal.kind === "late_answer") return `Answer arrived after submitting, ${when}`;
  if (signal.kind === "tab_hidden") return `Left the exam tab for ${seconds ?? "?"} s, ${when}`;
  if (signal.kind === "paste") return `Pasted ${typeof signal.details.chars === "number" ? signal.details.chars : "some"} characters into an answer, ${when}`;
  if (signal.kind === "time_credited") return `Given ${seconds ?? "?"} s back after an outage, ${when}`;
  if (signal.kind === "credit_pending") return `Asks for ${seconds ?? "?"} s back after a long outage, ${when}`;
  return `${signal.kind}, ${when}`;
}

function StatusCell({ row, questionCount }: { row: MonitorRow; questionCount: number }) {
  const { attempt } = row;
  if (!attempt) return <span className="text-muted-foreground">Not started</span>;
  if (attempt.status === "auto_submitted") return <span>Submitted automatically</span>;
  if (attempt.status === "submitted") return <span>Submitted {attempt.submitted_at ? formatPkt(attempt.submitted_at) : ""}</span>;
  const quietSeconds = secondsSince(attempt.last_seen_at);
  const isOnline = quietSeconds !== null && quietSeconds <= ONLINE_WITHIN_SECONDS;
  return (
    <span className="flex flex-col gap-0.5">
      <span>
        In progress · {row.answeredCount} of {questionCount} answered
      </span>
      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {isOnline ? <Wifi aria-hidden className="size-4" /> : <WifiOff aria-hidden className="size-4 text-foreground" />}
        {isOnline ? `Online, seen ${quietSeconds} s ago` : `No signal for ${quietSeconds ?? "?"} s`}
      </span>
    </span>
  );
}

type Member = Awaited<ReturnType<typeof requireMember>>;

async function MonitorTable({
  member,
  exam,
  canSpeak,
  requestedPage,
}: {
  member: Member;
  exam: Exam;
  canSpeak: boolean;
  requestedPage: string | string[] | undefined;
}) {
  const [rows, questions] = await Promise.all([loadMonitorRows(member, exam.id), loadQuestionPreviews(exam.id, member.institution.id)]);
  const order = (row: MonitorRow) => (row.attempt?.status === "in_progress" ? 0 : row.attempt ? 1 : 2);
  const sortedRows = [...rows].sort((a, b) => order(a) - order(b));
  const shown = paginate(sortedRows, requestedPage);
  const inProgress = rows.filter((row) => row.attempt?.status === "in_progress").length;
  const submitted = rows.filter((row) => row.attempt && row.attempt.status !== "in_progress").length;

  return (
    <div className="flex flex-col gap-3">
      <p className="flex items-center gap-2 text-base text-muted-foreground">
        <span aria-hidden className="size-2 rounded-full bg-primary motion-safe:animate-pulse" />
        {inProgress} sitting now · {submitted} submitted · {rows.length} enrolled
      </p>
      {rows.length === 0 ? (
        <EmptyState message="Nobody is enrolled yet. Enroll candidates from the exam's setup page." />
      ) : (
        <div className="overflow-x-auto rounded-3xl bg-card p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Roll</TableHead>
                <TableHead>Candidate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Signals for review, not evidence</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.rows.map((row) => (
                <TableRow key={row.candidate.id}>
                  <TableCell className="font-mono">{row.candidate.roll_number}</TableCell>
                  <TableCell>{row.candidate.full_name}</TableCell>
                  <TableCell className="whitespace-normal">
                    <StatusCell row={row} questionCount={questions.length} />
                  </TableCell>
                  <TableCell className="text-sm whitespace-normal text-muted-foreground">
                    {row.signals.length === 0 ? "None" : row.signals.slice(0, 3).map((signal) => <span key={signal.occurred_at} className="block">{signalText(signal)}</span>)}
                    {canSpeak && row.attempt && row.signals.some((signal) => signal.kind === "credit_pending") && (
                      <ApproveCreditButton
                        attemptId={row.attempt.id}
                        examId={exam.id}
                        seconds={Number(row.signals.find((signal) => signal.kind === "credit_pending")?.details.seconds ?? 0)}
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination page={shown} basePath={`/monitor/${exam.id}`} noun="candidates" />
        </div>
      )}
    </div>
  );
}

export default async function MonitorPage({
  params,
  searchParams,
}: {
  params: Promise<{ examId: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const { examId } = await params;
  const { page: requestedPage } = await searchParams;
  const member = await requireMember("examiner", "institution_admin", "controller", "invigilator");
  const exam = await loadExamForStaff(member, examId);
  if (!can(member, "exam.monitor", exam)) notFound();
  const announcements = await loadAnnouncements(exam.id);
  const canSpeak = member.roles.some((role) => role === "examiner" || role === "institution_admin" || role === "controller");

  return (
    <div className="flex flex-col gap-6">
      <AutoRefresh everyMs={REFRESH_MS} />
      <PageHeader back={{ href: "/monitor", label: "Live monitor" }} title={exam.title} description="Live. Updates every 5 seconds." />
      {canSpeak && <AnnouncementForm examId={exam.id} />}
      {announcements.length > 0 && (
        <section className="flex flex-col gap-2 rounded-3xl bg-card p-4 md:p-6">
          <h2 className="text-xl font-medium">Sent</h2>
          {announcements.map((item) => (
            <p key={item.id} className="text-base">
              <span className="text-sm text-muted-foreground">{formatPkt(item.created_at)} · </span>
              {item.question_position ? `Q${item.question_position}: ` : ""}
              {item.body}
            </p>
          ))}
        </section>
      )}
      <Suspense key={String(requestedPage ?? "1")} fallback={<TableSkeleton rows={10} columns={4} />}>
        <MonitorTable member={member} exam={exam} canSpeak={canSpeak} requestedPage={requestedPage} />
      </Suspense>
    </div>
  );
}
