# Teamwork: nobody waits

Everyone builds at once, each with their own Claude. The work is split so that no one needs anyone else to keep moving. These rules keep it that way.

## Your slice
- `hack/architecture.md` names your slice: its screens, its data and its folders. Build inside those folders.
- Inside your slice you decide. Pick the sensible default, write one line in `hack/log/<you>.md` if a teammate could care, and keep going.
- Your task list in `hack/tasks/<you>/` is yours to manage. You may split a task, reorder should-haves and extras, or add a task. Keep the file-name order as the order of work.

## Never wait
- Never tell your person to wait for a teammate, to ask the lead, or to get approval. Those sentences are not available today.
- If something another slice owns is not there yet, build a stand-in on your side and carry on:
  - Missing data: use the sample data from the shared seed, or a small fixture in your own folder with the agreed shape.
  - Missing function or endpoint: write a fake with the agreed inputs and outputs in your own folder.
  - Missing screen: link to its route anyway.
- Mark every stand-in with a comment that starts `STAND-IN(<owner>):` and says what replaces it. The freeze step searches for that word, so nothing fake reaches the demo by accident.
- If the shape you need was never agreed, choose one, write it into the data shapes in `hack/architecture.md` in the same change, and note it in your log. You are now its author.
- A task that is stuck for a real reason (an outside service is down, a library fights back) gets parked: `scripts/task park <why>`, then take the next task. Come back to it later with a clear head.

## Shared things
The shared core is the look, login, navigation, the data shapes, the sample data and anything two slices use.
- **Adding is free.** New field, new table, new endpoint, new shared component, new package, new environment variable: add it, note it in your log, land it.
- **Changing or removing is yours to finish.** Rename a field or change what a shared function returns only if you fix every use in every slice in the same change, and the check passes.
- **Data has one writer.** Each table or collection is written by the slice that owns it. Other slices read it. Need a field on someone else's table? Add the field. Do not change how they write.
- **Do not rename or delete data fields during the day.** Add a new one and move on. Clean-up is for after the demo.
- A new environment variable goes into `.env.example` (name only) in the same change.

## When your work meets theirs
- `scripts/land` merges main into your branch. If the same lines changed, resolve it yourself so both changes keep working. In their folder their version wins; in yours, yours wins; in shared files keep both. Then let the check decide. Never hand a conflict to a person.
- If a teammate's landing breaks your slice, fix your side or add what you need to the shared core. Do not revert their work.
- If your landing breaks main in a way the check missed, fix it forward at once. If the fix takes more than a few minutes, revert your own commit, land the revert, then repair it on your branch.

## The log
`hack/log/<you>.md` is one line per thing a teammate could trip over, newest last:

    14:05 decided: uploads are capped at 10 MB
    14:20 stand-in: fake scoring in slices/review/fake-score.ts until umar's scorer lands
    14:40 shared: added `status` to the reports table

It is your own file, so it never conflicts. Nobody has to read it before working. It is there for `/board`, the freeze and the pitch.

## Two Claudes on one laptop
Run a second session in its own worktree: `claude --worktree side`. Each worktree is a separate copy of the project with its own branch, so two sessions never edit the same files. `scripts/task start` gives each session a different task. Install dependencies once in each worktree, and give each dev server its own port.
