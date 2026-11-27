export type IntegritySignal = { kind: string; details: Record<string, unknown>; occurred_at: string };
export type IntegrityLevel = "none" | "low" | "review";
export type IntegrityAssessment = { level: IntegrityLevel; score: number; reasons: string[] };

const HIDDEN_COUNT_NOTABLE = 3;
const HIDDEN_COUNT_MANY = 6;
const HIDDEN_TOTAL_SECONDS_NOTABLE = 120;
const LARGE_PASTE_CHARS = 200;
const COPY_COUNT_NOTABLE = 2;
const OFFLINE_GAP_NOTABLE_SECONDS = 60;
const LEVEL_LOW_SCORE = 1;
const LEVEL_REVIEW_SCORE = 3;

function seconds(signal: IntegritySignal): number {
  return typeof signal.details.seconds === "number" ? signal.details.seconds : 0;
}

function chars(signal: IntegritySignal): number {
  return typeof signal.details.chars === "number" ? signal.details.chars : 0;
}

// Signals are for an examiner to review. They are never evidence and never an automatic penalty.
export function assessIntegrity(signals: IntegritySignal[]): IntegrityAssessment {
  const reasons: string[] = [];
  let score = 0;

  const hidden = signals.filter((signal) => signal.kind === "tab_hidden");
  const hiddenSeconds = hidden.reduce((sum, signal) => sum + seconds(signal), 0);
  if (hidden.length >= HIDDEN_COUNT_NOTABLE) {
    score += hidden.length >= HIDDEN_COUNT_MANY ? 2 : 1;
    reasons.push(`Left the exam tab ${hidden.length} times`);
  }
  if (hiddenSeconds >= HIDDEN_TOTAL_SECONDS_NOTABLE) {
    score += 1;
    reasons.push(`Away from the exam tab for ${hiddenSeconds} s in total`);
  }

  const largePastes = signals.filter((signal) => signal.kind === "paste" && chars(signal) >= LARGE_PASTE_CHARS);
  if (largePastes.length > 0) {
    score += 2 * largePastes.length;
    reasons.push(`Pasted ${largePastes.map((signal) => chars(signal)).join(", ")} characters into an answer`);
  }

  const copies = signals.filter((signal) => signal.kind === "copy");
  if (copies.length >= COPY_COUNT_NOTABLE) {
    score += 1;
    reasons.push(`Copied text from the exam ${copies.length} times`);
  }

  const silentGaps = signals.filter(
    (signal) => signal.kind === "offline" && seconds(signal) >= OFFLINE_GAP_NOTABLE_SECONDS && !signal.details.answered_offline,
  );
  if (silentGaps.length > 0) {
    score += 1;
    reasons.push(`No connection and no answers during ${silentGaps.length} gap${silentGaps.length === 1 ? "" : "s"} of a minute or more`);
  }

  const level: IntegrityLevel = score >= LEVEL_REVIEW_SCORE ? "review" : score >= LEVEL_LOW_SCORE ? "low" : "none";
  return { level, score, reasons };
}

export function describeSignal(signal: IntegritySignal): string {
  if (signal.kind === "tab_hidden") return `Left the exam tab for ${seconds(signal)} s`;
  if (signal.kind === "paste") return `Pasted ${chars(signal)} characters into an answer`;
  if (signal.kind === "copy") return `Copied ${chars(signal)} characters from the page`;
  if (signal.kind === "offline") return `No connection for ${seconds(signal)} s${signal.details.answered_offline ? ", kept answering offline" : ""}`;
  if (signal.kind === "late_answer") return "An answer arrived after submitting";
  return signal.kind;
}
