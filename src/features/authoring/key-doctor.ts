import type { AnswerKey, QuestionOption } from "@/lib/exam-types";

export type DoctorQuestion = {
  question_id: string;
  position: number;
  options: QuestionOption[];
  answer_key: AnswerKey;
};

// One row per finished attempt: its current total and the choices it gave for each objective question.
export type DoctorAttempt = { total: number; choices: Map<string, string[]> };

export type FlagKind = "wrong_key" | "ambiguous" | "too_few";

export type DoctorFlag = {
  question_id: string;
  position: number;
  kind: FlagKind;
  summary: string;
  difficulty: number;
  discrimination: number;
  topChoice: string | null;
  key: AnswerKey;
};

const GROUP_SHARE = 0.27;
const MIN_ATTEMPTS = 10;
const WRONG_KEY_SHARE = 0.5;
const AMBIGUOUS_SHARE = 0.3;
const PERCENT = 100;

function letter(optionId: string): string {
  return optionId.toUpperCase();
}

function isCorrect(choices: string[] | undefined, key: AnswerKey): boolean {
  if (!choices || choices.length !== key.length) return false;
  return choices.every((choice) => key.includes(choice));
}

function shareCorrect(group: DoctorAttempt[], question: DoctorQuestion): number {
  if (group.length === 0) return 0;
  return group.filter((attempt) => isCorrect(attempt.choices.get(question.question_id), question.answer_key)).length / group.length;
}

function optionShares(group: DoctorAttempt[], question: DoctorQuestion): Map<string, number> {
  const shares = new Map<string, number>();
  for (const option of question.options) {
    const chose = group.filter((attempt) => attempt.choices.get(question.question_id)?.includes(option.id)).length;
    shares.set(option.id, group.length === 0 ? 0 : chose / group.length);
  }
  return shares;
}

function diagnose(question: DoctorQuestion, top: DoctorAttempt[], bottom: DoctorAttempt[], all: DoctorAttempt[]): DoctorFlag | null {
  const difficulty = shareCorrect(all, question);
  const discrimination = shareCorrect(top, question) - shareCorrect(bottom, question);
  const shares = [...optionShares(top, question)].sort((a, b) => b[1] - a[1]);
  const base = { question_id: question.question_id, position: question.position, difficulty, discrimination, key: question.answer_key };
  const keyText = question.answer_key.map(letter).join(" and ");

  const distractor = shares.find(([id]) => !question.answer_key.includes(id));
  const keyShare = Math.max(0, ...shares.filter(([id]) => question.answer_key.includes(id)).map(([, share]) => share));
  // Top scorers preferring one wrong option over the key is the strongest sign the key itself is wrong.
  const topPreferDistractor = distractor !== undefined && distractor[1] > keyShare && distractor[1] >= AMBIGUOUS_SHARE;
  if (distractor && ((discrimination < 0 && distractor[1] > WRONG_KEY_SHARE) || topPreferDistractor)) {
    const percent = Math.round(distractor[1] * PERCENT);
    return { ...base, kind: "wrong_key", topChoice: distractor[0], summary: `Q${question.position}: ${percent}% of the top scorers chose ${letter(distractor[0])}, the key says ${keyText}.` };
  }
  const popular = shares.filter(([, share]) => share > AMBIGUOUS_SHARE);
  if (popular.length >= 2) {
    const names = popular.map(([id, share]) => `${letter(id)} (${Math.round(share * PERCENT)}%)`).join(" and ");
    const other = popular.find(([id]) => !question.answer_key.includes(id));
    return { ...base, kind: "ambiguous", topChoice: other?.[0] ?? null, summary: `Q${question.position}: the top scorers split between ${names}. Two answers may be right.` };
  }
  return null;
}

// Item analysis over finished attempts: difficulty p, discrimination D = p(top 27%) − p(bottom 27%).
export function runKeyDoctor(questions: DoctorQuestion[], attempts: DoctorAttempt[]): DoctorFlag[] {
  if (attempts.length < MIN_ATTEMPTS) {
    return questions.slice(0, 1).map((question) => ({
      question_id: question.question_id,
      position: question.position,
      kind: "too_few" as const,
      summary: `Only ${attempts.length} attempts so far. Key checks need at least ${MIN_ATTEMPTS}.`,
      difficulty: 0,
      discrimination: 0,
      topChoice: null,
      key: question.answer_key,
    }));
  }
  const ranked = [...attempts].sort((a, b) => b.total - a.total);
  const groupSize = Math.max(1, Math.round(ranked.length * GROUP_SHARE));
  const top = ranked.slice(0, groupSize);
  const bottom = ranked.slice(-groupSize);
  return questions.flatMap((question) => diagnose(question, top, bottom, ranked) ?? []);
}

export type QuestionStats = {
  question_id: string;
  position: number;
  correct: number;
  discrimination: number;
  skipped: number;
  topShares: [string, number][];
  behaved: "easy" | "medium" | "hard";
};

const EASY_ABOVE = 0.7;
const HARD_BELOW = 0.4;

export function questionStats(questions: DoctorQuestion[], attempts: DoctorAttempt[]): QuestionStats[] {
  const ranked = [...attempts].sort((a, b) => b.total - a.total);
  const groupSize = Math.max(1, Math.round(ranked.length * GROUP_SHARE));
  const top = ranked.slice(0, groupSize);
  const bottom = ranked.slice(-groupSize);
  return questions.map((question) => {
    const correct = shareCorrect(ranked, question);
    const skipped = ranked.length === 0 ? 0 : ranked.filter((attempt) => (attempt.choices.get(question.question_id) ?? []).length === 0).length / ranked.length;
    return {
      question_id: question.question_id,
      position: question.position,
      correct,
      discrimination: shareCorrect(top, question) - shareCorrect(bottom, question),
      skipped,
      topShares: [...optionShares(top, question)],
      behaved: correct > EASY_ABOVE ? "easy" : correct < HARD_BELOW ? "hard" : "medium",
    };
  });
}
