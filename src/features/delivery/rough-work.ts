export type RoughWork = { notes: string; sketch: string };

// Stored as one text field: JSON for notes plus a sketch, plain text from before sketches existed.
export function decodeRoughWork(body: string | undefined): RoughWork {
  if (!body) return { notes: "", sketch: "" };
  try {
    const parsed: unknown = JSON.parse(body);
    if (typeof parsed === "object" && parsed !== null) {
      const record = parsed as Record<string, unknown>;
      return {
        notes: typeof record.notes === "string" ? record.notes : "",
        sketch: typeof record.sketch === "string" ? record.sketch : "",
      };
    }
  } catch {
    // Plain notes from an older save.
  }
  return { notes: body, sketch: "" };
}

export function encodeRoughWork(work: RoughWork): string {
  return JSON.stringify(work);
}
