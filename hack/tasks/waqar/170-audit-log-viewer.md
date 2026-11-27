---
status: done
tier: extra
review: no
---
# Audit log with a "verify chain" button

## Goal
The institution admin sees every powerful action in order and can prove nobody edited the history. Answers the research's examiner-tampering cases.

## What to build
- `/admin/audit`: the institution's `audit_events`, newest first: when, who, what ("Kamran Siddiqui corrected the key of Q7, C → B"), filterable by action.
- "Verify chain": recomputes every hash in order on the server and says "All 42 events verified" or "Event 17 does not match: the log was changed after it was written".

## Done when
After publishing an exam and changing a role, `/admin/audit` lists both; "Verify chain" says all verified. Editing one payload in the database makes it name that event.

## Owns
`src/features/people/`, `src/app/(app)/admin/`.

## Stand-ins
None.
