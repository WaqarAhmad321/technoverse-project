import Link from "next/link";
import { MobileNav } from "@/components/mobile-nav";
import { NavLinks } from "@/components/nav-links";
import { UserMenu } from "@/components/user-menu";
import type { NavItem } from "@/lib/nav";
import { APP_HOME, site } from "@/lib/site";

type AppHeaderProps = { userName: string; userEmail: string; institutionName: string | null; items: NavItem[] };

export function AppHeader({ userName, userEmail, institutionName, items }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-2 px-4 md:px-8">
        <MobileNav items={items} />
        <Link href={APP_HOME} className="mr-4 text-xl font-medium tracking-tight">
          {site.name}
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          <NavLinks items={items} />
        </nav>
        <div className="ml-auto flex items-center gap-3">
          {institutionName && <span className="hidden max-w-56 truncate text-base text-muted-foreground 2xl:inline">{institutionName}</span>}
          <UserMenu name={userName} email={userEmail} />
        </div>
      </div>
    </header>
  );
}
