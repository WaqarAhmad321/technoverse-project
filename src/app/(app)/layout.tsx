import { AppHeader } from "@/components/app-header";
import { getAccess } from "@/lib/access";
import { navFor, type NavAudience } from "@/lib/nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const access = await getAccess();
  const audience: NavAudience[] = [...(access.current?.roles ?? []), ...(access.profile.is_super_admin ? (["super_admin"] as const) : [])];

  return (
    <div className="flex flex-1 flex-col">
      <AppHeader
        userName={access.profile.display_name}
        userEmail={access.user.email}
        institutionName={access.current?.institution.name ?? null}
        items={navFor(audience)}
      />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:px-8">{children}</main>
    </div>
  );
}
