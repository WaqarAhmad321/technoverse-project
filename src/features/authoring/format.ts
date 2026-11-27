import type { ExamPhase } from "@/lib/exam-rules";

const PAKISTAN_TIME_ZONE = "Asia/Karachi";

const dateTimeFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: PAKISTAN_TIME_ZONE,
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

export function formatPakistanTime(iso: string): string {
  return dateTimeFormat.format(new Date(iso));
}

// datetime-local inputs speak Pakistan wall-clock time (UTC+5, no daylight saving).
const PAKISTAN_OFFSET = "+05:00";
const PAKISTAN_OFFSET_MS = 5 * 60 * 60 * 1000;

export function toPakistanInputValue(iso: string): string {
  return new Date(new Date(iso).getTime() + PAKISTAN_OFFSET_MS).toISOString().slice(0, 16);
}

export function fromPakistanInputValue(value: string): Date {
  return new Date(`${value}:00${PAKISTAN_OFFSET}`);
}

export const PHASE_LABEL: Record<ExamPhase, string> = {
  draft: "Draft",
  upcoming: "Upcoming",
  open: "Open now",
  closed: "Closed",
};

export function plural(count: number, one: string, many = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`;
}

export const selectClass =
  "h-11 w-full rounded-xl border border-input bg-card px-4 text-base outline-none focus-visible:ring-3 focus-visible:ring-ring";
