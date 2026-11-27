import type { Exam, Question } from "@/lib/exam-types";
import { plural } from "../format";

export type ChecklistQuestion = Pick<Question, "id" | "body" | "kind" | "marks" | "options" | "answer_key" | "rubric">;

export type ChecklistInput = {
  exam: Pick<Exam, "opens_at" | "closes_at" | "duration_minutes" | "total_marks">;
  questions: ChecklistQuestion[];
  enrolledCount: number;
};

export type CheckLine = { id: string; ok: boolean; text: string; fix?: string };

export type Checklist = { lines: CheckLine[]; warnings: string[]; canPublish: boolean };

const MS_PER_MINUTE = 60 * 1000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;
// Pakistan is UTC+5 all year, so shifting by the offset gives wall-clock time in UTC fields.
const PAKISTAN_OFFSET_MS = 5 * MS_PER_HOUR;
const FRIDAY = 5;
const JUMUAH_START_MINUTES = 12 * 60 + 30;
const JUMUAH_END_MINUTES = 14 * 60 + 30;
const LATE_NIGHT_HOUR = 22;
const EARLY_MORNING_HOUR = 6;

function keyIsValid(question: ChecklistQuestion): boolean {
  if (question.kind === "written") return (question.rubric ?? "").trim().length > 0;
  const key = question.answer_key ?? [];
  const optionIds = new Set(question.options.map((option) => option.id));
  const allKnown = key.length > 0 && key.every((id) => optionIds.has(id));
  return question.kind === "single" ? allKnown && key.length === 1 : allKnown;
}

function marksLine({ exam, questions }: ChecklistInput): CheckLine {
  const sum = questions.reduce((total, question) => total + question.marks, 0);
  if (sum === exam.total_marks) return { id: "marks", ok: true, text: `Questions add up to ${exam.total_marks} marks` };
  return {
    id: "marks",
    ok: false,
    text: `Questions add up to ${sum} marks, the exam says ${exam.total_marks}`,
    fix: sum < exam.total_marks ? "Add questions worth the difference, or lower the total in Details." : "Remove a question, or raise the total in Details.",
  };
}

function keysLine({ questions }: ChecklistInput): CheckLine {
  const broken = questions.flatMap((question, index) => (keyIsValid(question) ? [] : [index + 1]));
  if (broken.length === 0) return { id: "keys", ok: true, text: "Every objective question has a key and every written question has a rubric" };
  return {
    id: "keys",
    ok: false,
    text: `${broken.length === 1 ? "Question" : "Questions"} ${broken.join(", ")} ${broken.length === 1 ? "has" : "have"} no valid key or rubric`,
    fix: "Open the question in the bank and set its correct answer or marking guide.",
  };
}

function windowLine({ exam }: ChecklistInput, now: Date): CheckLine {
  const opens = new Date(exam.opens_at).getTime();
  const closes = new Date(exam.closes_at).getTime();
  if (closes <= now.getTime()) {
    return { id: "window", ok: false, text: "The exam window has already closed", fix: "Move the closing time into the future in Details." };
  }
  const windowMinutes = Math.floor((closes - opens) / MS_PER_MINUTE);
  if (exam.duration_minutes > windowMinutes) {
    return {
      id: "window",
      ok: false,
      text: `The ${exam.duration_minutes}-minute exam does not fit its ${windowMinutes}-minute window`,
      fix: "Widen the window or shorten the duration in Details.",
    };
  }
  return { id: "window", ok: true, text: `The window is ${opens > now.getTime() ? "in the future" : "open"} and the ${exam.duration_minutes} minutes fit inside it` };
}

function pakistanClock(ms: number): { day: number; minutes: number } {
  const local = new Date(ms + PAKISTAN_OFFSET_MS);
  return { day: local.getUTCDay(), minutes: local.getUTCHours() * 60 + local.getUTCMinutes() };
}

function overlapsJumuah(opens: number, closes: number): boolean {
  const startOfFirstDay = opens - (pakistanClock(opens).minutes * MS_PER_MINUTE);
  for (let day = startOfFirstDay; day < closes; day += MS_PER_DAY) {
    if (pakistanClock(day).day !== FRIDAY) continue;
    const prayerStart = day + JUMUAH_START_MINUTES * MS_PER_MINUTE;
    const prayerEnd = day + JUMUAH_END_MINUTES * MS_PER_MINUTE;
    if (opens < prayerEnd && closes > prayerStart) return true;
  }
  return false;
}

function isLateNight(ms: number): boolean {
  const hour = Math.floor(pakistanClock(ms).minutes / 60);
  return hour >= LATE_NIGHT_HOUR || hour < EARLY_MORNING_HOUR;
}

// A window of a day or more lets candidates pick their own time, so prayer and night only matter for short ones.
function timingWarnings({ exam }: ChecklistInput): string[] {
  const opens = new Date(exam.opens_at).getTime();
  const closes = new Date(exam.closes_at).getTime();
  if (closes - opens >= MS_PER_DAY) return [];
  const warnings: string[] = [];
  if (overlapsJumuah(opens, closes)) warnings.push("The window runs over Jumu'ah prayers (Friday 12:30 to 2:30 pm). Many candidates will lose time.");
  if (isLateNight(opens) || isLateNight(closes)) warnings.push("The window starts or ends after 10 pm. Late-night load-shedding hits more candidates.");
  return warnings;
}

export function runChecklist(input: ChecklistInput, now: Date = new Date()): Checklist {
  const lines: CheckLine[] = [
    input.questions.length > 0
      ? { id: "questions", ok: true, text: `${plural(input.questions.length, "question")} on the paper` }
      : { id: "questions", ok: false, text: "The paper has no questions", fix: "Add questions in the Questions tab." },
    marksLine(input),
    keysLine(input),
    input.enrolledCount > 0
      ? { id: "enrolled", ok: true, text: `${plural(input.enrolledCount, "candidate")} enrolled` }
      : { id: "enrolled", ok: false, text: "Nobody is enrolled", fix: "Enroll candidates in the Candidates tab." },
    windowLine(input, now),
  ];
  return { lines, warnings: timingWarnings(input), canPublish: lines.every((line) => line.ok) };
}
