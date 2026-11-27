---
status: done
tier: extra
review: yes
---
# Governance roles: controller, moderator, invigilator, observer

## Goal
An institution can mirror a real Pakistani exam office: a controller of examinations who approves results, moderators, invigilators and read-only observers. Research: `hack/research/governance-roles-transparency.md`.

## What to build
- Add the roles to the role union in `src/lib/access.ts` and to the People screen's checkboxes, each with a one-line description.
- Rules in `can(...)`: an `observer` reads the audit log and summaries only; an `invigilator` opens the monitor of exams they are assigned to (the planned `exam_staff` table, added here) but sees no answers.
- Note in the log the `can` actions authoring may use: `results.approve` for the controller.

## Done when
Make Bilal an observer: he can open `/admin/audit` but not `/admin/people` or any exam editing screen.

## Owns
`src/features/people/`, `src/lib/access.ts` (shared: additions only).

## Stand-ins
None.
