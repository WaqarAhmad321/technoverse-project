import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";
import { checkEnv } from "./src/lib/env-rules";

const ENV_FILE = ".env.local";
const FIRST_PORT = 4100;
const PORT_RANGE = 800;

if (existsSync(ENV_FILE)) process.loadEnvFile(ENV_FILE);

// Without this, a wrong setting shows up as minutes of browser timeouts instead of one line.
const { problems } = checkEnv(process.env);
if (problems.length > 0) {
  const lines = problems.map((problem) => `  - ${problem}`).join("\n");
  throw new Error(`The browser test did not start, because the app is not connected:\n${lines}\nFix it in ${ENV_FILE}, then run the check again.`);
}

// Each checkout gets its own port, so two worktrees on one laptop can run the check at the same time.
const port = FIRST_PORT + (createHash("sha1").update(process.cwd()).digest().readUInt16BE(0) % PORT_RANGE);
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "tests/smoke",
  // Every laptop talks to one remote database, so a click that saves takes seconds here; the waits allow for it.
  timeout: 90_000,
  expect: { timeout: 12_000 },
  retries: 1,
  reporter: "line",
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `pnpm exec next start --port ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 60_000,
    // Outside services answer from recorded responses during the check.
    env: { DEMO_MODE: "1" },
  },
});
