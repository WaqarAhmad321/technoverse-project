---
status: done
tier: should
review: no
---
# Bulk import questions from CSV or JSON

## Goal
Kamran imports a question set with the same dry run and clear row errors. Completes secondary feature 4.4.

## What to build
- `/questions/import`: JSON (an array matching the question shape) or CSV (body, kind, topic, difficulty, marks, option_a…option_f, answer like "b" or "a;c", rubric). Same validation as the question form, dry run with row errors, all-or-nothing commit. Urdu text must survive (test with one Urdu question).

## Done when
Import a 5-question JSON file with one question whose key is not among its options: that row is reported; fix it: 5 questions appear in the bank.

## Owns
`src/features/authoring/`, `src/app/(app)/questions/`.

## Stand-ins
None.
