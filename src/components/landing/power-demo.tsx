"use client";

import { Check, Clock, PlugZap, Unplug, WifiOff } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const OPTIONS = ["25 m/s", "52 m/s", "100 m/s", "200 m/s"];
const CORRECT_INDEX = 2;

// The hero's argument, played by the visitor: cut the power, keep answering, watch it sync.
export function PowerDemo() {
  const [isOffline, setIsOffline] = useState(false);
  const [chosen, setChosen] = useState<number | null>(null);
  const [keptOnPhone, setKeptOnPhone] = useState(0);
  const [justSynced, setJustSynced] = useState(false);

  function choose(index: number) {
    setChosen(index);
    setJustSynced(false);
    if (isOffline) setKeptOnPhone((count) => count + 1);
  }

  function togglePower() {
    if (isOffline && keptOnPhone > 0) setJustSynced(true);
    if (isOffline) setKeptOnPhone(0);
    setIsOffline(!isOffline);
  }

  return (
    <div className="relative">
      <div className="rounded-[2rem] bg-card p-5 shadow-2xl shadow-black/20 ring-1 ring-border md:p-7">
        <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
          <div className="flex flex-col">
            <span className="text-sm text-muted-foreground">Waves Practice Quiz · Question 2 of 5</span>
            <span className="text-sm text-muted-foreground">Ayesha Khan · BS Physics A</span>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 font-mono text-base tabular-nums">
            <Clock aria-hidden className="size-4" />
            12:40
          </span>
        </div>
        <p className="mt-5 text-lg leading-7 font-medium">A wave has a frequency of 50 Hz and a wavelength of 2 m. What is its speed?</p>
        <div className="mt-4 space-y-2" role="radiogroup" aria-label="Options">
          {OPTIONS.map((option, index) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={chosen === index}
              onClick={() => choose(index)}
              className={cn(
                "flex min-h-12 w-full items-center gap-3 rounded-xl bg-muted px-4 text-left text-base transition-colors duration-200 ease-out hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none",
                chosen === index && "bg-primary/10 ring-2 ring-primary",
              )}
            >
              <span className="w-4 text-sm text-muted-foreground">{String.fromCharCode(65 + index)}</span>
              {option}
              {chosen === index && index === CORRECT_INDEX && <span className="sr-only">(selected)</span>}
            </button>
          ))}
        </div>
        <div
          aria-live="polite"
          className={cn(
            "mt-5 flex items-center gap-2 rounded-full px-4 py-2.5 text-sm transition-colors duration-300",
            isOffline ? "bg-foreground text-background" : "bg-primary/10 text-foreground",
          )}
        >
          {isOffline ? (
            <>
              <WifiOff aria-hidden className="size-4" />
              {keptOnPhone > 0
                ? `Offline: ${keptOnPhone} ${keptOnPhone === 1 ? "answer" : "answers"} kept on this phone`
                : "Offline: keep going, answers stay on this phone"}
            </>
          ) : (
            <>
              <Check aria-hidden className="size-4 text-primary" />
              {justSynced ? "Back online. Every answer reached the server." : "All answers saved"}
            </>
          )}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button type="button" variant={isOffline ? "default" : "outline"} onClick={togglePower} aria-pressed={isOffline}>
          {isOffline ? <PlugZap aria-hidden className="size-4" /> : <Unplug aria-hidden className="size-4" />}
          {isOffline ? "Bring the power back" : "Cut the power"}
        </Button>
        <span className="text-sm text-muted-foreground">
          {isOffline ? "Pick another answer. Nothing is lost." : "Try it: load-shedding, mid-exam."}
        </span>
      </div>
    </div>
  );
}
