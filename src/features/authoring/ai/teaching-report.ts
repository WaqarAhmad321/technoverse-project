import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { liveOrRecorded } from "@/lib/demo";
import type { AnalyticsRow } from "../marking/key-doctor-data";

export const teachingReportSchema = z.object({
  headline: z.string(),
  misconceptions: z.array(z.object({ question: z.string(), what_they_think: z.string(), evidence: z.string() })),
  reteach_first: z.array(z.string()),
  rewrite: z.array(z.object({ question: z.string(), why: z.string() })),
});

export type TeachingReport = z.infer<typeof teachingReportSchema>;

const MODEL = "claude-opus-5-5";
const MAX_TOKENS = 6000;
const PERCENT = 100;
const WEAK_SHARE = 0.5;

const SYSTEM = `You help a Pakistani school teacher act on exam results. You get per-question statistics from one exam.
Write for the teacher, in plain words, no jargon such as "discrimination index".
Name misconceptions only when the wrong answers show them: say what the candidates seem to believe, and give the numbers as evidence.
reteach_first lists at most three topics, most urgent first. rewrite lists only questions that behaved badly (strong candidates did worse, or two answers split the class).
Keep every item to one sentence.`;

function pct(share: number): string {
  return `${Math.round(share * PERCENT)}%`;
}

function describe(rows: AnalyticsRow[]): string {
  return rows
    .map((row) => {
      const options = row.options.map((option) => `${option.id.toUpperCase()}. ${option.text}`).join(" | ");
      const shares = row.topShares.map(([id, share]) => `${id.toUpperCase()} ${pct(share)}`).join(", ");
      return `Q${row.position}: ${row.body}\nOptions: ${options || "written"}\nKey: ${row.key.map((id) => id.toUpperCase()).join(", ") || "written"}\nCorrect: ${pct(row.correct)}; skipped: ${pct(row.skipped)}; top-minus-bottom: ${row.discrimination.toFixed(2)}; labelled ${row.label}, behaved ${row.behaved}\nTop scorers chose: ${shares}`;
    })
    .join("\n\n");
}

// Built from the same numbers, so demo mode still says something true about this exam.
function recordedReport(rows: AnalyticsRow[]): TeachingReport {
  const weakest = [...rows].sort((a, b) => a.correct - b.correct).slice(0, 2);
  const misfires = rows.filter((row) => row.discrimination < 0.2);
  return {
    headline: `${rows.filter((row) => row.correct < WEAK_SHARE).length} of ${rows.length} questions were answered correctly by fewer than half the class.`,
    misconceptions: weakest.map((row) => ({
      question: `Q${row.position}`,
      what_they_think: `Many chose ${row.topShares.slice().sort((a, b) => b[1] - a[1])[0]?.[0].toUpperCase() ?? "another option"} instead of the key.`,
      evidence: `Only ${pct(row.correct)} answered correctly.`,
    })),
    reteach_first: weakest.map((row) => row.body.split(/[.?]/)[0] ?? row.body),
    rewrite: misfires.map((row) => ({ question: `Q${row.position}`, why: "Strong and weak candidates did about the same, so it does not tell them apart." })),
  };
}

async function liveReport(examTitle: string, rows: AnalyticsRow[]): Promise<TeachingReport> {
  const client = new Anthropic();
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    output_config: { effort: "low", format: zodOutputFormat(teachingReportSchema) },
    system: SYSTEM,
    messages: [{ role: "user", content: `Exam: ${examTitle}\n\n${describe(rows)}` }],
  });
  if (response.stop_reason === "refusal" || !response.parsed_output) throw new Error(`Teaching report returned nothing (stop: ${response.stop_reason})`);
  return response.parsed_output;
}

export async function writeTeachingReport(examTitle: string, rows: AnalyticsRow[]): Promise<TeachingReport> {
  return liveOrRecorded(() => liveReport(examTitle, rows), () => recordedReport(rows));
}
