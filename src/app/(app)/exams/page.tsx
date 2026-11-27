import { EmptyState } from "@/components/states";
import { loadMyExams } from "@/features/delivery/data";
import { MyExamList } from "@/features/delivery/my-exam-list";
import { PageHeader } from "@/components/page-header";
import { requireMember } from "@/lib/access";

export default async function MyExamsPage() {
  const member = await requireMember("candidate");
  const entries = await loadMyExams(member);

  const open = entries.filter((entry) => entry.phase === "open" && entry.attempt?.status !== "submitted" && entry.attempt?.status !== "auto_submitted");
  const upcoming = entries.filter((entry) => entry.phase === "upcoming");
  const completed = entries.filter((entry) => !open.includes(entry) && !upcoming.includes(entry));

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="My exams" description={member.institution.name} />
      {entries.length === 0 ? (
        <EmptyState message="You are not enrolled in any exams yet. Your examiner enrolls you; they appear here when published." />
      ) : (
        <>
          <MyExamList title="Open now" entries={open} empty="Nothing is open right now." />
          <MyExamList title="Upcoming" entries={upcoming} empty="No upcoming exams." />
          <MyExamList title="Completed" entries={[...completed].reverse()} empty="No completed exams yet." />
        </>
      )}
    </div>
  );
}
