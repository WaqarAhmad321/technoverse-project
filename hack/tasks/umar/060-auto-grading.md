---
status: done
tier: must
review: yes
---
# Automatic marks for objective answers

## Goal
Single-answer and multiple-select answers are marked automatically and exactly by the marking scheme. Covers spec 3.7 (auto-grade objective answers, multiple-select rules, accurate totals).

## What to build
- A pure `scoreObjective(snapshot, response, fix?)` in `src/features/authoring/scoring.ts`: single = full marks or 0; multiple all-or-nothing; multiple partial = `max(0, (right − wrong) / keyed) × marks`, rounded to 2 decimals. A `key_fixes` row for the question overrides the snapshot key (`change_key`, `accept_both`, `full_marks`, `drop`). Unit tests for each rule: this is the one place a test pays off.
- "Mark objective answers" on `/marking/[examId]` (and automatically when the page opens for a closed exam): for every finished, non-sandbox attempt (`isAttemptFinished`), upsert `grades` with `source = auto`, using only answers where `answerCounts(answer, attempt)`. Idempotent: running twice gives the same rows.
- Progress line: "30 attempts · 270 objective answers marked · 30 written answers to mark".

## Done when
"Try as examiner" → `/marking/<Quiz 1 id>`: objective marks appear for all 30 attempts; `pnpm test` (or the unit test command) passes the scoring rules; running it again changes nothing.

## Owns
`src/features/authoring/`, `src/app/(app)/marking/`.

## Stand-ins
None.
