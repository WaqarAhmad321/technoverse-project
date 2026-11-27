"use client";

import { LogOut, Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Logo, LogoMark } from "@/components/logo";
import { iconFor } from "@/components/nav-icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { signOut } from "@/features/auth/actions";
import type { NavItem } from "@/lib/nav";
import { APP_HOME } from "@/lib/site";
import { cn } from "@/lib/utils";

export const SIDEBAR_COOKIE = "imtihaan-sidebar";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

type SidebarProps = {
  items: NavItem[];
  userName: string;
  userEmail: string;
  institutionName: string | null;
  roleLabel: string;
  initiallyCollapsed: boolean;
};

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

function NavList({ items, isCollapsed, onNavigate }: { items: NavItem[]; isCollapsed: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <ul className="flex flex-col gap-1">
      {items.map((item) => {
        const Icon = iconFor(item.href);
        const isCurrent = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const link = (
          <Link
            href={item.href}
            onClick={onNavigate}
            aria-current={isCurrent ? "page" : undefined}
            aria-label={isCollapsed ? item.label : undefined}
            className={cn(
              "group flex h-11 items-center gap-3 rounded-full px-3 text-[15px] whitespace-nowrap text-muted-foreground transition-colors duration-200 ease-out hover:bg-accent hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none",
              isCurrent && "bg-primary/15 font-medium text-foreground hover:bg-primary/20",
              isCollapsed && "justify-center px-0",
            )}
          >
            <Icon
              aria-hidden
              className={cn(
                "size-5 shrink-0 transition-transform duration-200 group-hover:scale-110 motion-reduce:group-hover:scale-100",
                isCurrent && "text-primary",
              )}
            />
            {!isCollapsed && <span className="animate-in fade-in duration-300">{item.label}</span>}
          </Link>
        );
        return (
          <li key={item.href}>
            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            ) : (
              link
            )}
          </li>
        );
      })}
    </ul>
  );
}

function UserBlock({ name, email, roleLabel, isCollapsed }: { name: string; email: string; roleLabel: string; isCollapsed: boolean }) {
  const [isSigningOut, startSignOut] = useTransition();

  return (
    <div className={cn("flex items-center gap-2 rounded-2xl bg-card/60 p-2", isCollapsed && "flex-col bg-transparent p-0")}>
      <span
        aria-hidden
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-medium text-foreground"
      >
        {initialsOf(name)}
      </span>
      {!isCollapsed && (
        <span className="flex min-w-0 flex-1 flex-col animate-in fade-in duration-300">
          <span className="truncate text-sm font-medium">{name}</span>
          <span className="truncate text-xs text-muted-foreground" title={email}>
            {roleLabel}
          </span>
        </span>
      )}
      <ThemeToggle />
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-10 shrink-0"
            aria-label="Sign out"
            disabled={isSigningOut}
            onClick={() => startSignOut(() => signOut())}
          >
            <LogOut aria-hidden className="size-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Sign out</TooltipContent>
      </Tooltip>
    </div>
  );
}

function SidebarBody({ props, isCollapsed, onNavigate }: { props: SidebarProps; isCollapsed: boolean; onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-4">
      {props.institutionName && !isCollapsed && (
        <p className="truncate px-3 text-sm text-muted-foreground animate-in fade-in duration-300" title={props.institutionName}>
          {props.institutionName}
        </p>
      )}
      <nav aria-label="Main" className="flex-1 overflow-y-auto">
        <NavList items={props.items} isCollapsed={isCollapsed} onNavigate={onNavigate} />
      </nav>
      <div className="flex flex-col gap-2">
        <UserBlock name={props.userName} email={props.userEmail} roleLabel={props.roleLabel} isCollapsed={isCollapsed} />
      </div>
    </div>
  );
}

export function AppSidebar(props: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(props.initiallyCollapsed);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  function toggleCollapsed() {
    const next = !isCollapsed;
    setIsCollapsed(next);
    document.cookie = `${SIDEBAR_COOKIE}=${next ? "collapsed" : "open"}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
  }

  return (
    <>
      <aside
        className={cn(
          "sticky top-3 m-3 mr-0 hidden h-[calc(100dvh-1.5rem)] shrink-0 flex-col gap-5 overflow-hidden rounded-3xl bg-sidebar p-3 transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] lg:flex",
          isCollapsed ? "w-[76px]" : "w-64",
        )}
      >
        <div className={cn("flex items-center justify-between gap-2", isCollapsed && "flex-col")}>
          <Link href={APP_HOME} aria-label="Imtihaan home" className="rounded-xl px-1.5 py-1 focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none">
            {isCollapsed ? <LogoMark /> : <Logo />}
          </Link>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-10"
                aria-label={isCollapsed ? "Open the sidebar" : "Collapse the sidebar"}
                aria-expanded={!isCollapsed}
                onClick={toggleCollapsed}
              >
                {isCollapsed ? <PanelLeftOpen aria-hidden className="size-5" /> : <PanelLeftClose aria-hidden className="size-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">{isCollapsed ? "Open sidebar" : "Collapse sidebar"}</TooltipContent>
          </Tooltip>
        </div>
        <SidebarBody props={props} isCollapsed={isCollapsed} />
      </aside>

      <header className="sticky top-0 z-40 flex h-16 items-center gap-2 bg-background/90 px-4 backdrop-blur-sm lg:hidden">
        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="size-11" aria-label="Open menu">
              <Menu aria-hidden className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 rounded-r-3xl border-0 bg-sidebar p-3">
            <SheetHeader className="p-1.5">
              <SheetTitle>
                <Logo />
              </SheetTitle>
            </SheetHeader>
            <SidebarBody props={props} isCollapsed={false} onNavigate={() => setIsMobileOpen(false)} />
          </SheetContent>
        </Sheet>
        <Link href={APP_HOME} aria-label="Imtihaan home">
          <Logo />
        </Link>
      </header>
    </>
  );
}
