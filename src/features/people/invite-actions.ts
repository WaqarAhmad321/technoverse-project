"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAccess, requireMember, roleSchema } from "@/lib/access";
import { recordAudit } from "@/lib/audit";
import { db, unwrap } from "@/lib/db";
import type { PeopleFormState } from "./actions";
import { REQUESTABLE_ROLES } from "./roles";

const PEOPLE_PATH = "/admin/people";
const MAX_NOTE_LENGTH = 300;

const inviteSchema = z.object({ email: z.email(), role: roleSchema });

export async function invitePerson(_previous: PeopleFormState, formData: FormData): Promise<PeopleFormState> {
  const member = await requireMember("institution_admin");
  const parsed = inviteSchema.safeParse({ email: String(formData.get("email") ?? "").trim().toLowerCase(), role: formData.get("role") });
  if (!parsed.success) return { status: "error", message: "Enter a valid email and pick a role." };
  const { email, role } = parsed.data;

  const existing: { id: string } | null = unwrap(await db().from("profiles").select("id").eq("email", email).maybeSingle());
  if (existing) {
    const held: { id: string }[] = unwrap(
      await db().from("memberships").select("id").eq("institution_id", member.institution.id).eq("member_id", existing.id).eq("role", role),
    );
    if (held.length > 0) return { status: "saved", message: "That person already has this role here." };
  }

  const invitation: { id: string } | null = unwrap(
    await db()
      .from("invitations")
      .upsert(
        { user_id: member.user.id, institution_id: member.institution.id, email, role, status: "pending", invited_by: member.user.id, accepted_at: null },
        { onConflict: "institution_id,email,role" },
      )
      .select("id")
      .maybeSingle(),
  );
  await recordAudit(member, "invitation.sent", invitation?.id ?? null, { email, role });

  if (existing) {
    unwrap(
      await db()
        .from("memberships")
        .upsert({ user_id: member.user.id, institution_id: member.institution.id, member_id: existing.id, role }, { onConflict: "institution_id,member_id,role", ignoreDuplicates: true }),
    );
    unwrap(await db().from("invitations").update({ status: "accepted", accepted_at: new Date().toISOString() }).eq("id", invitation?.id ?? ""));
    revalidatePath(PEOPLE_PATH);
    return { status: "saved", message: `${email} already has an account and now has the role.` };
  }
  revalidatePath(PEOPLE_PATH);
  return { status: "saved", message: `Invitation saved. ${email} joins the next time they sign in or sign up.` };
}

export async function revokeInvitation(_previous: PeopleFormState, formData: FormData): Promise<PeopleFormState> {
  const member = await requireMember("institution_admin");
  const id = z.uuid().safeParse(formData.get("invitationId"));
  if (!id.success) return { status: "error", message: "That invitation is not available." };
  const revoked: { email: string; role: string }[] = unwrap(
    await db().from("invitations").update({ status: "revoked" }).eq("id", id.data).eq("institution_id", member.institution.id).eq("status", "pending").select("email, role"),
  );
  if (revoked.length === 0) return { status: "error", message: "That invitation is no longer pending." };
  await recordAudit(member, "invitation.revoked", id.data, { email: revoked[0].email, role: revoked[0].role });
  revalidatePath(PEOPLE_PATH);
  return { status: "saved", message: "Invitation revoked." };
}

const decisionSchema = z.object({ requestId: z.uuid(), decision: z.enum(["approve", "decline"]), note: z.string().trim().max(MAX_NOTE_LENGTH) });

export async function decideJoinRequest(_previous: PeopleFormState, formData: FormData): Promise<PeopleFormState> {
  const member = await requireMember("institution_admin");
  const parsed = decisionSchema.safeParse({ requestId: formData.get("requestId"), decision: formData.get("decision"), note: String(formData.get("note") ?? "") });
  if (!parsed.success) return { status: "error", message: "Pick approve or decline." };
  const { requestId, decision, note } = parsed.data;
  if (decision === "decline" && note === "") return { status: "error", message: "Add a short note so they know why." };

  const approved = decision === "approve";
  const decided: { member_id: string; role_requested: string }[] = unwrap(
    await db()
      .from("join_requests")
      .update({ status: approved ? "approved" : "declined", decided_by: member.user.id, decided_at: new Date().toISOString(), ...(note ? { note } : {}) })
      .eq("id", requestId)
      .eq("institution_id", member.institution.id)
      .eq("status", "pending")
      .select("member_id, role_requested"),
  );
  const request = decided[0];
  if (!request) return { status: "error", message: "That request was already decided." };

  if (approved) {
    unwrap(
      await db()
        .from("memberships")
        .upsert({ user_id: member.user.id, institution_id: member.institution.id, member_id: request.member_id, role: request.role_requested }, { onConflict: "institution_id,member_id,role", ignoreDuplicates: true }),
    );
  }
  await recordAudit(member, approved ? "join.approved" : "join.declined", request.member_id, { role: request.role_requested, note });
  revalidatePath(PEOPLE_PATH);
  return { status: "saved", message: approved ? "Approved. They have the role now." : "Declined." };
}

const requestSchema = z.object({ institutionId: z.uuid(), role: z.enum(REQUESTABLE_ROLES), note: z.string().trim().max(MAX_NOTE_LENGTH) });

// A signed-in person with no institution asks one to take them on as staff.
export async function requestToJoin(_previous: PeopleFormState, formData: FormData): Promise<PeopleFormState> {
  const access = await getAccess();
  const parsed = requestSchema.safeParse({ institutionId: formData.get("institutionId"), role: formData.get("role"), note: String(formData.get("note") ?? "") });
  if (!parsed.success) return { status: "error", message: "Pick an institution and the role you need." };

  const institution: { id: string } | null = unwrap(
    await db().from("institutions").select("id").eq("id", parsed.data.institutionId).eq("status", "active").maybeSingle(),
  );
  if (!institution) return { status: "error", message: "That institution is not open to requests." };

  const waiting: { id: string }[] = unwrap(
    await db().from("join_requests").select("id").eq("member_id", access.user.id).eq("institution_id", institution.id).eq("role_requested", parsed.data.role).eq("status", "pending"),
  );
  if (waiting.length > 0) return { status: "saved", message: "Your request is already waiting." };

  unwrap(
    await db().from("join_requests").insert({
      user_id: access.user.id,
      institution_id: institution.id,
      member_id: access.user.id,
      role_requested: parsed.data.role,
      note: parsed.data.note,
    }),
  );
  revalidatePath("/home");
  return { status: "saved", message: "Request sent. You will see it on your home screen until an admin decides." };
}
