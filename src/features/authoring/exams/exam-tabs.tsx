import Link from "next/link";

export const EXAM_TABS = [
  { id: "details", label: "Details" },
  { id: "questions", label: "Questions" },
] as const;

export type ExamTab = (typeof EXAM_TABS)[number]["id"];

export function parseExamTab(value: string | undefined): ExamTab {
  return EXAM_TABS.find((tab) => tab.id === value)?.id ?? "details";
}

export function ExamTabs({ examId, current }: { examId: string; current: ExamTab }) {
  return (
    <nav aria-label="Exam sections" className="flex flex-wrap gap-1 pb-4">
      {EXAM_TABS.map((tab) => (
        <Link
          key={tab.id}
          href={`/manage/${examId}?tab=${tab.id}`}
          aria-current={tab.id === current ? "page" : undefined}
          className={`flex h-11 items-center rounded-full px-4 text-sm font-medium transition-colors duration-200 hover:bg-accent ${tab.id === current ? "bg-secondary text-foreground" : "text-muted-foreground"}`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
