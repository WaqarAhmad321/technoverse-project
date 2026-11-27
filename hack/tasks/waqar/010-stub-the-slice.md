---
status: done
tier: must
review: no
---
# Stub the delivery slice

## Goal
Every delivery screen exists, is reachable from the navigation for the right role, and shows seeded data, so the whole demo story is clickable within twenty minutes.

## What to build
- Add nav lines in `src/lib/nav.ts`: "My exams" `/exams` (candidate), "My results" `/results` (candidate), "People" `/admin/people` (institution_admin), "Institutions" `/platform` (super admin).
- Thin pages, each starting with `requireMember(...)` or `requireSuperAdmin()`, listing real seeded rows in a plain table or list: `/platform`, `/admin/people`, `/exams`, `/exams/[examId]`, `/exams/[examId]/take` (question bodies only, no answering yet), `/exams/[examId]/receipt`, `/monitor/[examId]`, `/results`, `/results/[resultId]`, `/verify/[code]` (public, outside `(app)`).
- A `loading.tsx` with a skeleton beside each list page; `EmptyState` when the list is empty.

## Done when
`pnpm dev`, "Try as candidate": "My exams" shows Waves Practice Quiz under open and Physics Pre-test under completed; "My results" shows the Pre-test result; its page opens. "Try as admin": People lists Ayesha, Bilal, Kamran and Sana. `/monitor/<Waves quiz id>` as the examiner opens. `/verify/<a Pre-test verify code>` opens signed out.

## Owns
`src/features/delivery/`, `src/features/people/`, the delivery routes in `hack/architecture.md`, `tests/smoke/delivery.spec.ts`.

## Stand-ins
None: the seed has every table.
