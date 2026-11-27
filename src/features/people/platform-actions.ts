"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/access";
import { db, unwrap } from "@/lib/db";

export type PlatformFormState = { status: "saved" | "error"; message: string } | null;

const PLATFORM_PATH = "/platform";

const institutionSchema = z.object({
  name: z.string().trim().min(3).max(80),
  kind: z.enum(["university", "college", "board", "test_body"]),
  city: z.string().trim().min(2).max(40),
  adminEmail: z.email(),
});

export async function addInstitution(_previous: PlatformFormState, formData: FormData): Promise<PlatformFormState> {
  const access = await requireSuperAdmin();
  const parsed = institutionSchema.safeParse({
    name: formData.get("name"),
    kind: formData.get("kind"),
    city: formData.get("city"),
    adminEmail: String(formData.get("adminEmail") ?? "").trim().toLowerCase(),
  });
  if (!parsed.success) return { status: "error", message: "Fill in the name, type, city and the first admin's email." };

  const admin: { id: string; display_name: string } | null = unwrap(
    await db().from("profiles").select("id, display_name").eq("email", parsed.data.adminEmail).maybeSingle(),
  );
  if (!admin) return { status: "error", message: "The first admin needs an account. Ask them to sign up, then try again." };

  const institutionId = randomUUID();
  unwrap(
    await db()
      .from("institutions")
      .insert({ id: institutionId, user_id: access.user.id, name: parsed.data.name, kind: parsed.data.kind, city: parsed.data.city }),
  );
  unwrap(
    await db()
      .from("memberships")
      .insert({ user_id: access.user.id, institution_id: institutionId, member_id: admin.id, role: "institution_admin" }),
  );
  revalidatePath(PLATFORM_PATH);
  return { status: "saved", message: `${parsed.data.name} added, with ${admin.display_name} as its admin.` };
}

export async function setInstitutionStatus(formData: FormData): Promise<void> {
  await requireSuperAdmin();
  const parsed = z.object({ institutionId: z.uuid(), status: z.enum(["active", "suspended"]) }).safeParse({
    institutionId: formData.get("institutionId"),
    status: formData.get("status"),
  });
  if (!parsed.success) return;
  unwrap(await db().from("institutions").update({ status: parsed.data.status }).eq("id", parsed.data.institutionId));
  revalidatePath(PLATFORM_PATH);
}

const reviewSchema = z.object({
  institutionId: z.uuid(),
  decision: z.enum(["approve", "reject"]),
  note: z.string().trim().max(500),
});

export type ReviewState = { status: "saved" | "error"; message: string } | null;

// Approving opens publishing; rejecting needs a reason the institution's admin will see.
export async function reviewInstitution(_previous: ReviewState, formData: FormData): Promise<ReviewState> {
  await requireSuperAdmin();
  const parsed = reviewSchema.safeParse({ institutionId: formData.get("institutionId"), decision: formData.get("decision"), note: formData.get("note") ?? "" });
  if (!parsed.success) return { status: "error", message: "That review could not be read. Try again." };
  if (parsed.data.decision === "reject" && !parsed.data.note) return { status: "error", message: "Say why it is rejected, so the institution knows what to fix." };
  const status = parsed.data.decision === "approve" ? "active" : "rejected";
  unwrap(
    await db()
      .from("institutions")
      .update({ status, review_note: parsed.data.note || null, reviewed_at: new Date().toISOString() })
      .eq("id", parsed.data.institutionId),
  );
  revalidatePath(PLATFORM_PATH);
  revalidatePath(`${PLATFORM_PATH}/${parsed.data.institutionId}`);
  return { status: "saved", message: status === "active" ? "Approved. They can publish exams now." : "Rejected with your note." };
}

const appointSchema = z.object({ institutionId: z.uuid(), email: z.email() });

export async function appointAdmin(_previous: PlatformFormState, formData: FormData): Promise<PlatformFormState> {
  const access = await requireSuperAdmin();
  const parsed = appointSchema.safeParse({ institutionId: formData.get("institutionId"), email: String(formData.get("email") ?? "").trim().toLowerCase() });
  if (!parsed.success) return { status: "error", message: "Enter the email of an existing account." };
  const person: { id: string; display_name: string } | null = unwrap(
    await db().from("profiles").select("id, display_name").eq("email", parsed.data.email).maybeSingle(),
  );
  if (!person) return { status: "error", message: "Nobody has an account with that email yet. Ask them to sign up first." };
  unwrap(
    await db()
      .from("memberships")
      .upsert(
        { user_id: access.user.id, institution_id: parsed.data.institutionId, member_id: person.id, role: "institution_admin" },
        { onConflict: "institution_id,member_id,role", ignoreDuplicates: true },
      ),
  );
  revalidatePath(`${PLATFORM_PATH}/${parsed.data.institutionId}`);
  return { status: "saved", message: `${person.display_name} is now an admin there.` };
}
