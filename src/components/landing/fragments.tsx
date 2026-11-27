import { Check, CircleAlert, Clock, Fingerprint, ShieldAlert, WifiOff } from "lucide-react";
import type { ReactNode } from "react";

// Small pieces of the real interface, drawn with static sample data.
function Fragment({ label, children }: { label: string; children: ReactNode }) {
  return (
    <figure className="flex flex-col gap-3 rounded-3xl bg-card p-4 md:p-6">
      <div className="flex flex-col gap-4">{children}</div>
      <figcaption className="text-sm text-muted-foreground">{label}</figcaption>
    </figure>
  );
}

const ANSWERS = [
  { q: "Q4", text: "Net force on the block" },
  { q: "Q5", text: "Time to reach the ground" },
  { q: "Q6", text: "Which circuit is in series" },
] as const;

export function OfflineFragment() {
  return (
    <Fragment label="The candidate's workspace during a power cut. Sample data.">
      <div className="flex items-center justify-between gap-3 rounded-full bg-muted px-4 py-2.5">
        <span className="flex items-center gap-2 text-sm font-medium">
          <WifiOff aria-hidden className="size-4 shrink-0" />
          Offline: 3 answers kept on this phone
        </span>
        <span className="font-mono text-sm tabular-nums text-muted-foreground">38:12</span>
      </div>
      <ul className="flex flex-col gap-2">
        {ANSWERS.map((a) => (
          <li key={a.q} className="flex items-center justify-between gap-3 rounded-xl bg-muted/60 px-4 py-3">
            <span className="min-w-0 truncate text-base">
              <span className="font-medium">{a.q}</span> <span className="text-muted-foreground">{a.text}</span>
            </span>
            <span className="flex shrink-0 items-center gap-1.5 text-sm text-muted-foreground">
              <Check aria-hidden className="size-4" />
              <span className="hidden sm:inline">kept on this phone</span>
            </span>
          </li>
        ))}
      </ul>
      <div className="flex items-start gap-3 rounded-2xl bg-muted/60 p-4 text-base">
        <Clock aria-hidden className="mt-1 size-4 shrink-0 text-muted-foreground" />
        <p>Power was out for 4 min 12 s. You kept answering, so your clock ran as normal and nothing is added or taken away.</p>
      </div>
    </Fragment>
  );
}

const TIME_BACK_OUTCOMES = [
  { who: "Ayesha kept answering offline", result: "No time added. Her clock ran as normal.", icon: Check },
  { who: "Hamza could not open the paper for 6 min", result: "6 min credited, waiting for the examiner's approval (over 5 min).", icon: Clock },
] as const;

export function TimeBackFragment() {
  return (
    <Fragment label="Fair time back after the same outage, as the examiner sees it. Sample data.">
      <p className="text-lg font-medium leading-snug">Power cut at 11:42, back at 11:48</p>
      <ul className="flex flex-col gap-2">
        {TIME_BACK_OUTCOMES.map(({ who, result, icon: Icon }) => (
          <li key={who} className="flex items-start gap-3 rounded-2xl bg-muted/60 p-4">
            <Icon aria-hidden className="mt-1 size-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-base font-medium">{who}</p>
              <p className="text-base text-muted-foreground">{result}</p>
            </div>
          </li>
        ))}
      </ul>
    </Fragment>
  );
}

const TOP_SCORER_CHOICES = [
  { option: "A", percent: 12, key: false },
  { option: "B", percent: 71, key: false },
  { option: "C", percent: 9, key: true },
  { option: "D", percent: 8, key: false },
] as const;

export function KeyDoctorFragment() {
  return (
    <Fragment label="Key Doctor on Physics Quiz 1, before results are published. Sample data.">
      <div className="flex items-start gap-3">
        <CircleAlert aria-hidden className="mt-1 size-5 shrink-0" />
        <div>
          <p className="text-lg font-medium leading-snug">Q7: 71% of top scorers chose B, the key says C</p>
          <p className="text-base text-muted-foreground">Check the key before 30 attempts are published.</p>
        </div>
      </div>
      <ul className="flex flex-col gap-2" aria-label="What the top scorers chose">
        {TOP_SCORER_CHOICES.map((c) => (
          <li key={c.option} className="flex items-center gap-3 text-base">
            <span className="w-20 shrink-0">Option {c.option}</span>
            <span className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
              <span className="block h-full rounded-full bg-foreground/70" style={{ width: `${c.percent}%` }} />
            </span>
            <span className="w-20 shrink-0 text-right tabular-nums">
              {c.percent}%{c.key && " (key)"}
            </span>
          </li>
        ))}
      </ul>
      <p className="rounded-2xl bg-muted/60 p-4 text-base">Publishing is blocked. Change the key and every attempt is regraded.</p>
    </Fragment>
  );
}

export function LeakFragment() {
  return (
    <Fragment label="Leak tracer on a paper found in a group chat. Sample data.">
      <div className="flex items-start gap-3">
        <ShieldAlert aria-hidden className="mt-1 size-5 shrink-0" />
        <div>
          <p className="text-lg font-medium leading-snug">This text matches one candidate&apos;s paper</p>
          <p className="text-base text-muted-foreground">Every candidate gets questions and options in their own order.</p>
        </div>
      </div>
      <div className="rounded-2xl bg-muted/60 p-4">
        <p className="text-base">Candidate 31 sat paper 7f3a. Question order 14, 3, 22, 9. Options for Q1: C, A, D, B.</p>
        <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
          <Fingerprint aria-hidden className="size-4 shrink-0" />
          Seen in the pasted text: the same order, nothing else.
        </p>
      </div>
      <p className="text-base">A clue for the examiner to follow up, not a verdict. The other 49 candidates keep their results.</p>
    </Fragment>
  );
}
