---
status: done
tier: must
review: yes
---
# Review, publish results, exam summary

## Goal
Kamran reviews the results and publishes them in a controlled way; candidates then see their own. The exam summary comes from the real submissions. Covers spec 3.7 (review before publication) and 3.8 (controlled publication, exam-level summary, candidate scores, retained results).

## What to build
- On `/marking/[examId]`: a results table (roll number, name, total of max, percentage) and a summary: candidates, submitted, average, median, highest, lowest, pass rate at 33% (the Pakistani pass mark), and a simple score histogram.
- "Publish results" (blocked until all written answers are marked and no Key Doctor flag is open): one `results` row per finished non-sandbox attempt with `version 1`, the breakdown, `is_current = true`, a 10-character `verify_code`, `published_at = now`; set `exams.results_published_at`. Audit `results.published`.
- After publishing, any regrade (a key fix, a dispute) creates `version + 1` with a `reason`, sets the old row's `is_current = false`, and keeps both.

## Done when
On Quiz 1 after the Key Doctor fix and marking: "Publish results" → 30 results; "Try as candidate" → My results shows Quiz 1. Fix another key afterwards: Ayesha's result shows version 2 with the reason. The smoke test covers the end of step 8.

## Owns
`src/features/authoring/`, `src/app/(app)/marking/`.

## Stand-ins
None.
