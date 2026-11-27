---
description: Anyone, any time. Where the whole team stands against the clock, in a dozen lines.
---

# Board: where we stand

This is a look, not a meeting. It changes nothing and nobody has to act on it but its reader.

1. `git fetch --quiet origin`, if there is a remote.
2. `scripts/clock`
3. `scripts/task list`
4. `git log origin/main --since="today 00:00" --pretty="%h %an %s" | head -30`
5. Read the last few lines of each file in `hack/log/`.
6. `grep -rn "STAND-IN(" --include="*" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=hack --exclude-dir=.claude | head -20`

Then report, in at most twelve lines:

- The time left and the phase.
- One line per person: must-haves done out of total, what is in progress or parked.
- The demo story: which steps work for real on main, which are still stubs.
- Stand-ins still in the code, counted per owner.
- For the reader's own slice only: on track or not, and if not, exactly what to cut, in this order: extras, should-haves, then the depth of a must-have.

If the reader is the lead, add one line: the single biggest risk to the demo right now. Do not assign work to anyone and do not suggest that anyone wait.
