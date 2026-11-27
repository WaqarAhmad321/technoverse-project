"use client";

import { Type } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export type WorkspacePrefs = {
  font_scale: "normal" | "large" | "larger";
  contrast: "normal" | "high";
  layout: "one_at_a_time" | "all_on_one_page";
};

export const DEFAULT_PREFS: WorkspacePrefs = { font_scale: "normal", contrast: "normal", layout: "one_at_a_time" };

export const FONT_ZOOM: Record<WorkspacePrefs["font_scale"], number> = { normal: 1, large: 1.15, larger: 1.3 };

const CHOICES: { key: keyof WorkspacePrefs; label: string; options: { value: string; label: string }[] }[] = [
  { key: "font_scale", label: "Text size", options: [{ value: "normal", label: "Normal" }, { value: "large", label: "Large" }, { value: "larger", label: "Larger" }] },
  { key: "contrast", label: "Contrast", options: [{ value: "normal", label: "Normal" }, { value: "high", label: "High" }] },
  { key: "layout", label: "Layout", options: [{ value: "one_at_a_time", label: "One question at a time" }, { value: "all_on_one_page", label: "All on one page" }] },
];

export function DisplaySettings({ prefs, onChange }: { prefs: WorkspacePrefs; onChange: (next: WorkspacePrefs) => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <Button type="button" variant="ghost" className="self-start" aria-expanded={isOpen} onClick={() => setIsOpen(!isOpen)}>
        <Type aria-hidden className="size-4" />
        Display
      </Button>
      {isOpen && (
        <div className="flex flex-col gap-4 rounded-3xl bg-card p-4">
          {CHOICES.map((choice) => (
            <fieldset key={choice.key} className="flex flex-col gap-2">
              <legend className="text-sm font-medium">{choice.label}</legend>
              <div className="flex flex-wrap gap-2">
                {choice.options.map((option) => {
                  const isActive = prefs[choice.key] === option.value;
                  return (
                    <Button
                      key={option.value}
                      type="button"
                      variant={isActive ? "secondary" : "ghost"}
                      aria-pressed={isActive}
                      onClick={() => onChange({ ...prefs, [choice.key]: option.value })}
                    >
                      {option.label}
                    </Button>
                  );
                })}
              </div>
            </fieldset>
          ))}
          <p className="text-sm text-muted-foreground">Saved to your account, so they follow you to any phone.</p>
        </div>
      )}
    </div>
  );
}
