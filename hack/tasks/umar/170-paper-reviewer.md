---
status: todo
tier: extra
review: no
---
# Optional AI Paper Reviewer before publishing

## Goal
Before publishing, an optional reviewer flags ambiguous wording, a key that looks wrong, or options that are both defensible. It only proposes; Kamran decides. The checklist works without it. Research: `hack/research/IMTIHAAN-complete-brief.md` Part E.

## What to build
- A "Review with assistant" button in the publish screen: one call per exam with questions and keys (no candidate data), through `liveOrRecorded` with `ANTHROPIC_API_KEY` (optional; without it the button says "Assistant unavailable"). Structured output: per question, an issue, a short reason and a suggested fix.
- Shown as cards with "Accept suggestion" (opens the question edit form prefilled) or "Dismiss". Never edits anything on its own. Recorded answer for the Midterm in demo mode.

## Done when
With `DEMO_MODE=1`, "Review with assistant" on the Midterm shows the recorded cards; without a key and demo mode off it says unavailable; publishing works either way.

## Owns
`src/features/authoring/`.

## Stand-ins
None.
