import Link from "next/link";
import { SignUpForm } from "@/features/auth/sign-up-form";

export default function SignUpPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
      <SignUpForm />
      <p className="text-base text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-foreground underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </div>
  );
}
