#!/usr/bin/env bash
# Shared helpers for the hack scripts. Sourced, never run.

hack_root() { git rev-parse --show-toplevel; }

hack_me() {
  local me
  me=$(git config --get hack.me || true)
  if [ -z "$me" ]; then
    echo "This checkout does not know who you are. Run: scripts/setup <your-name>" >&2
    return 1
  fi
  printf '%s\n' "$me"
}

hack_has_origin() { git remote get-url origin >/dev/null 2>&1; }

# Uncommitted changes, as git reports them, minus untracked entries that are not files,
# folders or links. A sandbox leaves such placeholders in the project folder, and git can
# neither add nor ignore them.
hack_changes() {
  local line entry
  git status --porcelain | while IFS= read -r line; do
    entry=${line:3}
    if [ "${line:0:2}" = "??" ] && [ ! -f "$entry" ] && [ ! -d "$entry" ] && [ ! -L "$entry" ]; then
      continue
    fi
    printf '%s\n' "$line"
  done
}

hack_stage_everything() {
  local entry
  git add -u
  while IFS= read -r -d '' entry; do
    if [ -f "$entry" ] || [ -L "$entry" ]; then
      git add -- "$entry"
    fi
  done < <(git ls-files --others --exclude-standard -z)
}

hack_die() {
  echo "$*" >&2
  exit 1
}
