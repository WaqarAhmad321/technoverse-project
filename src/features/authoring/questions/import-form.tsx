"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { importQuestions } from "./import-actions";

const SAMPLE_JSON = `[
  { "topic": "Waves", "difficulty": "easy", "kind": "single", "marks": 2, "body": "What is the unit of frequency?", "options": ["Hertz", "Metre", "Second", "Joule"], "answer": ["a"] },
  { "topic": "Energy", "difficulty": "medium", "kind": "written", "marks": 5, "body": "توانائی کی بچت کے دو طریقے لکھیں۔", "rubric": "2.5 marks for each sensible way." }
]
`;

export function QuestionImportForm() {
  const [state, formAction] = useActionState(importQuestions, null);
  const [text, setText] = useState("");
  const report = state?.report;
  const isClean = report && report.problems.length === 0 && report.ready.length > 0;

  async function readFile(file: File | undefined) {
    if (file) setText(await file.text());
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="file">JSON or CSV file</Label>
        <input id="file" type="file" accept=".csv,.json,text/csv,application/json" className="text-base" onChange={(event) => readFile(event.target.files?.[0])} />
        <a className="text-base underline" download="sample-questions.json" href={`data:application/json;charset=utf-8,${encodeURIComponent(SAMPLE_JSON)}`}>
          Download a sample file
        </a>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="file_text">Questions (you can paste or fix them here)</Label>
        <Textarea id="file_text" name="file_text" rows={10} value={text} onChange={(event) => setText(event.target.value)} className="font-mono text-sm" dir="auto" />
      </div>
      {state && state.imported > 0 && (
        <FormMessage tone="done">
          Imported {state.imported} questions. <Link href="/questions" className="underline">See the bank</Link>
        </FormMessage>
      )}
      {report && (report.ready.length > 0 || report.problems.length > 0) && (
        <div className="flex flex-col gap-2" aria-live="polite">
          <p className="text-base font-medium">
            {report.ready.length} questions ready, {report.problems.length} with problems
          </p>
          {report.problems.length > 0 && (
            <ul aria-label="Import problems" className="flex flex-col gap-1 text-base text-destructive">
              {report.problems.map((problem) => (
                <li key={problem.row}>
                  Question {problem.row}: {problem.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <SubmitButton size="lg" variant={isClean ? "outline" : "default"} name="mode" value="check" disabled={!text || undefined}>
          Check file
        </SubmitButton>
        {isClean && (
          <SubmitButton size="lg" name="mode" value="import">
            Import {report.ready.length} questions
          </SubmitButton>
        )}
      </div>
    </form>
  );
}
