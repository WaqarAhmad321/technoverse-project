---
status: done
tier: must
review: no
---
# Examiner live monitor and announcements

## Goal
Kamran watches active attempts and sends announcements that candidates see within seconds. Covers spec 3.6: active attempts, progress, events and incidents, announcements, and indicators that are not evidence of misconduct.

## What to build
- `/monitor/[examId]` for `examiner` (via `can(member, "exam.monitor", exam)`): a table of enrolled candidates: not started, in progress (answered 7 of 12, last seen 5s ago, online or offline), submitted (receipt time), auto-submitted. Refreshes every 5 seconds with `router.refresh()`.
- Signals column: counts of offline gaps, resumes and late answers, under the heading "Signals for review, not evidence". Clicking a candidate shows their incident timeline in plain words ("Offline for 40 s at 10:42").
- Announcement form: text and an optional question number ("Q4: take g = 10 m/s²"), button "Send announcement". Saved to `announcements`; audit `announcement.sent`.
- Workspace side (task 050's page): polls announcements for the exam every 10 seconds (with the heartbeat) and shows new ones in a dismissible panel, announced to screen readers.

## Edge cases judges try
Another examiner's exam id in the URL → not found. Sandbox attempts are not listed. An empty exam shows "Nobody has started yet".

## Done when
Examiner window on `/monitor/<Waves quiz id>`, candidate window in the workspace: the candidate's progress moves within 5 seconds of answering; send "Q2: ignore option D" and it appears in the workspace within 10 seconds. The smoke test covers step 6.

## Owns
`src/features/delivery/`, `src/app/(app)/monitor/`.

## Stand-ins
None.
