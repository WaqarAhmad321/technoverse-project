"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireMember, roleSchema, type Role } from "@/lib/access";
import { recordAudit } from "@/lib/audit";
import { db, unwrap } from "@/lib/db";

export type PeopleFormState = { status: "saved"; message: string } | { status: "error"; message: string } | null;

const PEOPLE_PATH = "/admin/people";

const rolesFormSchema = z.object({
  personId: z.uuid(),
  roles: z.array(roleSchema).min(1),
});

async function currentRoles(institutionId: string, personId: string): Promise<Role[]> {
  const rows: { role: string }[] = unwrap(
    await db()
      .from("memberships")
      .select("role")
      .eq("institution_id", institutionId)
      .eq("member_id", personId)
      .eq("active", true),
  );
  return rows.flatMap((row) => {
    const role = roleSchema.safeParse(row.role);
    return role.success ? [role.data] : [];
  });
}

export async function saveRoles(_previous: PeopleFormState, formData: FormData): Promise<PeopleFormState> {
  const member = await requireMember("institution_admin");
  const parsed = rolesFormSchema.safeParse({ personId: formData.get("personId"), roles: formData.getAll("roles") });
  if (!parsed.success) return { status: "error", message: "Pick at least one role." };
  const { personId, roles } = parsed.data;

  const held = await currentRoles(member.institution.id, personId);
  if (held.length === 0) return { status: "error", message: "That person is not part of this institution." };
  if (personId === member.user.id && !roles.includes("institution_admin")) {
    return { status: "error", message: "Make someone else an admin first, so the institution keeps one." };
  }

  const added = roles.filter((role) => !held.includes(role));
  const removed = held.filter((role) => !roles.includes(role));
  if (added.length === 0 && removed.length === 0) return { status: "saved", message: "Nothing changed." };

  if (added.length > 0) {
    const rows = added.map((role) => ({ user_id: member.user.id, institution_id: member.institution.id, member_id: personId, role }));
    unwrap(await db().from("memberships").upsert(rows, { onConflict: "institution_id,member_id,role", ignoreDuplicates: true }));
  }
  if (removed.length > 0) {
    unwrap(
      await db()
        .from("memberships")
        .delete()
        .eq("institution_id", member.institution.id)
        .eq("member_id", personId)
        .in("role", removed),
    );
  }
  await recordAudit(member, "role.changed", personId, { added, removed });
  revalidatePath(PEOPLE_PATH);
  return { status: "saved", message: "Roles saved." };
}

const addPersonSchema = z.object({ email: z.email(), role: roleSchema });

export async function addPerson(_previous: PeopleFormState, formData: FormData): Promise<PeopleFormState> {
  const member = await requireMember("institution_admin");
  const parsed = addPersonSchema.safeParse({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    role: formData.get("role"),
  });
  if (!parsed.success) return { status: "error", message: "Enter a valid email and pick a role." };

  const profile: { id: string; display_name: string } | null = unwrap(
    await db().from("profiles").select("id, display_name").eq("email", parsed.data.email).maybeSingle(),
  );
  if (!profile) {
    return { status: "error", message: "Nobody has an account with that email yet. Ask them to sign up first, then add them." };
  }

  const held = await currentRoles(member.institution.id, profile.id);
  if (held.includes(parsed.data.role)) return { status: "saved", message: `${profile.display_name} already has that role.` };

  unwrap(
    await db()
      .from("memberships")
      .upsert(
        { user_id: member.user.id, institution_id: member.institution.id, member_id: profile.id, role: parsed.data.role },
        { onConflict: "institution_id,member_id,role", ignoreDuplicates: true },
      ),
  );
  await recordAudit(member, "role.changed", profile.id, { added: [parsed.data.role], removed: [] });
  revalidatePath(PEOPLE_PATH);
  return { status: "saved", message: `${profile.display_name} added.` };
}
