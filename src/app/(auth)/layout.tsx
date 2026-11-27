import Link from "next/link";
import { redirect } from "next/navigation";
import { SetupNotice } from "@/components/setup-notice";
import { getUser } from "@/lib/auth";
import { envProblems } from "@/lib/env";
import { APP_HOME, site } from "@/lib/site";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const problems = envProblems();
  if (problems.length > 0) return <SetupNotice problems={problems} />;

  if (await getUser()) redirect(APP_HOME);

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-8 px-4 py-12">
      <Link href="/" className="text-base font-semibold">
        {site.name}
      </Link>
      {children}
    </main>
  );
}
