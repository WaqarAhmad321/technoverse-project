# Git: two scripts, never by hand

## The flow
- `scripts/task start` opens a branch for your next task from the newest main.
- Commit as you go, in small commits.
- `scripts/land` puts the branch on main: it brings main in, runs `scripts/check` on the combined result and pushes. If a teammate landed first, it repeats on the new main.
- Land after every task. A task is 20 to 60 minutes, so nothing lives off main for long.

## Rules
- Do not run `git push` to main yourself, and do not `git pull` or rebase by hand. The two scripts do the syncing.
- Never force-push. Never rewrite or reset main. Never use `--no-verify`.
- Never commit `.env` files, keys or tokens. The commit is scanned and blocked if you do. Secrets live in `.env`; code reads them from the environment; `.env.example` lists the names.
- Stage by path: `git add <files or folders>`, or `git add -u` for files git already tracks. Avoid `git add -A`: inside a sandbox the project folder holds placeholder files that make it fail.
- Commit messages are Conventional Commits in lowercase, 72 characters or fewer: `feat(upload): accept pdf files`. Use the slice name as the scope.
- No "Co-Authored-By" line, no "Generated with" line, no AI attribution of any kind.

## Exit codes of `scripts/land`
- `0`: landed.
- `1`: the check failed or the push failed. Read the output, fix the cause, commit, land again.
- `2`: a merge conflict. Resolve it as `teamwork.md` says, then `git add -u && git commit --no-edit && scripts/land`.

## If main is broken
The check runs before every landing, so this is rare. When it happens, whoever notices fixes it forward right away, in a small commit, and lands it. Do not stop to find out whose fault it was.
