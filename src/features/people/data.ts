import "server-only";
import type { Member } from "@/lib/access";
import { db, unwrap } from "@/lib/db";
import type { Institution, Membership, Profile } from "@/lib/exam-types";

export type Person = { profile: Pick<Profile, "id" | "display_name" | "email">; roles: string[]; joinedAt: string };

export async function loadPeople(member: Member): Promise<Person[]> {
  const memberships: Membership[] = unwrap(
    await db().from("memberships").select("*").eq("institution_id", member.institution.id).eq("active", true),
  );
  const memberIds = [...new Set(memberships.map((row) => row.member_id))];
  if (memberIds.length === 0) return [];
  const profiles: Pick<Profile, "id" | "display_name" | "email">[] = unwrap(
    await db().from("profiles").select("id, display_name, email").in("id", memberIds),
  );
  return profiles
    .map((profile) => {
      const own = memberships.filter((row) => row.member_id === profile.id);
      return {
        profile,
        roles: own.map((row) => row.role).sort(),
        joinedAt: own.map((row) => row.created_at).sort()[0] ?? "",
      };
    })
    .sort((a, b) => a.profile.display_name.localeCompare(b.profile.display_name));
}

export type InstitutionSummary = { institution: Institution; memberCount: number; examCount: number };

// The platform admin sees counts, never exam content.
export async function loadInstitutions(): Promise<InstitutionSummary[]> {
  const [institutions, memberships, exams]: [Institution[], { institution_id: string; member_id: string }[], { institution_id: string }[]] =
    await Promise.all([
      db().from("institutions").select("*").order("created_at", { ascending: true }).then(unwrap),
      db().from("memberships").select("institution_id, member_id").eq("active", true).then(unwrap),
      db().from("exams").select("institution_id").then(unwrap),
    ]);
  return institutions.map((institution) => ({
    institution,
    memberCount: new Set(memberships.filter((row) => row.institution_id === institution.id).map((row) => row.member_id)).size,
    examCount: exams.filter((row) => row.institution_id === institution.id).length,
  }));
}

export type InstitutionDetail = {
  institution: Institution;
  members: { name: string; email: string; roles: string[] }[];
  examCount: number;
  publishedCount: number;
  candidateCount: number;
};

// The platform admin sees who runs an institution and how big it is, never exam content.
export async function loadInstitutionDetail(institutionId: string): Promise<InstitutionDetail | null> {
  const institution: Institution | null = unwrap(await db().from("institutions").select("*").eq("id", institutionId).maybeSingle());
  if (!institution) return null;
  const [memberships, exams, candidates]: [Membership[], { status: string }[], { id: string }[]] = await Promise.all([
    db().from("memberships").select("*").eq("institution_id", institutionId).eq("active", true).then(unwrap),
    db().from("exams").select("status").eq("institution_id", institutionId).then(unwrap),
    db().from("candidates").select("id").eq("institution_id", institutionId).then(unwrap),
  ]);
  const ids = [...new Set(memberships.map((row) => row.member_id))];
  const profiles: Pick<Profile, "id" | "display_name" | "email">[] =
    ids.length === 0 ? [] : unwrap(await db().from("profiles").select("id, display_name, email").in("id", ids));
  return {
    institution,
    members: profiles
      .map((profile) => ({ name: profile.display_name, email: profile.email, roles: memberships.filter((row) => row.member_id === profile.id).map((row) => row.role) }))
      .sort((a, b) => a.name.localeCompare(b.name)),
    examCount: exams.length,
    publishedCount: exams.filter((exam) => exam.status === "published").length,
    candidateCount: candidates.length,
  };
}

export type PendingInvitation = { id: string; email: string; role: string; createdAt: string };
export type JoinRequestRow = { id: string; name: string; email: string; role: string; note: string; createdAt: string };

export async function loadPendingInvitations(member: Member): Promise<PendingInvitation[]> {
  const rows: { id: string; email: string; role: string; created_at: string }[] = unwrap(
    await db().from("invitations").select("id, email, role, created_at").eq("institution_id", member.institution.id).eq("status", "pending").order("created_at", { ascending: false }),
  );
  return rows.map((row) => ({ id: row.id, email: row.email, role: row.role, createdAt: row.created_at }));
}

export async function loadJoinRequests(member: Member): Promise<JoinRequestRow[]> {
  const rows: { id: string; member_id: string; role_requested: string; note: string; created_at: string }[] = unwrap(
    await db().from("join_requests").select("id, member_id, role_requested, note, created_at").eq("institution_id", member.institution.id).eq("status", "pending").order("created_at", { ascending: true }),
  );
  if (rows.length === 0) return [];
  const profiles: { id: string; display_name: string; email: string }[] = unwrap(
    await db().from("profiles").select("id, display_name, email").in("id", rows.map((row) => row.member_id)),
  );
  return rows.map((row) => {
    const profile = profiles.find((candidate) => candidate.id === row.member_id);
    return { id: row.id, name: profile?.display_name ?? "Someone", email: profile?.email ?? "", role: row.role_requested, note: row.note, createdAt: row.created_at };
  });
}
