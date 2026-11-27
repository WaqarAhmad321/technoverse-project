"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { importCandidates } from "./import-actions";

const SAMPLE_CSV = `full_name,roll_number,email,cnic,extra_time_pct
Zainab Malik,0301,zainab.malik@example.pk,35202-4567890-2,0
Usman Ghani,0302,usman.ghani@example.pk,35201-7654321-5,25
`;

export function ImportForm() {
  const [state, formAction] = useActionState(importCandidates, null);
  const [text, setText] = useState("");
  const report = state?.report;
  const isClean = report && report.problems.length === 0 && report.ready.length > 0;

  async function readFile(file: File | undefined) {
    if (file) setText(await file.text());
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="file">CSV or JSON file</Label>
        <input id="file" type="file" accept=".csv,.json,text/csv,application/json" className="text-base" onChange={(event) => readFile(event.target.files?.[0])} />
        <a className="text-base underline" download="sample-candidates.csv" href={`data:text/csv;charset=utf-8,${encodeURIComponent(SAMPLE_CSV)}`}>
          Download a sample CSV
        </a>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="file_text">Rows (you can paste or fix them here)</Label>
        <Textarea id="file_text" name="file_text" rows={8} value={text} onChange={(event) => setText(event.target.value)} className="font-mono text-sm" />
      </div>
      {state && state.imported > 0 && (
        <FormMessage tone="done">
          Imported {state.imported} candidates. <Link href="/roster" className="underline">See the roster</Link>
        </FormMessage>
      )}
      {report && (report.ready.length > 0 || report.problems.length > 0) && (
        <div className="flex flex-col gap-2" aria-live="polite">
          <p className="text-base font-medium">
            {report.ready.length} rows ready, {report.problems.length} rows with problems
          </p>
          {report.problems.length > 0 && (
            <ul aria-label="Import problems" className="flex flex-col gap-1 text-base text-destructive">
              {report.problems.map((problem) => (
                <li key={`${problem.row}-${problem.field}`}>
                  Row {problem.row}: {problem.message}
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
            Import {report.ready.length} candidates
          </SubmitButton>
        )}
      </div>
    </form>
  );
}
