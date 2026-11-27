import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getEnv } from "@/lib/env";

let client: SupabaseClient | undefined;

// This client holds the secret key and skips the database's own access rules,
// so every query must filter by the signed-in user's id.
export function db(): SupabaseClient {
  if (!client) {
    const env = getEnv();
    client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

type DbResult<T> = { data: T; error: null } | { data: null; error: { message: string } };

export function unwrap<T>(result: DbResult<T>): T {
  if (result.error) {
    throw new Error(`Database request failed: ${result.error.message}`);
  }
  return result.data;
}
