import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { liveOrRecorded } from "@/lib/demo";
import type { AnswerKey, Exam, Question } from "@/lib/exam-types";
import { OPTION_IDS } from "../questions/schema";

const MODEL = "claude-opus-5-5";
const MAX_TOKENS = 16000;

export type ModeratorFlag = {
  question_id: string;
  position: number;
  kind: "key" | "ambiguous" | "syllabus";
  note: string;
  dismissed: boolean;
};

export type Moderation = { ran_at: string; syllabus: string; flags: ModeratorFlag[] };

// The last moderator run lives in exams.settings.moderation, so it needs no table of its own.
export function readModeration(exam: Pick<Exam, "settings">): Moderation | null {
  const value = exam.settings?.moderation;
  return value && typeof value === "object" ? (value as Moderation) : null;
}

export type ModeratedQuestion =Pick<Question, "id" | "kind" | "body" | "options" | "answer_key" | "topic"> & { position: number };

const reviewSchema = z.object({
  questions: z.array(
    z.object({
      position: z.number(),
      my_answer: z.array(z.string()),
      ambiguous: z.boolean(),
      ambiguity_note: z.string(),
      in_syllabus: z.boolean(),
      syllabus_note: z.string(),
    }),
  ),
});

type Review = z.infer<typeof reviewSchema>["questions"][number];

const SYSTEM = `You are the paper moderator for a Pakistani board-style exam. You see the paper exactly as candidates will, without the answer key.
For every question: answer it yourself (letters of the correct options; [] for a written question); say whether a careful student could reasonably read it two ways or argue for a second option, and why in one sentence; and say whether it is covered by the syllabus given (if no syllabus is given, in_syllabus is true).
Notes are one plain sentence an examiner can act on. Do not flag harmless style issues.`;

function paperText(questions: ModeratedQuestion[], syllabus: string): string {
  const paper = questions
    .map((question) => {
      const options = question.options.map((option, index) => `   ${OPTION_IDS[index] ?? option.id}) ${option.text}`).join("\n");
      const how = question.kind === "single" ? "one correct option" : question.kind === "multiple" ? "one or more correct options" : "written answer";
      return `Q${question.position} (${how}, topic ${question.topic}):\n${question.body}${options ? `\n${options}` : ""}`;
    })
    .join("\n\n");
  return `Syllabus:\n${syllabus.trim() || "(none given)"}\n\nPaper:\n${paper}`;
}

function sameKey(a: AnswerKey, b: AnswerKey): boolean {
  return [...a].sort().join(",") === [...b].sort().join(",");
}

function letters(key: AnswerKey): string {
  return key.map((id) => id.toUpperCase()).join(" and ");
}

function toFlags(questions: ModeratedQuestion[], reviews: Review[]): ModeratorFlag[] {
  const byPosition = new Map(reviews.map((review) => [review.position, review]));
  return questions.flatMap((question) => {
    const review = byPosition.get(question.position);
    if (!review) return [];
    const flag = (kind: ModeratorFlag["kind"], note: string): ModeratorFlag => ({
      question_id: question.id,
      position: question.position,
      kind,
      note,
      dismissed: false,
    });
    const flags: ModeratorFlag[] = [];
    const key = question.answer_key ?? [];
    const mine = review.my_answer.map((id) => id.toLowerCase());
    if (question.kind !== "written" && mine.length > 0 && !sameKey(mine, key)) {
      flags.push(flag("key", `Q${question.position}: I get ${letters(mine)}, your key says ${letters(key)}.`));
    }
    if (review.ambiguous) flags.push(flag("ambiguous", `Q${question.position}: ${review.ambiguity_note}`));
    if (!review.in_syllabus) flags.push(flag("syllabus", `Q${question.position}: ${review.syllabus_note}`));
    return flags;
  });
}

async function liveReview(questions: ModeratedQuestion[], syllabus: string): Promise<Review[]> {
  const client = new Anthropic();
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    output_config: { effort: "medium", format: zodOutputFormat(reviewSchema) },
    system: SYSTEM,
    messages: [{ role: "user", content: paperText(questions, syllabus) }],
  });
  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw new Error(`Paper moderator returned nothing (stop: ${response.stop_reason})`);
  }
  return response.parsed_output.questions;
}

const CIRCULAR_MOTION = "A body moves in a circle at a constant speed";
const NEWTON_THIRD = "By Newton's third law";

// Recorded answers for demo mode and the check: agrees with every key except the seeded wrong one, flags one
// wording the research shows students argue about, and treats a topic missing from the syllabus as outside it.
function recordedReview(questions: ModeratedQuestion[], syllabus: string): Review[] {
  const outline = syllabus.toLowerCase();
  return questions.map((question) => ({
    position: question.position,
    my_answer: question.body.startsWith(CIRCULAR_MOTION) ? ["b"] : (question.answer_key ?? []),
    ambiguous: question.body.startsWith(NEWTON_THIRD),
    ambiguity_note: "“pushes back” could mean the wall moves; say “exerts a force on you” instead.",
    in_syllabus: outline.trim() === "" || outline.includes(question.topic.toLowerCase()),
    syllabus_note: `${question.topic} is not in the syllabus you pasted.`,
  }));
}

export function isModeratorAvailable(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY) || process.env.DEMO_MODE === "1";
}

export async function moderatePaper(questions: ModeratedQuestion[], syllabus: string): Promise<ModeratorFlag[]> {
  const reviews = await liveOrRecorded(
    () => liveReview(questions, syllabus),
    () => recordedReview(questions, syllabus),
  );
  return toFlags(questions, reviews);
}
