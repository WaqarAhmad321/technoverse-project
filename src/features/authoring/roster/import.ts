import { candidateSchema, type CandidateInput } from "./schema";

export type ImportProblem = { row: number; field: string; message: string };
export type ImportReport = { ready: CandidateInput[]; problems: ImportProblem[] };

const BOM = /^﻿/;
const COLUMNS = ["full_name", "roll_number", "email", "cnic", "extra_time_pct"] as const;

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (quoted && char === '"' && line[index + 1] === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(cell);
      cell = "";
    } else {
      cell += char;
    }
  }
  cells.push(cell);
  return cells.map((value) => value.trim());
}

function parseRows(text: string): Record<string, string>[] {
  const clean = text.replace(BOM, "").trim();
  if (clean.startsWith("[")) return JSON.parse(clean) as Record<string, string>[];
  const [header, ...lines] = clean.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const names = splitCsvLine(header ?? "").map((name) => name.toLowerCase());
  return lines.map((line) => {
    const cells = splitCsvLine(line);
    return Object.fromEntries(names.map((name, index) => [name, cells[index] ?? ""]));
  });
}

// Pure dry run: every row is checked against the schema, the file itself and the existing roster.
export function checkImport(text: string, existingRolls: Set<string>): ImportReport {
  let rows: Record<string, string>[];
  try {
    rows = parseRows(text);
  } catch {
    return { ready: [], problems: [{ row: 0, field: "file", message: "This file is not valid CSV or JSON." }] };
  }
  const ready: CandidateInput[] = [];
  const problems: ImportProblem[] = [];
  const seen = new Set<string>();
  rows.forEach((raw, index) => {
    const row = index + 2;
    const values = Object.fromEntries(COLUMNS.map((column) => [column, String(raw[column] ?? "")]));
    const parsed = candidateSchema.safeParse({ ...values, extra_time_pct: values.extra_time_pct || "0" });
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      problems.push({ row, field: String(issue?.path[0] ?? "row"), message: issue?.message ?? "This row is not valid." });
      return;
    }
    const roll = parsed.data.roll_number;
    if (existingRolls.has(roll) || seen.has(roll)) {
      problems.push({ row, field: "roll_number", message: `Roll number ${roll} is already on the roster.` });
      return;
    }
    seen.add(roll);
    ready.push(parsed.data);
  });
  return { ready, problems };
}
