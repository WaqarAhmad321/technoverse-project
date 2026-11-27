---
status: todo
tier: should
review: no
---
# Candidate's own workspace settings, kept on the server

## Goal
Ayesha picks a larger font, high contrast and one-question-at-a-time or all-on-one-page, and finds them again on any phone. Covers secondary feature 4.7.

## What to build
- A "Display" menu in the workspace and on `/account`: text size (normal, large, larger), contrast (normal, high), layout (one at a time, all on one page). Saved to `preferences` (one row per person) through a server action; applied as classes on the workspace root using the shared tokens (high contrast uses existing tokens with stronger values, no raw colours).
- Respect `prefers-reduced-motion`.

## Done when
In the workspace choose "Larger" and "High contrast": the page changes at once; sign out, sign in on another browser: the same settings apply.

## Owns
`src/features/delivery/`, `src/app/(app)/exams/`.

## Stand-ins
None.
