import { redirect } from "next/navigation";
import { LandingPage } from "@/components/landing/landing-page";
import { SetupNotice } from "@/components/setup-notice";
import { getUser } from "@/lib/auth";
import { envProblems } from "@/lib/env";
import { APP_HOME } from "@/lib/site";

export default async function FirstScreen() {
  const problems = envProblems();
  if (problems.length > 0) return <SetupNotice problems={problems} />;

  if (await getUser()) redirect(APP_HOME);

  return <LandingPage />;
}
