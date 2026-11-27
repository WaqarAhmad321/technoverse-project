---
description: Anyone, best at the end of the main-flow phase and at the freeze. A sceptical judge scores the live product and names the cheapest wins.
---

# Judge: score it like they will

Run this in a checkout that holds no half-done work, so the new task files can land at once. A side worktree is ideal. Open a branch first: `git switch -c judge origin/main`.

1. Run `scripts/clock`.
2. Start the `judge` agent. Give it the live URL from `CLAUDE.md`, the judging criteria from `hack/idea.md`, and the demo story from `hack/requirements.md`. It walks the live product cold and scores it.
3. Take its list of improvements and sort them by points gained per hour of work. Drop anything that does not fit in the time left.
4. Turn each kept improvement into a task file in the list of the slice it belongs to, numbered so it sits at the right place: before the remaining extras if it lifts the score more than they do. Follow `hack/tasks/README.md`. Tasks for the shared core go to whoever runs this command.
5. Commit the new task files and run `scripts/land`.

Report in at most eight lines: the score per criterion, the total, the three improvements worth the most, and which lists they were added to. The owners pick them up through `/next` in the normal order. Nobody is asked to stop what they are doing.
