---
status: done
tier: should
review: no
---
# Scratchpad for rough work

## Goal
Ayesha does rough working beside each question; it is saved with her attempt, works offline, is never graded and is private to her. Covers secondary feature 4.8.

## What to build
- A "Rough work" panel per question in the workspace: a textarea, plus an optional simple drawing canvas (pointer events, a clear button) saved as a small data URL in the same row.
- Saved to `scratchpads` through the same offline queue as answers (its own key), with "Saved" feedback.
- Examiners never see it: no examiner query selects from `scratchpads`.

## Done when
Type working for Q3, reload: it is there. Offline, type more, go online: it syncs. Nothing about it appears on the monitor or in marking.

## Owns
`src/features/delivery/`.

## Stand-ins
None.
