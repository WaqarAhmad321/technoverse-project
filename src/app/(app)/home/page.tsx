import { Activity, Eye, Award, Hourglass, CalendarClock, ClipboardList, FilePenLine, Library, NotebookPen, ShieldCheck, UsersRound } from "lucide-react";
import Link from "next/link";
import { GettingStarted } from "@/components/getting-started";
import { NoAccessNotice } from "@/components/no-access-notice";
import { PageHeader } from "@/components/page-header";
import { StatTile } from "@/components/stat-tile";
import { Button } from "@/components/ui/button";
import { getAccess } from "@/lib/access";
import { formatPkt } from "@/lib/format";
import { AttentionList } from "@/components/attention-list";
import { adminAttention, candidateAttention, controllerAttention, examinerAttention } from "@/lib/attention";
import { CandidateChartsSection, ExaminerChartsSection, PlatformChartsSection, StaffChartsSection } from "@/components/charts/dashboard-charts";
import { loadCandidateCharts, loadExaminerCharts, loadPlatformCharts, loadStaffCharts } from "@/lib/dashboard-data";
import { loadCandidateSummary, loadStaffSummary } from "@/lib/home-data";

export default async function HomePage() {
  const access = await getAccess();
  const firstName = access.profile.display_name;
  const current = access.current;
  const member = current ? { user: access.user, profile: access.profile, institution: current.institution, roles: current.roles } : null;
  const isStaff = current?.roles.some((role) => role !== "candidate") ?? false;
  const isCandidate = current?.roles.includes("candidate") ?? false;
  const roles = current?.roles ?? [];
  const isExaminer = roles.includes("examiner");
  const isOversight = roles.includes("institution_admin") || roles.includes("controller");
  const [staff, candidate, attention, examinerCharts, candidateCharts, staffCharts, platformCharts] = await Promise.all([
    member && isStaff ? loadStaffSummary(member) : null,
    member && isCandidate ? loadCandidateSummary(member) : null,
    member
      ? Promise.all([
          roles.includes("controller") ? controllerAttention(member) : [],
          roles.includes("examiner") ? examinerAttention(member) : [],
          roles.includes("candidate") ? candidateAttention(member) : [],
          roles.includes("institution_admin") ? adminAttention(member) : [],
        ]).then((lists) => lists.flat())
      : [],
    member && isExaminer ? loadExaminerCharts(member) : null,
    member && isCandidate ? loadCandidateCharts(member) : null,
    member && isOversight ? loadStaffCharts(member) : null,
    !current && access.profile.is_super_admin ? loadPlatformCharts() : null,
  ]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title={`Welcome, ${firstName}`} description={current?.institution.name ?? (access.profile.is_super_admin ? "Platform admin" : undefined)} />
      {member && <GettingStarted member={member} />}

      {current?.institution.status === "pending" && (
        <p className="flex items-start gap-3 rounded-3xl bg-primary/10 p-5 text-base">
          <Hourglass aria-hidden className="mt-0.5 size-5 shrink-0 text-primary" />
          {current.institution.name} is waiting for platform approval. You can set up questions, rosters and exams now; publishing opens once it is approved.
        </p>
      )}
      {access.suspended && <p className="rounded-3xl bg-card p-6 text-base">Your institution is suspended. Ask the platform admin to reactivate it.</p>}
      {!current && !access.suspended && !access.profile.is_super_admin && <NoAccessNotice access={access} />}

      {member && (
        <AttentionList items={attention} empty="You are all caught up. New marking, approvals, challenges and results will show up here." />
      )}

      {candidate && (
        <section aria-labelledby="next-up" className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 rounded-3xl bg-card p-6 md:flex-row md:items-center md:justify-between md:p-8">
            <div className="flex items-start gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                <NotebookPen aria-hidden className="size-6" />
              </span>
              <div className="flex flex-col gap-1">
                <h2 id="next-up" className="text-sm text-muted-foreground">
                  {candidate.nextExam ? (candidate.nextIsOpen ? "Open now" : "Next exam") : "Nothing to sit right now"}
                </h2>
                <p className="text-2xl font-medium tracking-tight">{candidate.nextExam?.title ?? "You are all caught up"}</p>
                {candidate.nextExam && (
                  <p className="text-base text-muted-foreground">
                    {candidate.nextIsOpen
                      ? `${candidate.nextExam.duration_minutes} minutes · closes ${formatPkt(candidate.nextExam.closes_at)}`
                      : `Opens ${formatPkt(candidate.nextExam.opens_at)}`}
                  </p>
                )}
              </div>
            </div>
            {candidate.nextExam && (
              <Button asChild size="lg">
                <Link href={`/exams/${candidate.nextExam.id}`}>{candidate.nextIsOpen ? "Start exam" : "See details"}</Link>
              </Button>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <StatTile href="/exams" icon={CalendarClock} value={candidate.upcoming} label="Upcoming exams" />
            <StatTile href="/results" icon={Award} value={candidate.results} label="Published results" />
          </div>
        </section>
      )}

      {staff && current && (
        <section aria-label="Your institution at a glance" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {(current.roles.includes("examiner") || current.roles.includes("institution_admin") || current.roles.includes("controller") || current.roles.includes("invigilator")) && (
            <StatTile href="/monitor" icon={Activity} value={staff.openNow} label="Exams open now" />
          )}
          {current.roles.includes("examiner") && (
            <>
              <StatTile href="/manage" icon={FilePenLine} value={staff.drafts} label="Drafts to finish" />
              <StatTile href="/manage" icon={ClipboardList} value={staff.toPublish} label="Closed, results not out" />
              <StatTile href="/questions" icon={Library} value={staff.questions} label="Questions in the bank" />
            </>
          )}
          {current.roles.includes("institution_admin") && (
            <>
              <StatTile href="/admin/oversight" icon={Eye} value="Review" label="Examiner oversight" />
              <StatTile href="/admin/people" icon={UsersRound} value={staff.people} label="Roles held by people" />
              <StatTile href="/admin/audit" icon={ShieldCheck} value={staff.auditEvents} label="Recorded actions" />
            </>
          )}
        </section>
      )}
      {candidateCharts && <CandidateChartsSection data={candidateCharts} />}
      {examinerCharts && <ExaminerChartsSection data={examinerCharts} />}
      {staffCharts && <StaffChartsSection data={staffCharts} />}
      {platformCharts && <PlatformChartsSection data={platformCharts} />}
    </div>
  );
}
