---
status: todo
tier: must
review: no
---
# Stub the authoring slice

## Goal
Every authoring screen exists, is reachable from the navigation for examiners, and shows seeded data, so the whole demo story is clickable within twenty minutes.

## What to build
- Nav lines in `src/lib/nav.ts` (examiner): "Exams" `/manage`, "Question bank" `/questions`, "Roster" `/roster`, "Disputes" `/disputes`.
- Thin pages, each starting with `requireMember("examiner")` and filtering by `institution_id`: `/questions` (seeded bank as a table), `/questions/[questionId]`, `/roster`, `/manage` (four seeded exams with their phase from `examPhase`), `/manage/[examId]`, `/marking/[examId]`, `/disputes`. `/disputes/new` for a candidate.
- A `loading.tsx` with a skeleton beside each list page; `EmptyState` when a list is empty.

## Done when
`pnpm dev`, "Try as examiner": Exams lists Physics Midterm (draft), Waves Practice Quiz (open), Physics Quiz 1 and Physics Pre-test (closed); Question bank lists 20 questions; Roster lists 31 candidates; `/marking/<Quiz 1 id>` lists 30 submitted attempts.

## Owns
`src/features/authoring/`, the authoring routes in `hack/architecture.md`, `tests/smoke/authoring.spec.ts`.

## Stand-ins
None: the seed has every table.
