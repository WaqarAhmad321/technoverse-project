---
status: done
tier: extra
review: no
---
# A different version of each question for every candidate

## Goal
A leaked paper or a WhatsApp answer is worth nothing, because the next candidate's question is a different version of the same idea at the same difficulty. Innovation 5.5 (leaks: MDCAT 2024 Sindh retest), 5.1 (shared answers in the AI era) and 5.2 (equal papers, measured). Replaces the old equal-difficulty and Leak Tracer plans.

## What to build
- `questions.variants jsonb` (approved and proposed versions, each with its own options and key) and `attempt_questions.variant_key text null` (which version a candidate got; null = the original).
- On `/questions/[questionId]`: "Write versions": Claude writes 4 versions of an objective question (new situation, new numbers, new wrong options, same concept and difficulty, Pakistani context). Each is solved twice by separate calls that never see the key; a version is kept only when both solves agree with its key. The examiner approves or removes each one.
- `buildPaper` (shared, same signature) picks the original or an approved version per candidate from the seed.
- Grading uses each attempt's own snapshot key; the Key Doctor and key fixes look only at the original version.
- On `/manage/[examId]` Questions tab: "N versions" per question and a side-by-side of two candidates' papers.
- Works with no key: the button says AI is unavailable and everyone gets the original. Demo mode returns recorded versions.

## Done when
Question bank → a Kinematics question → "Write versions" → 4 checked versions appear → approve them → the exam's paper comparison shows two candidates with different versions of that question.

## Owns
`src/features/authoring/`, `src/lib/paper.ts` (shared, same signature), one migration.
