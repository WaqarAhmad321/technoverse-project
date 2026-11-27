import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { liveOrRecorded } from "@/lib/demo";

export const aiMarkSchema = z.object({
  lines: z.array(z.object({ criterion: z.string(), awarded: z.number(), quote: z.string() })),
  marks_awarded: z.number(),
  summary: z.string(),
});

export type AiMark = z.infer<typeof aiMarkSchema>;
export type WrittenToMark = { body: string; rubric: string; marks: number; answer: string };

const MODEL = "claude-opus-5-5";
const MAX_TOKENS = 4000;
const HALF = 2;

const SYSTEM = `You are a careful second marker for a Pakistani board exam. Mark the candidate's written answer strictly against the rubric, line by line.
For each rubric line give the marks earned and quote the exact words from the answer that earned them, or "" if nothing earned it.
Do not reward anything the rubric does not ask for. Marks are in steps of 0.5 and never exceed the question's total.
The summary is one plain sentence an examiner can read in five seconds.`;

function clampToHalfSteps(value: number, max: number): number {
  return Math.min(max, Math.max(0, Math.round(value * HALF) / HALF));
}

// Recorded answer for demo mode and the check: credits the first rubric line only, so the gap rule is visible.
function recordedMark(item: WrittenToMark): AiMark {
  const awarded = clampToHalfSteps(item.marks / 2, item.marks);
  const firstWords = item.answer.split(/\s+/).slice(0, 8).join(" ");
  return {
    lines: [{ criterion: item.rubric.split(/\.\s/)[0] ?? item.rubric, awarded, quote: firstWords }],
    marks_awarded: awarded,
    summary: `Earns ${awarded} of ${item.marks}: the main idea is there, the working is not.`,
  };
}

async function liveMark(item: WrittenToMark): Promise<AiMark> {
  const client = new Anthropic();
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    output_config: { effort: "low", format: zodOutputFormat(aiMarkSchema) },
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: `Question (${item.marks} marks):\n${item.body}\n\nRubric:\n${item.rubric}\n\nCandidate's answer:\n${item.answer || "(blank)"}`,
      },
    ],
  });
  const parsed = response.parsed_output;
  if (response.stop_reason === "refusal" || !parsed) throw new Error(`AI second marker returned no mark (stop: ${response.stop_reason})`);
  return { ...parsed, marks_awarded: clampToHalfSteps(parsed.marks_awarded, item.marks) };
}

export function isAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY) || process.env.DEMO_MODE === "1";
}

export async function aiMarkWritten(item: WrittenToMark): Promise<AiMark> {
  return liveOrRecorded(() => liveMark(item), () => recordedMark(item));
}
