---
status: done
tier: extra
review: yes
---
# Fair time back after an outage

## Goal
If an outage stopped Ayesha from working, she gets some of that time back; if she kept working offline, she gets none. Innovation challenge 5.3: reduce the impact of failures without unfair advantage. Design: `hack/research/innovation-design.md` (activity-aware disruption credit).

## What to build
- From the incidents and answer timestamps, compute per gap: worked offline (answers saved offline during the gap) → 0 credit; could not work (no activity, the page was closed) → credit = gap, capped at `exams.settings.credit_cap_pct` of the duration (default 10%). Up to 5 minutes is applied automatically to `credit_seconds`; more waits for the examiner's "Approve time back" on the monitor.
- The workspace shows "2 min 10 s added because your connection dropped." The monitor shows credit given and pending.
- Audit `credit.granted` with the reason.

## Done when
Close the tab for 60 seconds mid-attempt and reopen: the deadline is about 60 seconds later and the bar explains why. Go offline but keep answering for 40 seconds: no time is added.

## Owns
`src/features/delivery/`.

## Stand-ins
None.
