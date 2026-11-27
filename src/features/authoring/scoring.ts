import type { AnswerResponse, AttemptQuestion, KeyFix } from "@/lib/exam-types";

export type ScoringSnapshot = Pick<AttemptQuestion, "kind" | "marks" | "multiple_rule" | "answer_key">;
export type ScoringFix = Pick<KeyFix, "decision" | "old_key" | "new_key">;

const HUNDREDTHS = 100;

function round2(value: number): number {
  return Math.round(value * HUNDREDTHS) / HUNDREDTHS;
}

function scoreAgainstKey(snapshot: ScoringSnapshot, choices: string[], key: string[]): number {
  if (key.length === 0) return 0;
  if (snapshot.kind === "single") return choices.length === 1 && key.includes(choices[0]) ? snapshot.marks : 0;
  const right = choices.filter((choice) => key.includes(choice)).length;
  const wrong = choices.length - right;
  if (snapshot.multiple_rule === "all_or_nothing") return right === key.length && wrong === 0 ? snapshot.marks : 0;
  return round2(Math.max(0, (right - wrong) / key.length) * snapshot.marks);
}

// Marks for one objective answer. A key fix, when there is one, overrides the key the candidate's paper was built with.
export function scoreObjective(snapshot: ScoringSnapshot, response: AnswerResponse | null, fix?: ScoringFix | null): number {
  const choices = response?.choices ?? [];
  const key = snapshot.answer_key ?? [];
  if (!fix) return scoreAgainstKey(snapshot, choices, key);
  switch (fix.decision) {
    case "drop":
      return 0;
    case "full_marks":
      return snapshot.marks;
    case "change_key":
      return scoreAgainstKey(snapshot, choices, fix.new_key ?? key);
    case "accept_both":
      return Math.max(scoreAgainstKey(snapshot, choices, fix.old_key ?? key), scoreAgainstKey(snapshot, choices, fix.new_key ?? []));
  }
}
