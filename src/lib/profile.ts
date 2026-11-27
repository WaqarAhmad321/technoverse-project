import "server-only";
import { cache } from "react";
import { z } from "zod";
import type { SessionUser } from "@/lib/auth";
import { db, unwrap } from "@/lib/db";

const MAX_NAME_LENGTH = 60;

export const displayNameSchema = z.string().trim().min(1).max(MAX_NAME_LENGTH);

type ProfileRow = { display_name: string };

const getSavedName = cache(async (userId: string): Promise<string | null> => {
  const profile: ProfileRow | null = unwrap(
    await db().from("profiles").select("display_name").eq("id", userId).maybeSingle(),
  );
  return profile?.display_name ?? null;
});

export async function getDisplayName(user: SessionUser): Promise<string> {
  const savedName = await getSavedName(user.id);
  return savedName ?? user.email.split("@")[0];
}

export async function saveDisplayName(userId: string, displayName: string): Promise<void> {
  unwrap(await db().from("profiles").update({ display_name: displayName }).eq("id", userId));
}

type NewProfile = { userId: string; displayName: string; email: string; isSuperAdmin?: boolean };

export async function saveProfile(profile: NewProfile): Promise<void> {
  unwrap(
    await db()
      .from("profiles")
      .upsert({
        id: profile.userId,
        display_name: profile.displayName,
        email: profile.email.toLowerCase(),
        is_super_admin: profile.isSuperAdmin ?? false,
      }),
  );
}
