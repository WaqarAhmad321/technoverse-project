"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export const THEME_STORAGE_KEY = "imtihaan:theme";

// Runs before the page paints, so a saved light theme never flashes dark first.
export const THEME_BOOT_SCRIPT = `try{if(localStorage.getItem("${THEME_STORAGE_KEY}")==="light")document.documentElement.classList.remove("dark")}catch(e){}`;

export function ThemeToggle({ isCollapsed }: { isCollapsed: boolean }) {
  function toggle() {
    const isDark = document.documentElement.classList.toggle("dark");
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, isDark ? "dark" : "light");
    } catch {
      // The theme still switches; it just will not be remembered on this device.
    }
  }

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={toggle}
      aria-label="Switch between dark and light"
      className={isCollapsed ? "size-11 justify-center px-0" : "h-11 w-full justify-start gap-3 px-3 text-muted-foreground hover:text-foreground"}
    >
      <Sun aria-hidden className="size-5 dark:hidden" />
      <Moon aria-hidden className="hidden size-5 dark:block" />
      {!isCollapsed && <span className="text-[15px]">Dark or light</span>}
    </Button>
  );
}
