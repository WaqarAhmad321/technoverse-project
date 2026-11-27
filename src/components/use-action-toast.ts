"use client";

import { useEffect } from "react";
import { toast } from "sonner";

type ActionState = { status: string; message: string } | null;

const SUCCESS_STATUSES = new Set(["saved", "sent", "done", "ok"]);

// A finished action says so in a toast; a problem stays next to the form, where the person fixes it.
export function useActionToast(state: ActionState): void {
  useEffect(() => {
    if (state && SUCCESS_STATUSES.has(state.status)) toast.success(state.message);
  }, [state]);
}

export function isActionError(state: ActionState): state is { status: string; message: string } {
  return state !== null && !SUCCESS_STATUSES.has(state.status);
}
