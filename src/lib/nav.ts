import type { Role } from "@/lib/access";

export type NavAudience = Role | "super_admin";
export type NavItem = { href: string; label: string; audience: NavAudience[] };

// One screen per line. Add yours on a new line of its own, with the roles that see it.
export const navItems: NavItem[] = [
  { href: "/home", label: "Home", audience: ["institution_admin", "examiner", "candidate", "super_admin"] },
];

export function navFor(audience: NavAudience[]): NavItem[] {
  return navItems.filter((item) => item.audience.some((who) => audience.includes(who)));
}
