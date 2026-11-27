import {
  Activity,
  Award,
  Building2,
  ClipboardCheck,
  ClipboardList,
  LayoutDashboard,
  Library,
  NotebookPen,
  Scale,
  ShieldCheck,
  Users,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

const ICON_BY_HREF: Record<string, LucideIcon> = {
  "/home": LayoutDashboard,
  "/manage": ClipboardList,
  "/questions": Library,
  "/roster": Users,
  "/marking": ClipboardCheck,
  "/disputes": Scale,
  "/exams": NotebookPen,
  "/results": Award,
  "/monitor": Activity,
  "/admin/people": UsersRound,
  "/admin/audit": ShieldCheck,
  "/platform": Building2,
  "/approvals": ShieldCheck,
};

// A screen without its own icon still gets a sensible one, so a new nav line never renders bare.
export function iconFor(href: string): LucideIcon {
  return ICON_BY_HREF[href] ?? LayoutDashboard;
}
