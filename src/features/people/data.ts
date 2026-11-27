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
