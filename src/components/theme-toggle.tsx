"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export const THEME_STORAGE_KEY = "imtihaan:theme";

// Runs before the page paints, so a saved light theme never flashes dark first.
export const THEME_BOOT_SCRIPT = `try{if(localStorage.getItem("${THEME_STORAGE_KEY}")==="light")document.documentElement.classList.remove("dark")}catch(e){}`;

// One icon button: it shows the theme you would switch to, like most Google products.
export function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    root.classList.add("theme-switching");
    const isDark = root.classList.toggle("dark");
    window.setTimeout(() => root.classList.remove("theme-switching"), 300);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, isDark ? "dark" : "light");
    } catch {
      // The theme still switches; it just will not be remembered on this device.
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="size-10 shrink-0" aria-label="Switch dark or light theme" onClick={toggle}>
          <Sun aria-hidden className="hidden size-5 dark:block" />
          <Moon aria-hidden className="size-5 dark:hidden" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">
        <span className="hidden dark:inline">Light theme</span>
        <span className="dark:hidden">Dark theme</span>
      </TooltipContent>
    </Tooltip>
  );
}
