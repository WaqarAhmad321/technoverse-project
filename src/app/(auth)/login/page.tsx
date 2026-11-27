import Link from "next/link";
import { FormMessage } from "@/components/form-message";
import { DemoButtons } from "@/features/auth/demo-buttons";
import { SignInForm } from "@/features/auth/sign-in-form";

type Notice = { tone: "error" | "done"; text: string };

const notices = new Map<string, Notice>([
  [
    "demo-unavailable",
    { tone: "error", text: "The demo accounts are not available right now. Sign in or create an account instead." },
  ],
  ["account-created", { tone: "done", text: "Your account is ready. Sign in to continue." }],
]);

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ notice?: string | string[] }> }) {
  const { notice: noticeKey } = await searchParams;
  const notice = typeof noticeKey === "string" ? notices.get(noticeKey) : undefined;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-base text-muted-foreground">Pick up where you left off.</p>
      </div>
      {notice && <FormMessage tone={notice.tone}>{notice.text}</FormMessage>}
      <SignInForm />
      <DemoButtons />
      <p className="text-base text-muted-foreground">
        New here?{" "}
        <Link href="/sign-up" className="text-foreground underline underline-offset-4">
          Create an account
        </Link>
      </p>
    </div>
  );
}
