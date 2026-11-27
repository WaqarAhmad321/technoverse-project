export type LeakAttempt = { attempt_id: string; roll: string; order: string[] };
export type LeakQuestion = { question_id: string; body: string };
export type LeakMatch = { attempt_id: string; roll: string; agree: number; matched: number; share: number };

const SNIPPET_CHARS = 40;

function normalise(text: string): string {
  return text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

// Where each exam question appears in the pasted text, in the order it appears.
export function questionsInPaste(paste: string, questions: LeakQuestion[]): string[] {
  const haystack = normalise(paste);
  return questions
    .map((question) => ({ id: question.question_id, at: haystack.indexOf(normalise(question.body).slice(0, SNIPPET_CHARS)) }))
    .filter((hit) => hit.at >= 0)
    .sort((a, b) => a.at - b.at)
    .map((hit) => hit.id);
}

function longestCommonSubsequence(a: string[], b: string[]): number {
  const table = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      table[i][j] = a[i - 1] === b[j - 1] ? table[i - 1][j - 1] + 1 : Math.max(table[i - 1][j], table[i][j - 1]);
    }
  }
  return table[a.length][b.length];
}

// Ranks attempts by how much of the pasted order they share: a leak keeps its source's question order.
export function rankAttempts(pasteOrder: string[], attempts: LeakAttempt[]): LeakMatch[] {
  const pasted = new Set(pasteOrder);
  return attempts
    .map((attempt) => {
      const order = attempt.order.filter((id) => pasted.has(id));
      const agree = longestCommonSubsequence(pasteOrder, order);
      return { attempt_id: attempt.attempt_id, roll: attempt.roll, agree, matched: pasteOrder.length, share: pasteOrder.length ? agree / pasteOrder.length : 0 };
    })
    .sort((a, b) => b.share - a.share);
}
