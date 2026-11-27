import Link from "next/link";
import { MobileNav } from "@/components/mobile-nav";
import { NavLinks } from "@/components/nav-links";
import { UserMenu } from "@/components/user-menu";
import { navItems } from "@/lib/nav";
import { APP_HOME, site } from "@/lib/site";

export function AppHeader({ userName, userEmail }: { userName: string; userEmail: string }) {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center gap-2 px-4">
        <MobileNav items={navItems} />
        <Link href={APP_HOME} className="mr-4 text-base font-semibold">
          {site.name}
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          <NavLinks items={navItems} />
        </nav>
        <div className="ml-auto">
          <UserMenu name={userName} email={userEmail} />
        </div>
      </div>
    </header>
  );
}
