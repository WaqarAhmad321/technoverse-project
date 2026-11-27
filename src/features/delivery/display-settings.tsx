
export type WorkspacePrefs = {
  font_scale: "normal" | "large" | "larger";
  contrast: "normal" | "high";
  layout: "one_at_a_time" | "all_on_one_page";
};

export const DEFAULT_PREFS: WorkspacePrefs = { font_scale: "normal", contrast: "normal", layout: "one_at_a_time" };

export const FONT_ZOOM: Record<WorkspacePrefs["font_scale"], number> = { normal: 1, large: 1.15, larger: 1.3 };


