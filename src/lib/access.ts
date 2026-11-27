import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { z } from "zod";
import { getUser, requireUser, type SessionUser } from "@/lib/auth";
import { db, unwrap } from "@/lib/db";
import type { Institution, Membership, Profile } from "@/lib/exam-types";

// The spec's three roles plus a real Pakistani exam office. Add a role here and its rules in `can`.
export const roleSchema = z.enum(["institution_admin", "examiner", "candidate", "controller", "invigilator", "observer"]);
export type Role = z.infer<typeof roleSchema>;

export type Member = { user: SessionUser; profile: Profile; institution: Institution; roles: Role[] };

export type Access = {
  user: SessionUser;
  profile: Profile;
  current: { institution: Institution; roles: Role[] } | null;
  suspended: boolean;
};

function parseRoles(memberships: Pick<Membership, "role">[]): Role[] {
  return memberships.flatMap((membership) => {
    const role = roleSchema.safeParse(membership.role);
    return role.success ? [role.data] : [];
  });
}

const loadAccess = cache(async (user: SessionUser): Promise<Access> => {
  const profile: Profile | null = unwrap(await db().from("profiles").select("*").eq("id", user.id).maybeSingle());
  const fallbackProfile: Profile = {
    id: user.id,
    display_name: user.email.split("@")[0] ?? user.email,
    email: user.email.toLowerCase(),
    is_super_admin: false,
    created_at: new Date().toISOString(),
  };

  const memberships: Membership[] = unwrap(
    await db()
      .from("memberships")
      .select("*")
      .eq("member_id", user.id)
      .eq("active", true)
      .order("created_at", { ascending: true }),
  );
  const institutionIds = [...new Set(memberships.map((membership) => membership.institution_id))];
  const institutions: Institution[] =
    institutionIds.length === 0
      ? []
      : unwrap(await db().from("institutions").select("*").in("id", institutionIds));

  const activeInstitutions = institutions.filter((institution) => institution.status === "active");
  const firstActiveId = institutionIds.find((id) => activeInstitutions.some((institution) => institution.id === id));
  const institution = activeInstitutions.find((candidate) => candidate.id === firstActiveId);

  return {
    user,
    profile: profile ?? fallbackProfile,
    current: institution
      ? { institution, roles: parseRoles(memberships.filter((membership) => membership.institution_id === institution.id)) }
      : null,
    suspended: !institution && institutions.length > 0,
  };
});

export async function getAccess(): Promise<Access> {
  return loadAccess(await requireUser());
}

// Every slice page and action starts here. With no roles given, any membership will do.
export async function requireMember(...roles: Role[]): Promise<Member> {
  const access = await getAccess();
  if (!access.current) notFound();
  const { institution, roles: held } = access.current;
  if (roles.length > 0 && !roles.some((role) => held.includes(role))) notFound();
  return { user: access.user, profile: access.profile, institution, roles: held };
}

// For route handlers, which answer with a status code instead of the not-found screen.
export async function memberOrNull(...roles: Role[]): Promise<Member | null> {
  const user = await getUser();
  if (!user) return null;
  const access = await loadAccess(user);
  if (!access.current) return null;
  const { institution, roles: held } = access.current;
  if (roles.length > 0 && !roles.some((role) => held.includes(role))) return null;
  return { user: access.user, profile: access.profile, institution, roles: held };
}

export async function requireSuperAdmin(): Promise<Access> {
  const access = await getAccess();
  if (!access.profile.is_super_admin) notFound();
  return access;
}

export type Action = "people.manage" | "exam.monitor" | "exam.edit" | "results.publish" | "results.approve" | "audit.view";
export type InstitutionResource = { institution_id: string; user_id?: string };

// Finer rules than a role. Separation-of-duty rules for later roles belong here, nowhere else.
export function can(member: Member, action: Action, resource?: InstitutionResource): boolean {
  if (resource && resource.institution_id !== member.institution.id) return false;
  const isAdmin = member.roles.includes("institution_admin");
  const isExaminer = member.roles.includes("examiner");
  const isController = member.roles.includes("controller");

  switch (action) {
    case "people.manage":
      return isAdmin;
    case "exam.monitor":
      return isAdmin || isExaminer || isController || member.roles.includes("invigilator");
    case "audit.view":
      return isAdmin || isController || member.roles.includes("observer");
    case "results.approve":
      return isController && resource?.user_id !== member.user.id;
    case "exam.edit":
    case "results.publish":
      return isAdmin || (isExaminer && resource?.user_id === member.user.id);
  }
}

// A candidate account meets the roster by email: no linking step.
export const myCandidateIds = cache(async (member: Member): Promise<string[]> => {
  const rows: { id: string }[] = unwrap(
    await db()
      .from("candidates")
      .select("id")
      .eq("institution_id", member.institution.id)
      .eq("email", member.profile.email),
  );
  return rows.map((row) => row.id);
});

// Runs at every sign-in: each institution whose roster has this email gains a candidate membership.
export async function syncCandidateMemberships(userId: string, email: string): Promise<void> {
  const rows: { institution_id: string; user_id: string }[] = unwrap(
    await db().from("candidates").select("institution_id, user_id").eq("email", email.toLowerCase()),
  );
  const byInstitution = new Map(rows.map((row) => [row.institution_id, row.user_id]));
  if (byInstitution.size === 0) return;

  const memberships = [...byInstitution].map(([institutionId, grantedBy]) => ({
    user_id: grantedBy,
    institution_id: institutionId,
    member_id: userId,
    role: "candidate" satisfies Role,
  }));
  unwrap(
    await db()
      .from("memberships")
      .upsert(memberships, { onConflict: "institution_id,member_id,role", ignoreDuplicates: true }),
  );
}
