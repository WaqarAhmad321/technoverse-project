---
status: done
tier: should
review: yes
---
# Examiner sandbox: take the exam as a candidate

## Goal
Kamran experiences his own exam exactly as a candidate would, and nothing he does there counts. Covers secondary feature 4.3.

## What to build
- `/exams/[examId]/take?preview=1` for an examiner with `can(member, "exam.edit", exam)`: creates or reuses an attempt with `is_sandbox = true`, `candidate_id = null`, even for a draft exam. Same workspace, with a clear bar: "Preview: nothing you do here is recorded as a real attempt." "Restart preview" deletes his sandbox attempt.
- Sandbox attempts never appear on the monitor, in results, statistics or analytics (authoring filters them too; the rule is in `hack/architecture.md`).

## Done when
As the examiner open `/exams/<Midterm id>/take?preview=1`: the workspace works on the draft; the monitor does not list the preview; "Restart preview" gives a fresh paper.

## Owns
`src/features/delivery/`, `src/app/(app)/exams/`.

## Stand-ins
Authoring's "Preview as candidate" button links here; until it lands, type the URL.
