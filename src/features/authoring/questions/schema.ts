import { z } from "zod";

export const TOPIC_MAX = 60;
export const BODY_MAX = 2000;
export const MARKS_MIN = 1;
export const MARKS_MAX = 100;
export const OPTION_IDS = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;
export const OPTION_LIMITS = { single: { min: 2, max: 6 }, multiple: { min: 2, max: 8 } } as const;

export const DIFFICULTIES = ["easy", "medium", "hard"] as const;
export const KINDS = ["single", "multiple", "written"] as const;

export const KIND_LABEL: Record<(typeof KINDS)[number], string> = {
  single: "Single answer",
  multiple: "Multiple select",
  written: "Written",
};

export const DIFFICULTY_LABEL: Record<(typeof DIFFICULTIES)[number], string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

export const PARTIAL_FORMULA = "max(0, (right − wrong) / keyed) × marks";

const base = {
  topic: z.string().trim().min(1, "Give the question a topic, such as Kinematics.").max(TOPIC_MAX),
  difficulty: z.enum(DIFFICULTIES, { message: "Choose easy, medium or hard." }),
  body: z.string().trim().min(1, "Write the question.").max(BODY_MAX),
  marks: z.coerce
    .number({ message: `Marks must be a whole number from ${MARKS_MIN} to ${MARKS_MAX}.` })
    .int(`Marks must be a whole number from ${MARKS_MIN} to ${MARKS_MAX}.`)
    .min(MARKS_MIN, `Marks must be a whole number from ${MARKS_MIN} to ${MARKS_MAX}.`)
    .max(MARKS_MAX, `Marks must be a whole number from ${MARKS_MIN} to ${MARKS_MAX}.`),
};

const optionText = z.string().trim().min(1, "Every option needs text. Remove the empty ones.").max(500);

export const questionSchema = z
  .discriminatedUnion("kind", [
    z.object({ ...base, kind: z.literal("single"), options: z.array(optionText), correct: z.array(z.string()) }),
    z.object({
      ...base,
      kind: z.literal("multiple"),
      options: z.array(optionText),
      correct: z.array(z.string()),
      multiple_rule: z.enum(["all_or_nothing", "partial"]),
    }),
    z.object({ ...base, kind: z.literal("written"), rubric: z.string().trim().min(1, "Write a marking guide for the written answer.").max(BODY_MAX) }),
  ])
  .superRefine((question, ctx) => {
    if (question.kind === "written") return;
    const limits = OPTION_LIMITS[question.kind];
    if (question.options.length < limits.min || question.options.length > limits.max) {
      ctx.addIssue({ code: "custom", message: `A ${KIND_LABEL[question.kind].toLowerCase()} question needs ${limits.min} to ${limits.max} options.` });
      return;
    }
    const validIds = OPTION_IDS.slice(0, question.options.length) as readonly string[];
    const correct = question.correct.filter((id) => validIds.includes(id));
    if (question.kind === "single" && correct.length !== 1) {
      ctx.addIssue({ code: "custom", message: "A single-answer question needs exactly one correct option." });
    }
    if (question.kind === "multiple" && correct.length < 1) {
      ctx.addIssue({ code: "custom", message: "Mark at least one option as correct." });
    }
  });

export type QuestionInput = z.infer<typeof questionSchema>;

export function firstLine(text: string): string {
  return text.split("\n")[0] ?? text;
}

export function questionColumns(input: QuestionInput) {
  const shared = { topic: input.topic, difficulty: input.difficulty, kind: input.kind, body: input.body, marks: input.marks };
  if (input.kind === "written") {
    return { ...shared, options: [], answer_key: null, multiple_rule: "partial", rubric: input.rubric };
  }
  const options = input.options.map((text, index) => ({ id: OPTION_IDS[index], text }));
  const validIds = options.map((option) => option.id as string);
  return {
    ...shared,
    options,
    answer_key: input.correct.filter((id) => validIds.includes(id)).sort(),
    multiple_rule: input.kind === "multiple" ? input.multiple_rule : "partial",
    rubric: null,
  };
}
