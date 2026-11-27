import { AppHeader } from "@/components/app-header";
import { requireUser } from "@/lib/auth";
import { getDisplayName } from "@/lib/profile";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const userName = await getDisplayName(user);

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader userName={userName} userEmail={user.email} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
