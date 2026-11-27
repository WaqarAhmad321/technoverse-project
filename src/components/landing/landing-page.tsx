import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { KeyDoctorFragment, LeakFragment, TimeBackFragment } from "./fragments";
import { PowerDemo } from "./power-demo";
import { RoleTiles } from "./role-tiles";

type Proof = {
  figure: string;
  caption: string;
  source: string;
  sourceHref: string;
  title: string;
  body: string;
  fragment: React.ReactNode;
};

// Each story starts from something that really happened in Pakistan, then shows the mechanism that answers it.
const PROOFS: Proof[] = [
  {
    figure: "16",
    caption: "internet shutdowns in nine years were triggered by exams",
    source: "Access Now, via Express Tribune, 2025",
    sourceHref: "https://tribune.com.pk/story/2531903/internet-shutdowns-hit-record-high-in-2024",
    title: "An outage costs nobody their answers, or their time.",
    body: "Answers are kept on the phone and sent when the line comes back. The clock follows the server, so a dead battery or a wrong device clock changes nothing. If the outage stopped her working, she gets that time back; if she kept answering offline, she doesn't need it.",
    fragment: <TimeBackFragment />,
  },
  {
    figure: "35%",
    caption: "variation between e-marking and manual marking on 62,000 scripts",
    source: "Karachi board trial, ProPakistani, 2026",
    sourceHref: "https://propakistani.pk/2026/07/08/karachi-board-postpones-matric-science-group-results/amp/",
    title: "A wrong key is caught before a single result goes out.",
    body: "After the exam, the Key Doctor compares how the strongest candidates answered each question. When most of them chose B and the key says C, publishing stops until someone decides, and the fix regrades everyone at once.",
    fragment: <KeyDoctorFragment />,
  },
  {
    figure: "13h 44m",
    caption: "before the test, the MDCAT 2024 paper was already circulating in Sindh",
    source: "Sindh High Court order, 2024",
    sourceHref: "https://www.geo.tv/latest/571092-mdcat-retest-ordered-by-shc-after-paper-leak-confirmed-by-probe-committee",
    title: "A leak gets traced to its paper, not answered with a retest.",
    body: "Every candidate's paper is shuffled differently. Paste what leaked, and the order of the questions points to the paper it came from.",
    fragment: <LeakFragment />,
  },
];

const CHAIN = [
  { who: "Examiner", what: "sets the paper; the checklist blocks a broken one" },
  { who: "Controller", what: "approves it, or sends it back with a note" },
  { who: "Candidates", what: "sit it on any phone, through any outage" },
  { who: "Key Doctor", what: "checks every answer key against how people answered" },
  { who: "Controller", what: "signs off the results" },
  { who: "Anyone", what: "verifies a result from the QR on its PDF" },
];

export function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 md:px-8">
          <Logo />
          <nav aria-label="Main" className="flex items-center gap-1">
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <a href="#why">Why Imtihaan</a>
            </Button>
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <a href="#roles">Try a role</a>
            </Button>
            <ThemeToggle />
            <Button asChild variant="ghost">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild className="hidden md:inline-flex">
              <Link href="/sign-up">Create an account</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pt-10 pb-20 md:px-8 lg:grid-cols-[1.1fr_1fr] lg:pt-20">
          <div className="flex flex-col gap-7">
            <h1 className="text-5xl leading-[0.98] font-semibold tracking-[-0.035em] text-balance md:text-7xl">
              Exams that keep going
              <br />
              <span className="text-primary">when the power doesn&apos;t.</span>
            </h1>
            <p className="max-w-xl text-lg leading-8 text-muted-foreground">
              Imtihaan runs online exams for Pakistani colleges, universities and boards. Answers survive load-shedding,
              wrong answer keys are caught before results go out, and leaked papers are traced to their source.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <a href="#roles">
                  Try it as a candidate or examiner
                  <ArrowRight aria-hidden className="size-4" />
                </a>
              </Button>
              <span className="text-sm text-muted-foreground">No sign-up. One click into a live college.</span>
            </div>
          </div>
          <PowerDemo />
        </section>

        <section id="roles" aria-labelledby="roles-title" className="scroll-mt-20 bg-card/40 py-20">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 md:px-8">
            <div className="flex flex-col gap-3">
              <h2 id="roles-title" className="text-3xl font-semibold tracking-tight md:text-5xl">
                Pick who you are.
                <br />
                You&apos;re in.
              </h2>
              <p className="max-w-2xl text-lg text-muted-foreground">
                Each one opens Ravi Science College, Lahore: a seeded college with a question bank, a live quiz, 30 marked
                papers and a wrong answer key waiting to be found.
              </p>
            </div>
            <RoleTiles />
          </div>
        </section>

        <section id="why" aria-label="Why Imtihaan" className="scroll-mt-20 py-20">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-24 px-4 md:px-8">
            {PROOFS.map((proof, index) => (
              <article
                key={proof.figure}
                className="grid items-center gap-10 lg:grid-cols-2"
                aria-labelledby={`proof-${index}`}
              >
                <div className={index % 2 === 1 ? "lg:order-2" : undefined}>
                  <p className="font-mono text-6xl font-medium tracking-tight text-primary tabular-nums md:text-7xl">{proof.figure}</p>
                  <p className="mt-2 max-w-md text-base text-muted-foreground">
                    {proof.caption}.{" "}
                    <a href={proof.sourceHref} className="underline underline-offset-4 hover:text-foreground" rel="noreferrer" target="_blank">
                      {proof.source}
                    </a>
                  </p>
                  <h2 id={`proof-${index}`} className="mt-8 text-3xl leading-tight font-semibold tracking-tight text-balance md:text-4xl">
                    {proof.title}
                  </h2>
                  <p className="mt-4 max-w-xl text-lg leading-8 text-muted-foreground">{proof.body}</p>
                </div>
                <div className={index % 2 === 1 ? "lg:order-1" : undefined}>{proof.fragment}</div>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="chain-title" className="bg-card/40 py-20">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 md:px-8">
            <div className="flex flex-col gap-3">
              <h2 id="chain-title" className="text-3xl font-semibold tracking-tight md:text-5xl">
                Nobody approves their own work.
              </h2>
              <p className="max-w-2xl text-lg text-muted-foreground">
                The exam office, made digital. Every step below is a real screen, and every powerful action lands in a log that
                proves nobody edited it afterwards.
              </p>
            </div>
            <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {CHAIN.map((step, index) => (
                <li key={`${step.who}-${index}`} className="flex gap-4 rounded-3xl bg-card p-5 ring-1 ring-border">
                  <span className="font-mono text-sm text-muted-foreground tabular-nums">{index + 1}</span>
                  <span className="flex flex-col gap-1">
                    <span className="text-base font-medium">{step.who}</span>
                    <span className="text-base text-muted-foreground">{step.what}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="py-24">
          <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-6 px-4 text-center md:px-8">
            <h2 className="text-4xl leading-tight font-semibold tracking-tight text-balance md:text-6xl">
              Sit an exam on a 2G phone.
              <br />
              <span className="text-primary">Then pull the plug.</span>
            </h2>
            <p className="max-w-xl text-lg text-muted-foreground">No camera, no paid AI, no installs. Pick a role and see it for yourself.</p>
            <Button asChild size="lg">
              <a href="#roles">
                Choose a role
                <ArrowRight aria-hidden className="size-4" />
              </a>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between md:px-8">
          <Logo />
          <p>Built in one day for Web-e-Thon, Technoverse 5.0, COMSATS University Lahore. All people and data are fictional.</p>
        </div>
      </footer>
    </div>
  );
}
