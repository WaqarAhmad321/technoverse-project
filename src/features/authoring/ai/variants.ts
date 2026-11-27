import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { liveOrRecorded } from "@/lib/demo";
import type { AnswerKey, Question, QuestionVariant } from "@/lib/exam-types";
import { OPTION_IDS } from "../questions/schema";
import { recordedVariants } from "./variants-recorded";

const MODEL = "claude-opus-5-5";
const MAX_TOKENS = 16000;
export const VARIANTS_PER_RUN = 4;

const draftSchema = z.object({
  variants: z.array(
    z.object({
      body: z.string(),
      options: z.array(z.string()),
      correct: z.array(z.string()),
    }),
  ),
});

const solveSchema = z.object({ choices: z.array(z.string()) });

type Draft = { body: string; options: string[]; correct: AnswerKey };
export type VariantRun = { kept: QuestionVariant[]; dropped: number };

const WRITER = `You write alternative versions of one exam question for a Pakistani college, so that each candidate can get a different but equally fair question.
Every version must test exactly the same concept and skill at the same difficulty, with the same number of options and the same number of correct options.
Change the situation, the names and the numbers; set it in everyday Pakistani life where it fits (cities, transport, cricket, load-shedding, bazaars).
Wrong options come from the mistakes students really make. Each version stands alone and never mentions the original.
Write option texts without letters in front; correct lists the letters of the correct options (a, b, c, ...) by their order. Work out every answer carefully before you write it.`;

const SOLVER = `You are sitting an exam. Solve the question carefully and return the letters of every correct option, and nothing you are unsure of.`;

function lettered(options: string[]): string {
  return options.map((text, index) => `${OPTION_IDS[index]}) ${text}`).join("\n");
}

function sameKey(a: AnswerKey, b: AnswerKey): boolean {
  return [...a].sort().join(",") === [...b].sort().join(",");
}

async function writeDrafts(client: Anthropic, question: Question): Promise<Draft[]> {
  const original = `Question (${question.kind === "single" ? "exactly one correct option" : "one or more correct options"}, ${question.difficulty}, topic ${question.topic}):
${question.body}
${lettered(question.options.map((option) => option.text))}
Correct: ${(question.answer_key ?? []).join(", ")}

Write ${VARIANTS_PER_RUN} versions.`;
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    output_config: { effort: "medium", format: zodOutputFormat(draftSchema) },
    system: WRITER,
    messages: [{ role: "user", content: original }],
  });
  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw new Error(`Variant writer returned nothing (stop: ${response.stop_reason})`);
  }
  return response.parsed_output.variants.map((draft) => ({ ...draft, correct: draft.correct.map((id) => id.toLowerCase()) }));
}

// Never sees the key: an independent candidate.
async function solve(client: Anthropic, draft: Draft, kind: Question["kind"]): Promise<AnswerKey> {
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    output_config: { effort: "low", format: zodOutputFormat(solveSchema) },
    system: SOLVER,
    messages: [
      {
        role: "user",
        content: `${kind === "single" ? "Choose exactly one option." : "Choose every correct option."}\n\n${draft.body}\n${lettered(draft.options)}`,
      },
    ],
  });
  if (response.stop_reason === "refusal" || !response.parsed_output) return [];
  return response.parsed_output.choices.map((id) => id.toLowerCase());
}

function isWellFormed(draft: Draft, question: Question): boolean {
  const ids = OPTION_IDS.slice(0, draft.options.length) as readonly string[];
  const correctIsValid = draft.correct.length > 0 && draft.correct.every((id) => ids.includes(id));
  const countMatches = draft.options.length === question.options.length;
  const singleHasOne = question.kind !== "single" || draft.correct.length === 1;
  return draft.body.trim().length > 0 && correctIsValid && countMatches && singleHasOne;
}

// The model sometimes writes "a) 500 N"; the letter is added by the screen.
function withoutLetter(text: string): string {
  return text.trim().replace(/^[a-h][).:]\s+/i, "");
}

function toVariant(draft: Draft, question: Question, solves: AnswerKey[], index: number): QuestionVariant {
  return {
    key: `v${Date.now().toString(36)}${index}`,
    body: draft.body.trim(),
    options: draft.options.map((text, optionIndex) => ({ id: OPTION_IDS[optionIndex] ?? "a", text: withoutLetter(text) })),
    answer_key: [...draft.correct].sort(),
    status: "proposed",
    source_version: question.version,
    solves,
  };
}

// A version is kept only when two separate solves, blind to the key, both land on its key.
async function liveVariants(question: Question): Promise<VariantRun> {
  const client = new Anthropic();
  const drafts = (await writeDrafts(client, question)).filter((draft) => isWellFormed(draft, question));
  const checked = await Promise.all(
    drafts.map(async (draft, index) => {
      const solves = await Promise.all([solve(client, draft, question.kind), solve(client, draft, question.kind)]);
      const agrees = solves.every((choices) => sameKey(choices, draft.correct));
      return agrees ? toVariant(draft, question, solves, index) : null;
    }),
  );
  const kept = checked.filter((variant): variant is QuestionVariant => variant !== null);
  return { kept, dropped: VARIANTS_PER_RUN - kept.length };
}

function recorded(question: Question): VariantRun {
  const drafts = recordedVariants(question.body);
  const kept = drafts.map((draft, index) => toVariant(draft, question, [draft.correct, draft.correct], index));
  return { kept, dropped: 0 };
}

export function isVariantWriterAvailable(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY) || process.env.DEMO_MODE === "1";
}

export async function writeVariants(question: Question): Promise<VariantRun> {
  return liveOrRecorded(() => liveVariants(question), () => recorded(question));
}
