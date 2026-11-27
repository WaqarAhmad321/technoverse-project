import { cookies } from "next/headers";
import { AppSidebar, SIDEBAR_COOKIE } from "@/components/app-sidebar";
import { getAccess } from "@/lib/access";
import { navFor, type NavAudience } from "@/lib/nav";

const ROLE_NAMES: Record<string, string> = {
  institution_admin: "Admin",
  examiner: "Examiner",
  candidate: "Candidate",
  controller: "Controller of Examinations",
  invigilator: "Invigilator",
  observer: "Observer",
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [access, cookieStore] = await Promise.all([getAccess(), cookies()]);
  const roles = access.current?.roles ?? [];
  const audience: NavAudience[] = [...roles, ...(access.profile.is_super_admin ? (["super_admin"] as const) : [])];
  const roleLabel = access.profile.is_super_admin
    ? "Platform admin"
    : roles.map((role) => ROLE_NAMES[role] ?? role).join(" · ") || "No role yet";

  return (
    <div className="flex min-h-dvh flex-1 flex-col lg:flex-row">
      <AppSidebar
        items={navFor(audience)}
        userName={access.profile.display_name}
        userEmail={access.user.email}
        institutionName={access.current?.institution.name ?? null}
        roleLabel={roleLabel}
        initiallyCollapsed={cookieStore.get(SIDEBAR_COOKIE)?.value === "collapsed"}
      />
      <main className="min-w-0 flex-1 px-4 py-6 md:px-8 lg:py-10">
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
