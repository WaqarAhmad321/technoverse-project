---
description: Anyone. An independent second look at my own recent work, with the findings fixed by me.
argument-hint: [what to look at; default is my work since it last landed, or my last landed task]
---

# Audit: a second look at my work

What to look at: $ARGUMENTS

1. Work out the diff. If the current branch has commits that are not on `origin/main`, use `git diff origin/main...HEAD`. Otherwise use the last commits of mine on main for my slice.
2. Start the `reviewer` agent. Give it the diff range, my slice's section of `hack/architecture.md`, the task's "Done when", and the demo story from `hack/requirements.md`.
3. Fix every finding it marks as breaking the demo or losing data. Fix the others only if each takes under five minutes; otherwise add a task file for it at the right place in my list.
4. Run the task's "Done when" and `scripts/check` again, then land the fixes with `scripts/land`.

Report in three lines: what the reviewer found, what was fixed, what became a task. This waits on no person and blocks no one.
