"use client";

import { Check, CircleAlert } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type CheckLine = { ok: boolean; text: string };

const SLOW_MS = 1_500;
const CLOCK_DRIFT_NOTE_SECONDS = 60;
const MS_PER_SECOND = 1_000;

async function runChecks(): Promise<CheckLine[]> {
  const lines: CheckLine[] = [];
  try {
    const sentAt = Date.now();
    const response = await fetch("/api/time", { cache: "no-store" });
    const roundTripMs = Date.now() - sentAt;
    const body: unknown = await response.json();
    const serverNow = typeof body === "object" && body !== null ? (body as Record<string, unknown>).server_now : null;
    lines.push(
      roundTripMs > SLOW_MS
        ? { ok: true, text: `Your connection is slow (${roundTripMs} ms). Answers will still be kept on this phone and sent.` }
        : { ok: true, text: `The exam server answers in ${roundTripMs} ms.` },
    );
    if (typeof serverNow === "string") {
      const driftSeconds = Math.round(Math.abs(Date.now() - Date.parse(serverNow)) / MS_PER_SECOND);
      lines.push({
        ok: true,
        text:
          driftSeconds > CLOCK_DRIFT_NOTE_SECONDS
            ? `Your device clock is ${driftSeconds} s off. That is fine: the timer follows the exam server.`
            : "Your device clock matches the server. Either way, the timer follows the server.",
      });
    }
  } catch {
    lines.push({ ok: false, text: "We could not reach the exam server. Check your connection and try again." });
  }
  try {
    window.localStorage.setItem("imtihaan:check", "1");
    window.localStorage.removeItem("imtihaan:check");
    lines.push({ ok: true, text: "This phone can keep your answers if the connection drops." });
  } catch {
    lines.push({ ok: false, text: "This browser blocks storage, so answers cannot be kept offline. Leave private mode if you can." });
  }
  return lines;
}

export function SystemCheck() {
  const [lines, setLines] = useState<CheckLine[] | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  async function check() {
    setIsRunning(true);
    setLines(await runChecks());
    setIsRunning(false);
  }

  return (
    <section className="flex flex-col gap-3 rounded-3xl bg-card p-6">
      <h2 className="text-xl font-medium">Check your device</h2>
      {lines && (
        <ul className="flex flex-col gap-2" aria-live="polite">
          {lines.map((line) => (
            <li key={line.text} className="flex items-start gap-2 text-base">
              {line.ok ? <Check aria-hidden className="mt-1 size-4 shrink-0 text-primary" /> : <CircleAlert aria-hidden className="mt-1 size-4 shrink-0 text-destructive" />}
              {line.text}
            </li>
          ))}
        </ul>
      )}
      <Button type="button" variant="outline" size="lg" className="self-start" disabled={isRunning} onClick={() => void check()}>
        {isRunning ? "Checking…" : lines ? "Check again" : "Check my device"}
      </Button>
    </section>
  );
}
