import type { Role } from "@/lib/access";

export type NavAudience = Role | "super_admin";
export type NavItem = { href: string; label: string; audience: NavAudience[] };

// One screen per line. Add yours on a new line of its own, with the roles that see it.
export const navItems: NavItem[] = [
  { href: "/home", label: "Home", audience: ["institution_admin", "examiner", "candidate", "super_admin"] },
  { href: "/manage", label: "Exams", audience: ["examiner"] },
  { href: "/questions", label: "Question bank", audience: ["examiner"] },
  { href: "/roster", label: "Roster", audience: ["examiner"] },
  { href: "/disputes", label: "Disputes", audience: ["examiner"] },
  { href: "/exams", label: "My exams", audience: ["candidate"] },
  { href: "/results", label: "My results", audience: ["candidate"] },
  { href: "/monitor", label: "Live monitor", audience: ["examiner", "institution_admin", "controller", "invigilator"] },
  { href: "/approvals", label: "Approvals", audience: ["controller"] },
  { href: "/admin/people", label: "People", audience: ["institution_admin"] },
  { href: "/admin/audit", label: "Audit log", audience: ["institution_admin", "controller", "observer"] },
  { href: "/platform", label: "Institutions", audience: ["super_admin"] },
];

export function navFor(audience: NavAudience[]): NavItem[] {
  return navItems.filter((item) => item.audience.some((who) => audience.includes(who)));
}
