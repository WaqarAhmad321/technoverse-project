const PAKISTAN_TIME_ZONE = "Asia/Karachi";

const dateTime = new Intl.DateTimeFormat("en-GB", {
  timeZone: PAKISTAN_TIME_ZONE,
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const dateOnly = new Intl.DateTimeFormat("en-GB", {
  timeZone: PAKISTAN_TIME_ZONE,
  day: "numeric",
  month: "short",
  year: "numeric",
});

// Exam times always show in Pakistan time, whatever the device is set to.
export function formatPkt(value: string | Date): string {
  return dateTime.format(new Date(value));
}

export function formatDate(value: string | Date): string {
  return dateOnly.format(new Date(value));
}

export function formatMarks(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0$/, "");
}
