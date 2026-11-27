---
description: Everyone, once per laptop. Set up this clone and show my slice and first tasks.
argument-hint: <your-name>
---

# Start: set up this laptop

Name given: $ARGUMENTS

1. If no name was given, ask for it once. Then run `scripts/setup <name>`. Fix anything it reports: a missing git name or email, or a missing env file (if `SETUP.md` exists, follow its part for teammates; otherwise copy `.env.example` to `.env`. The person pastes in the shared keys; never read or print the keys yourself).
2. If the project has dependencies and they are not installed in this checkout, install them. If `SETUP.md` lists commands to run once per laptop, run those.
3. Run `scripts/clock` and `scripts/task list <name>`.
4. Read this person's slice in `hack/architecture.md`, if it has been written.

Then report in at most six lines:

- The time left and the current phase.
- Their slice in one sentence: what it is and which demo steps it covers.
- Their first three tasks.
- One reminder: `/next` is the whole loop, and a second Claude on this laptop runs in its own worktree with `claude --worktree side`.

If there is no task list for them yet, say that `/shape` creates it, and stop.
