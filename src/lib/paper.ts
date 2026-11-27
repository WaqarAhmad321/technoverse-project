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

  return ordered.map(({ question }, index) => ({
    question_id: question.id,
    position: index + 1,
    kind: question.kind,
    body: question.body,
    topic: question.topic,
    difficulty: question.difficulty,
    marks: question.marks,
    multiple_rule: question.multiple_rule,
    rubric: question.rubric,
    options: exam.shuffle_options ? shuffled(question.options, random) : question.options,
    answer_key: question.answer_key,
  }));
}
