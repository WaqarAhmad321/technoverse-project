import type { AttemptQuestion, Exam, Question } from "@/lib/exam-types";

export type PaperItem = { position: number; question: Question };

export type PaperRow = Pick<
  AttemptQuestion,
  | "question_id"
  | "position"
  | "kind"
  | "body"
  | "topic"
  | "difficulty"
  | "marks"
  | "multiple_rule"
  | "rubric"
  | "options"
  | "answer_key"
  | "variant_key"
>;

const UINT32_RANGE = 4294967296;

// mulberry32: small, fast and the same on every machine, so one seed always gives one paper.
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / UINT32_RANGE;
  };
}

function shuffled<T>(items: readonly T[], random: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const current = copy[i];
    const other = copy[j];
    if (current === undefined || other === undefined) continue;
    copy[i] = other;
    copy[j] = current;
  }
  return copy;
}

type PaperVersion = Pick<Question, "body" | "options" | "answer_key"> & { variant_key: string | null };

function hashText(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  return hash >>> 0;
}

// The original counts as one of the forms, so 4 approved versions spread candidates over 5 forms.
// Its own random stream per question keeps the pick stable however the paper is shuffled.
export function pickVersion(question: Question, seed: number): PaperVersion {
  const original: PaperVersion = { body: question.body, options: question.options, answer_key: question.answer_key, variant_key: null };
  const usable = (question.variants ?? []).filter(
    (variant) => variant.status === "approved" && variant.source_version === question.version,
  );
  const pick = Math.floor(seededRandom((seed ^ hashText(question.id)) >>> 0)() * (usable.length + 1));
  const variant = usable[pick - 1];
  if (!variant) return original;
  return { body: variant.body, options: variant.options, answer_key: variant.answer_key, variant_key: variant.key };
}

export function newPaperSeed(): number {
  return Math.floor(Math.random() * 2147483647);
}

// The ordered snapshot for one attempt. Authoring may replace the selection with
// equal-difficulty papers (task umar/140), keeping this signature.
export function buildPaper(
  exam: Pick<Exam, "shuffle_questions" | "shuffle_options">,
  items: readonly PaperItem[],
  seed: number,
): PaperRow[] {
  const random = seededRandom(seed);
  const inExamOrder = [...items].sort((a, b) => a.position - b.position);
  const ordered = exam.shuffle_questions ? shuffled(inExamOrder, random) : inExamOrder;

  return ordered.map(({ question }, index) => {
    const version = pickVersion(question, seed);
    return {
      question_id: question.id,
      position: index + 1,
      kind: question.kind,
      body: version.body,
      topic: question.topic,
      difficulty: question.difficulty,
      marks: question.marks,
      multiple_rule: question.multiple_rule,
      rubric: question.rubric,
      options: exam.shuffle_options ? shuffled(version.options, random) : version.options,
      answer_key: version.answer_key,
      variant_key: version.variant_key,
    };
  });
}
