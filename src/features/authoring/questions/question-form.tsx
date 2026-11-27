"use client";

import { useActionState, useState } from "react";
import { Plus, X } from "lucide-react";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { MultipleRule, Question, QuestionKind } from "@/lib/exam-types";
import { selectClass } from "../format";
import { saveQuestion, type QuestionFormState } from "./actions";
import {
  DIFFICULTIES,
  DIFFICULTY_LABEL,
  KINDS,
  KIND_LABEL,
  MARKS_MAX,
  MARKS_MIN,
  OPTION_IDS,
  OPTION_LIMITS,
  PARTIAL_FORMULA,
  questionSchema,
} from "./schema";

type Option = { key: number; text: string; correct: boolean };

const DEFAULT_OPTION_COUNT = 4;

function startingOptions(question: Question | null): Option[] {
  if (question && question.options.length > 0) {
    return question.options.map((option, index) => ({
      key: index,
      text: option.text,
      correct: question.answer_key?.includes(option.id) ?? false,
    }));
  }
  return Array.from({ length: DEFAULT_OPTION_COUNT }, (_, index) => ({ key: index, text: "", correct: false }));
}

export function QuestionForm({ question, topics }: { question: Question | null; topics: string[] }) {
  const [state, formAction] = useActionState<QuestionFormState, FormData>(saveQuestion.bind(null, question?.id ?? null), null);
  const [kind, setKind] = useState<QuestionKind>(question?.kind ?? "single");
  const [options, setOptions] = useState<Option[]>(() => startingOptions(question));
  const [rule, setRule] = useState<MultipleRule>(question?.multiple_rule ?? "partial");
  const [clientError, setClientError] = useState<string | null>(null);
  const nextKey = Math.max(-1, ...options.map((option) => option.key)) + 1;

  const isChoice = kind !== "written";
  const limits = kind === "written" ? null : OPTION_LIMITS[kind];

  function setCorrect(key: number, checked: boolean) {
    setOptions((current) =>
      current.map((option) => {
        if (option.key === key) return { ...option, correct: checked };
        return kind === "single" && checked ? { ...option, correct: false } : option;
      }),
    );
  }

  function checkBeforeSend(event: React.FormEvent<HTMLFormElement>) {
    const formData = new FormData(event.currentTarget);
    const parsed = questionSchema.safeParse({
      kind,
      topic: formData.get("topic"),
      difficulty: formData.get("difficulty"),
      body: formData.get("body"),
      marks: formData.get("marks"),
      options: formData.getAll("option"),
      correct: formData.getAll("correct"),
      multiple_rule: rule,
      rubric: formData.get("rubric") ?? "",
    });
    if (parsed.success) {
      setClientError(null);
      return;
    }
    event.preventDefault();
    setClientError(parsed.error.issues[0]?.message ?? "Check the question and try again.");
  }

  const message = clientError ?? (state?.status === "error" ? state.message : null);

  return (
    <form action={formAction} onSubmit={checkBeforeSend} className="flex flex-col gap-6" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="kind">Kind</Label>
          <select
            id="kind"
            name="kind"
            className={selectClass}
            value={kind}
            onChange={(event) => setKind(event.target.value as QuestionKind)}
          >
            {KINDS.map((value) => (
              <option key={value} value={value}>
                {KIND_LABEL[value]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="marks">Marks</Label>
          <Input
            id="marks"
            name="marks"
            type="number"
            inputMode="numeric"
            min={MARKS_MIN}
            max={MARKS_MAX}
            defaultValue={question?.marks ?? 2}
            className="h-11"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="topic">Topic</Label>
          <Input id="topic" name="topic" list="topics" defaultValue={question?.topic ?? ""} placeholder="Kinematics" className="h-11" />
          <datalist id="topics">
            {topics.map((topic) => (
              <option key={topic} value={topic} />
            ))}
          </datalist>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="difficulty">Difficulty</Label>
          <select id="difficulty" name="difficulty" className={selectClass} defaultValue={question?.difficulty ?? "medium"}>
            {DIFFICULTIES.map((value) => (
              <option key={value} value={value}>
                {DIFFICULTY_LABEL[value]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="body">Question</Label>
        <Textarea id="body" name="body" rows={4} defaultValue={question?.body ?? ""} className="text-base" />
      </div>

      {isChoice && limits && (
        <fieldset className="flex flex-col gap-2">
          <legend className="pb-2 text-sm font-medium">
            Options: tick {kind === "single" ? "the one correct answer" : "every correct answer"}
          </legend>
          {options.map((option, index) => (
            <div key={option.key} className="flex items-center gap-3 rounded-xl bg-muted px-3 py-2">
              <input
                type={kind === "single" ? "radio" : "checkbox"}
                name="correct"
                value={OPTION_IDS[index]}
                checked={option.correct}
                onChange={(event) => setCorrect(option.key, event.target.checked)}
                aria-label={`Option ${OPTION_IDS[index].toUpperCase()} is correct`}
                className="size-5 accent-primary"
              />
              <span className="w-4 text-sm text-muted-foreground">{OPTION_IDS[index].toUpperCase()}</span>
              <Input
                name="option"
                value={option.text}
                onChange={(event) =>
                  setOptions((current) => current.map((item) => (item.key === option.key ? { ...item, text: event.target.value } : item)))
                }
                aria-label={`Option ${OPTION_IDS[index].toUpperCase()}`}
                className="h-11 flex-1"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-11 rounded-full"
                aria-label={`Remove option ${OPTION_IDS[index].toUpperCase()}`}
                disabled={options.length <= limits.min}
                onClick={() => setOptions((current) => current.filter((item) => item.key !== option.key))}
              >
                <X className="size-5" aria-hidden />
              </Button>
            </div>
          ))}
          {options.length < limits.max && (
            <Button
              type="button"
              variant="ghost"
              className="self-start rounded-full"
              onClick={() => setOptions((current) => [...current, { key: nextKey, text: "", correct: false }])}
            >
              <Plus className="size-5" aria-hidden /> Add option
            </Button>
          )}
        </fieldset>
      )}

      {kind === "multiple" && (
        <fieldset className="flex flex-col gap-2">
          <legend className="pb-2 text-sm font-medium">Scoring</legend>
          <label className="flex min-h-11 items-center gap-3">
            <input type="radio" name="multiple_rule" value="partial" checked={rule === "partial"} onChange={() => setRule("partial")} className="size-5 accent-primary" />
            <span>
              Partial marks: <span className="font-mono text-sm">{PARTIAL_FORMULA}</span>
            </span>
          </label>
          <label className="flex min-h-11 items-center gap-3">
            <input type="radio" name="multiple_rule" value="all_or_nothing" checked={rule === "all_or_nothing"} onChange={() => setRule("all_or_nothing")} className="size-5 accent-primary" />
            <span>All or nothing: full marks only when every choice is right</span>
          </label>
        </fieldset>
      )}

      {kind === "written" && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rubric">Marking guide</Label>
          <Textarea id="rubric" name="rubric" rows={4} defaultValue={question?.rubric ?? ""} placeholder="2 marks: names inertia. 2 marks: ..." className="text-base" />
        </div>
      )}

      {message && <FormMessage tone="error">{message}</FormMessage>}
      {state?.status === "saved" && !clientError && <FormMessage tone="done">Saved as version {state.version}.</FormMessage>}

      <div className="flex flex-col gap-2">
        <SubmitButton size="lg" className="self-start">
          {question ? "Save question" : "Add question"}
        </SubmitButton>
        {question && (
          <p className="text-sm text-muted-foreground">Candidates already sitting an exam keep the version they started with.</p>
        )}
      </div>
    </form>
  );
}
