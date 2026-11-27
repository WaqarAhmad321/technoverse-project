import Link from "next/link";
import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { signInAsDemo } from "@/features/auth/actions";
import { SignInForm } from "@/features/auth/sign-in-form";

type Notice = { tone: "error" | "done"; text: string };

const notices = new Map<string, Notice>([
  [
    "demo-unavailable",
    { tone: "error", text: "The demo account is not available right now. Sign in or create an account instead." },
  ],
  ["account-created", { tone: "done", text: "Your account is ready. Sign in to continue." }],
]);

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ notice?: string | string[] }> }) {
  const { notice: noticeKey } = await searchParams;
  const notice = typeof noticeKey === "string" ? notices.get(noticeKey) : undefined;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      {notice && <FormMessage tone={notice.tone}>{notice.text}</FormMessage>}
      <SignInForm />
      <form action={signInAsDemo}>
        <SubmitButton variant="outline" size="lg" className="w-full">
          Try the demo
        </SubmitButton>
      </form>
      <p className="text-base text-muted-foreground">
        New here?{" "}
        <Link href="/sign-up" className="text-foreground underline underline-offset-4">
          Create an account
        </Link>
      </p>
    </div>
  );
}
