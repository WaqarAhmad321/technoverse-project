import { OPTION_IDS, questionSchema, type QuestionInput } from "./schema";

export type QuestionProblem = { row: number; message: string };
export type QuestionImportReport = { ready: QuestionInput[]; problems: QuestionProblem[] };

const BOM = /^﻿/;

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (quoted && char === '"' && line[index + 1] === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) {
      cells.push(cell);
      cell = "";
    } else cell += char;
  }
  cells.push(cell);
  return cells.map((value) => value.trim());
}

// CSV rows become the same shape as JSON: options from option_a…option_f, answer "a;c" becomes correct.
function fromCsvRow(row: Record<string, string>): Record<string, unknown> {
  const options = OPTION_IDS.map((id) => row[`option_${id}`] ?? "").filter((text) => text.length > 0);
  const answer = (row.answer ?? "").split(/[;\s]+/).filter(Boolean);
  return { ...row, options, answer };
}

function parseRows(text: string): Record<string, unknown>[] {
  const clean = text.replace(BOM, "").trim();
  if (clean.startsWith("[")) return JSON.parse(clean) as Record<string, unknown>[];
  const [header, ...lines] = clean.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const names = splitCsvLine(header ?? "").map((name) => name.toLowerCase());
  return lines.map((line) => {
    const cells = splitCsvLine(line);
    return fromCsvRow(Object.fromEntries(names.map((name, index) => [name, cells[index] ?? ""])));
  });
}

function toFormShape(raw: Record<string, unknown>): Record<string, unknown> {
  const options = Array.isArray(raw.options) ? raw.options.map((option) => (typeof option === "string" ? option : String((option as { text?: string }).text ?? ""))) : [];
  const answer = raw.answer ?? raw.answer_key ?? raw.correct ?? [];
  const correct = (Array.isArray(answer) ? answer : [answer]).map((id) => String(id).toLowerCase());
  return { ...raw, options, correct, multiple_rule: raw.multiple_rule ?? "partial", rubric: raw.rubric ?? "" };
}

export function checkQuestionImport(text: string): QuestionImportReport {
  let rows: Record<string, unknown>[];
  try {
    rows = parseRows(text);
  } catch {
    return { ready: [], problems: [{ row: 0, message: "This file is not valid CSV or JSON." }] };
  }
  const ready: QuestionInput[] = [];
  const problems: QuestionProblem[] = [];
  rows.forEach((raw, index) => {
    const parsed = questionSchema.safeParse(toFormShape(raw));
    if (parsed.success) ready.push(parsed.data);
    else problems.push({ row: index + 1, message: parsed.error.issues[0]?.message ?? "This question is not valid." });
  });
  return { ready, problems };
}
