import { ArrowRight, Building2, ClipboardCheck, NotebookPen, ShieldCheck } from "lucide-react";
import { SubmitButton } from "@/components/submit-button";
import { signInAsDemo } from "@/features/auth/actions";

const ROLES = [
  { role: "candidate", label: "Try as candidate", who: "Ayesha, BS Physics", line: "Sit an exam, cut the power mid-way, get a receipt that proves it counted.", icon: NotebookPen },
  { role: "examiner", label: "Try as examiner", who: "Kamran, lecturer", line: "Publish a paper, watch the class live, let the Key Doctor catch a wrong key.", icon: ClipboardCheck },
  { role: "admin", label: "Try as admin", who: "Sana, college admin", line: "Run the exam office: people, roles, approvals and the audit trail.", icon: ShieldCheck },
  { role: "platform", label: "Platform admin", who: "Farah, platform", line: "Approve institutions joining Imtihaan and appoint who runs them.", icon: Building2 },
] as const;

// Each tile signs you straight into a seeded college as that person. No account needed.
export function RoleTiles() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {ROLES.map(({ role, label, who, line, icon: Icon }) => (
        <form key={role} action={signInAsDemo} className="lift group flex flex-col gap-4 rounded-3xl bg-card p-5 ring-1 ring-border">
          <input type="hidden" name="role" value={role} />
          <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Icon aria-hidden className="size-5" />
          </span>
          <span className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">{who}</span>
            <span className="text-base leading-6">{line}</span>
          </span>
          <SubmitButton variant={role === "candidate" ? "default" : "outline"} className="mt-auto justify-between">
            {label}
            <ArrowRight aria-hidden className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </SubmitButton>
        </form>
      ))}
    </div>
  );
}
