import Link from "next/link";
import { SignUpForm } from "@/features/auth/sign-up-form";

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ as?: string }> }) {
  const isCandidate = (await searchParams).as === "candidate";
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">{isCandidate ? "Join your exams" : "Create an account"}</h1>
      {isCandidate && (
        <p className="text-base text-muted-foreground">Use the email your examiner has on the roster. You will see only the exams you are enrolled in.</p>
      )}
      <SignUpForm defaultKind={isCandidate ? "candidate" : "examiner"} />
      <p className="text-base text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-foreground underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </div>
  );
}
