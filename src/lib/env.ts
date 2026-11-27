import "server-only";
import { checkEnv, type Env } from "@/lib/env-rules";

let validEnv: Env | undefined;

export function envProblems(): string[] {
  if (validEnv) return [];
  const { env, problems } = checkEnv(process.env);
  validEnv = env;
  return problems;
}

export function getEnv(): Env {
  const problems = envProblems();
  if (!validEnv) {
    throw new Error(`The app is not connected: ${problems.join("; ")}. Fix it in .env.local.`);
  }
  return validEnv;
}
