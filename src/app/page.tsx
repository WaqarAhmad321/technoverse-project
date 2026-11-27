import Link from "next/link";
import { redirect } from "next/navigation";
import { SetupNotice } from "@/components/setup-notice";
import { Button } from "@/components/ui/button";
import { DemoButtons } from "@/features/auth/demo-buttons";
import { getUser } from "@/lib/auth";
import { envProblems } from "@/lib/env";
import { APP_HOME, site } from "@/lib/site";

export default async function FirstScreen() {
  const problems = envProblems();
  if (problems.length > 0) return <SetupNotice problems={problems} />;

  if (await getUser()) redirect(APP_HOME);

  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
        <span className="text-base font-semibold">{site.name}</span>
        <Button asChild variant="ghost" size="lg">
          <Link href="/login">Sign in</Link>
        </Button>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-8 px-4 pb-24">
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">{site.promise}</h1>
        <div className="flex flex-wrap gap-3">
          <DemoButtons />
        </div>
        <p className="text-base text-muted-foreground">
          <Link href="/sign-up" className="text-foreground underline underline-offset-4">
            Create an account
          </Link>{" "}
          for your own institution.
        </p>
      </main>
    </div>
  );
}
