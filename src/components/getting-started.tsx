import { Check, Circle } from "lucide-react";
import Link from "next/link";
import { myCandidateIds, type Member, type Role } from "@/lib/access";
import { db, unwrap } from "@/lib/db";

type Step = { id: string; label: string; href: string; done: boolean };

async function count(table: string, filters: Record<string, string | boolean>, inFilter?: { column: string; values: string[] }): Promise<number> {
  let query = db().from(table).select("id", { count: "exact", head: true });
  for (const [column, value] of Object.entries(filters)) query = query.eq(column, value);
  if (inFilter) query = query.in(inFilter.column, inFilter.values);
  const { count: total, error } = await query;
  if (error) throw new Error(`Database request failed: ${error.message}`);
  return total ?? 0;
}

async function adminSteps(member: Member): Promise<Step[]> {
  const institutionId = member.institution.id;
  const [invitations, others, controllers] = await Promise.all([
    count("invitations", { institution_id: institutionId }),
    db().from("memberships").select("member_id").eq("institution_id", institutionId).eq("active", true).neq("member_id", member.user.id).then(unwrap),
    count("memberships", { institution_id: institutionId, role: "controller", active: true }),
  ]);
  return [
    { id: "approved", label: "Get the institution approved by the platform", href: "/home", done: member.institution.status === "active" },
    { id: "invite", label: "Invite your staff", href: "/admin/people", done: invitations > 0 || (others as unknown[]).length > 0 },
    { id: "controller", label: "Appoint a controller of examinations", href: "/admin/people", done: controllers > 0 },
  ];
}

async function examinerSteps(member: Member): Promise<Step[]> {
  const institutionId = member.institution.id;
  const [questions, candidates, exams, sent] = await Promise.all([
    count("questions", { institution_id: institutionId }),
    count("candidates", { institution_id: institutionId }),
    count("exams", { institution_id: institutionId }),
    count("exams", { institution_id: institutionId, status: "published" }),
  ]);
  return [
    { id: "questions", label: "Add questions to the bank", href: "/questions", done: questions > 0 },
    { id: "roster", label: "Add a roster of candidates", href: "/roster", done: candidates > 0 },
    { id: "exam", label: "Create an exam", href: "/manage", done: exams > 0 },
    { id: "publish", label: "Send it for approval or publish it", href: "/manage", done: sent > 0 },
  ];
}

async function candidateSteps(member: Member): Promise<Step[]> {
  const candidateIds = await myCandidateIds(member);
  const attempts = candidateIds.length === 0 ? 0 : await count("attempts", { is_sandbox: false }, { column: "candidate_id", values: candidateIds });
  return [
    { id: "joined", label: "Join your institution's roster", href: "/exams", done: candidateIds.length > 0 },
    { id: "device", label: "Check your device before the exam", href: "/exams", done: attempts > 0 },
    { id: "sit", label: "Sit your first exam", href: "/exams", done: attempts > 0 },
  ];
}

async function controllerSteps(member: Member): Promise<Step[]> {
  const reviewed = await count("approvals", { institution_id: member.institution.id, decided_by: member.user.id });
  return [{ id: "review", label: "Review your first approval", href: "/approvals", done: reviewed > 0 }];
}

const STEPS_BY_ROLE: Partial<Record<Role, (member: Member) => Promise<Step[]>>> = {
  institution_admin: adminSteps,
  examiner: examinerSteps,
  candidate: candidateSteps,
  controller: controllerSteps,
};

// First-run checklist from real data. Each step ticks itself; the card disappears once every step is done.
export async function GettingStarted({ member }: { member: Member }) {
  const builders = member.roles.flatMap((role) => STEPS_BY_ROLE[role] ?? []);
  const steps = (await Promise.all(builders.map((build) => build(member)))).flat();
  if (steps.length === 0 || steps.every((step) => step.done)) return null;
  const doneCount = steps.filter((step) => step.done).length;

  return (
    <section aria-labelledby="getting-started" className="flex flex-col gap-3 rounded-3xl bg-card p-4 md:p-6">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="getting-started" className="text-xl font-medium">
          Getting started
        </h2>
        <p className="text-sm text-muted-foreground">
          {doneCount} of {steps.length} done
        </p>
      </div>
      <ul className="flex flex-col">
        {steps.map((step) => (
          <li key={step.id}>
            <Link href={step.href} className="flex min-h-11 items-center gap-3 rounded-xl px-2 py-2 text-base hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none">
              {step.done ? <Check aria-hidden className="size-5 text-primary" /> : <Circle aria-hidden className="size-5 text-muted-foreground" />}
              <span className={step.done ? "text-muted-foreground line-through" : ""}>{step.label}</span>
              {step.done && <span className="sr-only">Done</span>}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
