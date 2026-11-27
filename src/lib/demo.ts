import "server-only";

export function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "1";
}

// Wrap each outside service in one function that calls this. In demo mode the
// recorded answer is returned and the service is never called.
export async function liveOrRecorded<T>(live: () => Promise<T>, recorded: () => T): Promise<T> {
  if (isDemoMode()) return recorded();
  return live();
}
