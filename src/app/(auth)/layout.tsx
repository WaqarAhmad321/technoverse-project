import { ClipboardCheck, GraduationCap, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { SetupNotice } from "@/components/setup-notice";
import { getUser } from "@/lib/auth";
import { envProblems } from "@/lib/env";
import { APP_HOME } from "@/lib/site";

const ROLE_EXPLAINERS = [
  { icon: ClipboardCheck, title: "Examiners", text: "Build the question bank, set exams and mark written answers." },
  { icon: GraduationCap, title: "Candidates", text: "Sit the exams you are enrolled in and see your own results." },
  { icon: ShieldCheck, title: "Staff", text: "Controllers sign off results, invigilators watch live exams, admins manage people." },
];

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const problems = envProblems();
  if (problems.length > 0) return <SetupNotice problems={problems} />;

  if (await getUser()) redirect(APP_HOME);

  return (
    <main className="mx-auto grid w-full max-w-5xl flex-1 gap-10 px-4 py-10 lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-16">
      <div className="flex flex-col gap-8">
        <Link href="/" aria-label="Imtihaan home" className="w-fit">
          <Logo />
        </Link>
        <ul className="hidden flex-col gap-5 lg:flex">
          {ROLE_EXPLAINERS.map((item) => (
            <li key={item.title} className="flex items-start gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <item.icon aria-hidden className="size-5" />
              </span>
              <span className="flex flex-col">
                <span className="text-base font-medium">{item.title}</span>
                <span className="text-base text-muted-foreground">{item.text}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="w-full max-w-md lg:justify-self-end">{children}</div>
    </main>
  );
}
