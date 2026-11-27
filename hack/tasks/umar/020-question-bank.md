---
status: todo
tier: must
review: no
---
# Reusable question bank

## Goal
Kamran keeps a bank of questions with topics, difficulty and marks, of three kinds, and can create and edit them. Covers spec 3.3 (reusable bank, categories and difficulty, single, multiple-select and written, marking schemes).

## What to build
- `/questions`: table with body (first line), topic, difficulty, kind, marks, used in N exams. Filters for topic, difficulty and kind; search by text.
- `/questions/new` and `/questions/[questionId]`: one form for all three kinds. Single: 2–6 options, exactly one correct. Multiple: 2–8 options, at least one correct, and the scoring rule (all or nothing, or partial with the formula shown: `max(0, (right − wrong) / keyed) × marks`). Written: a rubric textarea. Marks 1–100. Zod on the server, the same rules in the form.
- Edit bumps `version`. Attempts already started keep their snapshot (that is delivery's `attempt_questions`), so editing is always safe; say so under the Save button: "Candidates already sitting an exam keep the version they started with."
- Delete only if the question is in no exam; otherwise "Remove it from Physics Midterm first."

## Edge cases judges try
A single-answer question with two correct options is refused with a clear message. Marks 0 or −5 refused. Another institution's question id → not found.

## Done when
"Try as examiner" → Question bank → "Add question": a 5-mark single-answer Kinematics question saves and appears at the top; editing it shows version 2; a multiple-select question shows the partial formula.

## Owns
`src/features/authoring/`, `src/app/(app)/questions/`.

## Stand-ins
None.
