import { z } from "zod";

const MIN_DEMO_PASSWORD_LENGTH = 8;

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url("is not a valid URL"),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SECRET_KEY: z.string().min(1),
  DEMO_EMAIL: z.email("is not a valid email address"),
  DEMO_PASSWORD: z
    .string()
    .min(MIN_DEMO_PASSWORD_LENGTH, `is too short: use ${MIN_DEMO_PASSWORD_LENGTH} characters or more`),
});

export type Env = z.infer<typeof envSchema>;

// No server-only import here: the browser test's config reads these rules too.
// Each problem is one line a person can act on, such as "DEMO_EMAIL is missing".
export function checkEnv(values: Record<string, string | undefined>): { env?: Env; problems: string[] } {
  const result = envSchema.safeParse(values);
  if (result.success) return { env: result.data, problems: [] };

  const problemByName = new Map<string, string>();
  for (const issue of result.error.issues) {
    const name = String(issue.path[0]);
    if (problemByName.has(name)) continue;
    problemByName.set(name, values[name] ? `${name} ${issue.message}` : `${name} is missing`);
  }
  return { problems: [...problemByName.values()] };
}
