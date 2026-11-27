import Link from "next/link";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { DemoButtons } from "@/features/auth/demo-buttons";
import { site } from "@/lib/site";
import { KeyDoctorFragment, LeakFragment, OfflineFragment, TimeBackFragment } from "./fragments";
import { Story } from "./story";

const ROLES = [
  { role: "Platform", gets: "Creates institutions and names their first admin." },
  { role: "Institution admin", gets: "Adds people, assigns roles and reads the audit log." },
  { role: "Controller", gets: "Approves every paper someone else wrote." },
  { role: "Examiner", gets: "Builds papers, watches the exam live, fixes keys, grades." },
  { role: "Invigilator", gets: "Sees who is working, offline or stuck, and sends announcements." },
  { role: "Candidate", gets: "Answers without fear of lost answers, and gets a receipt." },
] as const;

const LINK_CLASS = "rounded-sm text-foreground underline underline-offset-4";

export function LandingPage() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-4 py-4 md:px-8">
        <Link href="/" aria-label="Imtihaan home" className="rounded-md">
          <Logo />
        </Link>
        <nav aria-label="Account" className="flex items-center gap-1">
          <Button asChild variant="ghost" size="lg">
            <Link href="/login">Sign in</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="hidden sm:inline-flex">
            <Link href="/sign-up">Create an account</Link>
          </Button>
          <ThemeToggle />
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-20 px-4 pb-20 pt-8 md:gap-28 md:px-8 md:pt-16">
        <section className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div className="flex flex-col gap-8">
            <h1 className="text-4xl font-medium tracking-tight text-balance md:text-6xl md:leading-[1.05]">{site.promise}</h1>
            <p className="max-w-xl text-lg leading-7 text-muted-foreground">
              Imtihaan runs exams for Pakistani schools, colleges and boards. Candidates keep their answers when the power
              goes, examiners catch a wrong key before results go out, and a leaked paper points to where it came from.
            </p>
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium">Open the live demo, no sign-up</p>
              <DemoButtons />
            </div>
            <p className="text-base text-muted-foreground">
              Running your own exams?{" "}
              <Link href="/sign-up" className={LINK_CLASS}>
                Create an account
              </Link>
            </p>
          </div>
          <OfflineFragment />
        </section>

        <Story
          title="Load-shedding can't fail your exam"
          incident="Karachi matric candidates sat exams through load-shedding at their centres in April 2025. In Pakistan, 16 internet shutdowns in nine years were triggered by exams."
          source="ARY News, Karachi exam centres"
          sourceHref="https://arynews.tv/karachi-matric-students-disruptions-load-shedding-at-exam-centers"
          fragment={<TimeBackFragment />}
        >
          <p>
            Answers are saved on the candidate&apos;s phone first and sent when the connection returns. A refresh or a dead
            battery brings back every answer and the time left from the server.
          </p>
          <p>
            Other platforms keep the clock running or end the attempt. Imtihaan tells a candidate who kept working offline
            from one who could not, and gives capped time back only to the second. The examiner approves anything over five
            minutes.
          </p>
        </Story>

        <Story
          flip
          title="Wrong keys get caught before results"
          incident="MDCAT 2026: a Senate panel flagged six disputed questions, and UHS scores differed because of a wrong key. KMU and SZABMU ended up in court over grace marks."
          source="Minute Mirror, Senate panel on MDCAT"
          sourceHref="https://minutemirror.com.pk/senate-panel-warns-of-fia-probe-over-mdcat-complaints-against-pmdc-648218/"
          fragment={<KeyDoctorFragment />}
        >
          <p>
            Before results go out, the Key Doctor compares each key with what your strongest candidates chose. A question
            where they disagree with the key blocks publishing until someone looks.
          </p>
          <p>
            Fix the key and every attempt is regraded. A candidate who still disagrees can challenge the question from her
            result, and a second examiner decides without seeing who asked.
          </p>
        </Story>

        <Story
          title="Leaks get traced, not retested"
          incident="MDCAT 2024 Sindh: the paper leaked 13 hours 44 minutes before the test, and the Sindh High Court ordered a full retest for everyone."
          source="ARY News, MDCAT reconduct order"
          sourceHref="https://arynews.tv/mdcat-2024-court-orders-reconduct-within-month"
          fragment={<LeakFragment />}
        >
          <p>
            Every candidate sees questions and options in their own order. If a paper shows up in a group chat, its order
            says whose copy it was.
          </p>
          <p>One candidate is followed up, not fifty retested. It is a signal for a human to review, never a verdict.</p>
        </Story>

        <section aria-labelledby="roles-title" className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <h2 id="roles-title" className="text-3xl font-medium tracking-tight">
              Built for every role
            </h2>
            <p className="max-w-2xl text-lg leading-7 text-muted-foreground">
              Nobody approves their own paper. Every action is in a tamper-evident log.
            </p>
          </div>
          <dl className="grid gap-x-12 rounded-3xl bg-card p-2 md:grid-cols-2 md:p-4">
            {ROLES.map(({ role, gets }) => (
              <div key={role} className="flex flex-col gap-0.5 border-b border-border px-3 py-4 last:border-b-0 md:[&:nth-last-child(2)]:border-b-0">
                <dt className="text-lg font-medium">{role}</dt>
                <dd className="text-base text-muted-foreground">{gets}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>

      <footer className="mx-auto flex w-full max-w-6xl flex-col gap-2 border-t border-border px-4 py-8 text-base text-muted-foreground md:px-8">
        <p className="text-foreground">Works without a camera, without paid AI, on a 2G phone.</p>
        <p>A hackathon build for Web-e-Thon, Technoverse 5.0.</p>
      </footer>
    </div>
  );
}
