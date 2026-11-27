"use client";

import { Flag, NotebookPen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { AnswerResponse } from "@/lib/exam-types";
import { cn } from "@/lib/utils";
import type { PaperQuestion } from "./attempts";

export type AnswerState = { response: AnswerResponse; marked: boolean };

type QuestionCardProps = {
  question: PaperQuestion;
  total: number;
  state: AnswerState;
  scratch: string;
  onAnswer: (next: AnswerState) => void;
  onScratch: (text: string) => void;
  onPaste: (chars: number) => void;
};

export function QuestionCard({ question, total, state, scratch, onAnswer, onScratch, onPaste }: QuestionCardProps) {
  const headingId = `question-${question.position}-text`;
  const chosen = state.response.choices ?? [];

  return (
    <article id={`question-${question.position}`} aria-labelledby={headingId} className="scroll-mt-24 rounded-3xl bg-card p-6 md:p-8">
      <p className="text-sm text-muted-foreground">
        Question {question.position} of {total} · {question.marks} {question.marks === 1 ? "mark" : "marks"}
        {question.kind === "multiple" ? " · choose all that apply" : ""}
      </p>
      <h2 id={headingId} className="mt-2 text-lg leading-7 font-medium">
        {question.body}
      </h2>

      {question.kind === "written" ? (
        <div className="mt-6 flex flex-col gap-1.5">
          <label htmlFor={`answer-${question.question_id}`} className="text-sm font-medium">
            Your answer
          </label>
          <Textarea
            id={`answer-${question.question_id}`}
            defaultValue={state.response.text ?? ""}
            rows={8}
            onChange={(event) => onAnswer({ ...state, response: { text: event.target.value } })}
            onPaste={(event) => onPaste(event.clipboardData.getData("text").length)}
          />
        </div>
      ) : (
        <fieldset className="mt-6 space-y-2">
          <legend className="sr-only">Options</legend>
          {question.options.map((option, optionIndex) => {
            const isChosen = chosen.includes(option.id);
            const letter = String.fromCharCode("A".charCodeAt(0) + optionIndex);
            const nextChoices =
              question.kind === "single" ? [option.id] : isChosen ? chosen.filter((id) => id !== option.id) : [...chosen, option.id];
            return (
              <label
                key={option.id}
                className={cn(
                  "flex min-h-14 cursor-pointer items-center gap-3 rounded-xl bg-muted px-4 text-base transition-colors duration-200 ease-out hover:bg-accent has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring",
                  isChosen && "bg-primary/10 ring-2 ring-primary hover:bg-primary/10",
                )}
              >
                <input
                  type={question.kind === "single" ? "radio" : "checkbox"}
                  name={`question-${question.question_id}`}
                  checked={isChosen}
                  onChange={() => onAnswer({ ...state, response: { choices: nextChoices } })}
                  className="size-5 accent-primary"
                />
                <span className="w-4 text-sm text-muted-foreground">{letter}</span>
                <span>{option.text}</span>
              </label>
            );
          })}
        </fieldset>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant={state.marked ? "secondary" : "ghost"}
          aria-pressed={state.marked}
          onClick={() => onAnswer({ ...state, marked: !state.marked })}
        >
          <Flag aria-hidden className="size-4" />
          {state.marked ? "Marked for review" : "Mark for review"}
        </Button>
      </div>

      <details className="group mt-4 rounded-xl bg-muted px-4 py-3" open={scratch.length > 0}>
        <summary className="flex min-h-8 cursor-pointer list-none items-center gap-2 text-sm font-medium">
          <NotebookPen aria-hidden className="size-4 text-muted-foreground" />
          Rough work <span className="font-normal text-muted-foreground">(private, never marked)</span>
        </summary>
        <label htmlFor={`scratch-${question.question_id}`} className="sr-only">
          Rough work for question {question.position}
        </label>
        <Textarea
          id={`scratch-${question.question_id}`}
          defaultValue={scratch}
          rows={4}
          className="mt-2 font-mono"
          onChange={(event) => onScratch(event.target.value)}
        />
      </details>
    </article>
  );
}
