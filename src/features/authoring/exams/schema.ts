import { z } from "zod";

export const TITLE_MAX = 120;
export const INSTRUCTIONS_MAX = 4000;
export const DURATION_MAX_MINUTES = 600;
export const TOTAL_MARKS_MAX = 1000;
const MS_PER_MINUTE = 60_000;
const DATETIME_LOCAL = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

export const examSchema = z
  .object({
    title: z.string().trim().min(1, "Give the exam a title.").max(TITLE_MAX),
    instructions: z.string().trim().max(INSTRUCTIONS_MAX),
    opens_at: z.string().regex(DATETIME_LOCAL, "Choose when the exam opens."),
    closes_at: z.string().regex(DATETIME_LOCAL, "Choose when the exam closes."),
    duration_minutes: z.coerce
      .number({ message: "Duration must be a whole number of minutes." })
      .int("Duration must be a whole number of minutes.")
      .min(1, "Duration must be at least 1 minute.")
      .max(DURATION_MAX_MINUTES, `Duration can be at most ${DURATION_MAX_MINUTES} minutes.`),
    total_marks: z.coerce
      .number({ message: "Total marks must be a whole number." })
      .int("Total marks must be a whole number.")
      .min(1, "Total marks must be more than 0.")
      .max(TOTAL_MARKS_MAX),
    shuffle_questions: z.boolean(),
    shuffle_options: z.boolean(),
  })
  .superRefine((exam, ctx) => {
    // Both values are Pakistan wall-clock times in the same format, so comparing them as text is safe.
    const opens = Date.parse(`${exam.opens_at}:00Z`);
    const closes = Date.parse(`${exam.closes_at}:00Z`);
    if (closes <= opens) {
      ctx.addIssue({ code: "custom", message: "The closing time must be after the opening time." });
      return;
    }
    if (exam.duration_minutes * MS_PER_MINUTE > closes - opens) {
      ctx.addIssue({ code: "custom", message: "The duration must fit inside the window between opening and closing." });
    }
  });

export type ExamInput = z.infer<typeof examSchema>;

export function readExamForm(formData: FormData): unknown {
  return {
    title: formData.get("title") ?? "",
    instructions: formData.get("instructions") ?? "",
    opens_at: formData.get("opens_at") ?? "",
    closes_at: formData.get("closes_at") ?? "",
    duration_minutes: formData.get("duration_minutes") ?? "",
    total_marks: formData.get("total_marks") ?? "",
    shuffle_questions: formData.get("shuffle_questions") === "on",
    shuffle_options: formData.get("shuffle_options") === "on",
  };
}
