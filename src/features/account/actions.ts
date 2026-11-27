"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { displayNameSchema, saveDisplayName } from "@/lib/profile";

export type SaveNameState = { status: "saved" } | { status: "error"; message: string } | null;

export async function saveName(_previous: SaveNameState, formData: FormData): Promise<SaveNameState> {
  const user = await requireUser();

  const name = displayNameSchema.safeParse(formData.get("name"));
  if (!name.success) {
    return { status: "error", message: "Enter a name of 1 to 60 characters." };
  }

  await saveDisplayName(user.id, name.data);
  revalidatePath("/", "layout");
  return { status: "saved" };
}
