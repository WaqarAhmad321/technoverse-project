import Link from "next/link";
import { SignUpForm, type SignUpKind } from "@/features/auth/sign-up-form";
import { db, unwrap } from "@/lib/db";

const KINDS = new Set<string>(["examiner", "candidate", "staff"]);

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ as?: string; email?: string }> }) {
  const { as, email } = await searchParams;
  const defaultKind: SignUpKind = as && KINDS.has(as) ? (as as SignUpKind) : as === "invited" ? "candidate" : "examiner";
  const institutions: { id: string; name: string }[] = unwrap(
    await db().from("institutions").select("id, name").eq("status", "active").order("name", { ascending: true }),
  );
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">{defaultKind === "candidate" ? "Join your exams" : "Create an account"}</h1>
      {email && <p className="text-base text-muted-foreground">You were invited with this email. Sign up with it and your role is ready when you land.</p>}
      <SignUpForm defaultKind={email ? "candidate" : defaultKind} defaultEmail={email ?? ""} institutions={institutions} />
      <p className="text-base text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-foreground underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </div>
  );
}
