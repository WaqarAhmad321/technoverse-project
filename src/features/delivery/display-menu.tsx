"use client";

import { Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { WorkspacePrefs } from "./display-settings";

const GROUPS: { key: keyof WorkspacePrefs; label: string; options: { value: string; label: string }[] }[] = [
  { key: "font_scale", label: "Text size", options: [{ value: "normal", label: "Normal" }, { value: "large", label: "Large" }, { value: "larger", label: "Larger" }] },
  { key: "contrast", label: "Contrast", options: [{ value: "normal", label: "Normal" }, { value: "high", label: "High" }] },
  { key: "layout", label: "Layout", options: [{ value: "one_at_a_time", label: "One question at a time" }, { value: "all_on_one_page", label: "All on one page" }] },
];

// Display settings live in one menu; they are saved to the account, so they follow the candidate to any phone.
export function DisplayMenu({ prefs, onChange }: { prefs: WorkspacePrefs; onChange: (next: WorkspacePrefs) => void }) {
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="icon" className="size-10" aria-label="Display settings">
              <Type aria-hidden className="size-5" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Display settings</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-64">
        {GROUPS.map((group, groupIndex) => (
          <div key={group.key}>
            {groupIndex > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel className="text-sm text-muted-foreground">{group.label}</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={prefs[group.key]} onValueChange={(value) => onChange({ ...prefs, [group.key]: value })}>
              {group.options.map((option) => (
                <DropdownMenuRadioItem key={option.value} value={option.value}>
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
