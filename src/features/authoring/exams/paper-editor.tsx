import Link from "next/link";
import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import type { Difficulty } from "@/lib/exam-types";
import { plural, selectClass } from "../format";
import type { BankRow } from "../questions/data";
import { DIFFICULTIES, DIFFICULTY_LABEL, KIND_LABEL, firstLine } from "../questions/schema";
import { addQuestionToExam, moveQuestionInExam, removeQuestionFromExam } from "./actions";
import type { PaperQuestion } from "./data";

const iconButton = "size-11 rounded-full";

function meta(question: Pick<PaperQuestion, "topic" | "difficulty" | "kind" | "marks">): string {
  return `${question.topic} · ${DIFFICULTY_LABEL[question.difficulty]} · ${KIND_LABEL[question.kind]} · ${plural(question.marks, "mark")}`;
}

export function MarksTotal({ paper, totalMarks }: { paper: PaperQuestion[]; totalMarks: number }) {
  const sum = paper.reduce((total, question) => total + question.marks, 0);
  return (
    <p className="text-base" aria-live="polite">
      <span className="text-xl font-medium tabular-nums">
        {sum} of {totalMarks} marks
      </span>{" "}
      <span className="text-muted-foreground">
        from {plural(paper.length, "question")}
        {sum !== totalMarks && ` · ${sum < totalMarks ? totalMarks - sum : sum - totalMarks} ${sum < totalMarks ? "short" : "over"}`}
      </span>
    </p>
  );
}

export function PaperList({ examId, paper, isEditable }: { examId: string; paper: PaperQuestion[]; isEditable: boolean }) {
  if (paper.length === 0) {
    return <p className="rounded-xl bg-muted px-4 py-6 text-center text-muted-foreground">No questions yet. Add them from your bank below.</p>;
  }
  return (
    <ol aria-label="Questions on this paper" className="flex flex-col gap-2">
      {paper.map((question, index) => (
        <li key={question.id} className="flex items-center gap-3 rounded-xl bg-muted px-3 py-2">
          <span className="w-6 text-sm text-muted-foreground tabular-nums">{index + 1}</span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="line-clamp-2 text-base">{firstLine(question.body)}</span>
            <span className="text-sm text-muted-foreground">{meta(question)}</span>
          </span>
          {isEditable && (
            <span className="flex shrink-0">
              <form action={moveQuestionInExam.bind(null, examId, question.id, -1)}>
                <SubmitButton variant="ghost" size="icon" className={iconButton} disabled={index === 0} aria-label={`Move question ${index + 1} up`}>
                  <ArrowUp className="size-5" aria-hidden />
                </SubmitButton>
              </form>
              <form action={moveQuestionInExam.bind(null, examId, question.id, 1)}>
                <SubmitButton variant="ghost" size="icon" className={iconButton} disabled={index === paper.length - 1} aria-label={`Move question ${index + 1} down`}>
                  <ArrowDown className="size-5" aria-hidden />
                </SubmitButton>
              </form>
              <form action={removeQuestionFromExam.bind(null, examId, question.id)}>
                <SubmitButton variant="ghost" size="icon" className={iconButton} aria-label={`Remove question ${index + 1}`}>
                  <X className="size-5" aria-hidden />
                </SubmitButton>
              </form>
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}

export function BankPicker({
  examId,
  bank,
  topics,
  topic,
  difficulty,
}: {
  examId: string;
  bank: BankRow[];
  topics: string[];
  topic?: string;
  difficulty?: Difficulty;
}) {
  return (
    <div className="flex flex-col gap-3">
      <form method="get" className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
        <input type="hidden" name="tab" value="questions" />
        <select name="topic" defaultValue={topic ?? ""} className={selectClass} aria-label="Topic">
          <option value="">All topics</option>
          {topics.map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
        <select name="difficulty" defaultValue={difficulty ?? ""} className={selectClass} aria-label="Difficulty">
          <option value="">Any difficulty</option>
          {DIFFICULTIES.map((value) => (
            <option key={value} value={value}>
              {DIFFICULTY_LABEL[value]}
            </option>
          ))}
        </select>
        <Button type="submit" variant="secondary" size="lg">
          Filter
        </Button>
      </form>
      {bank.length === 0 ? (
        <p className="rounded-xl bg-muted px-4 py-6 text-center text-muted-foreground">
          Every matching question is already in this exam.{" "}
          <Link href="/questions/new" className="text-foreground underline underline-offset-4">
            Add a new question to the bank
          </Link>
          .
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {bank.map((question) => (
            <li key={question.id} className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-accent">
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="line-clamp-2 text-base">{firstLine(question.body)}</span>
                <span className="text-sm text-muted-foreground">{meta(question)}</span>
              </span>
              <form action={addQuestionToExam.bind(null, examId, question.id)}>
                <SubmitButton variant="outline" className="rounded-full" aria-label={`Add to exam: ${firstLine(question.body)}`}>
                  <Plus className="size-5" aria-hidden /> Add
                </SubmitButton>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
