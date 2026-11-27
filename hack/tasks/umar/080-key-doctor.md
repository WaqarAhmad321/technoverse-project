---
status: todo
tier: must
review: yes
---
# Key Doctor: catch a wrong key before results go out

## Goal
After the exam, item analysis flags questions whose key is probably wrong or ambiguous, blocks publishing until each is resolved, and a fix regrades everyone. Innovation challenge 5.4 and the MDCAT wrong-key scandals. Story step 8. Algorithm: `hack/research/innovation-design.md` (Key Doctor).

## What to build
- Per objective question over finished non-sandbox attempts: difficulty p (share correct), discrimination D = p(top 27%) − p(bottom 27%) by total score, and each option's share among the top group.
- Flags: "Likely wrong key" when D < 0 and one distractor is chosen by over half of the top group; "Possibly ambiguous" when two options are each chosen by over 30% of the top group; "Too hard to tell" with fewer than 10 attempts.
- A card per flag in plain words: "Q7: 71% of the top scorers chose B, the key says C." Actions: "Change key to B", "Accept both B and C", "Give everyone full marks", "Drop the question", "Keep the key" (needs a reason). Each writes `key_fixes` with a reason, audits `key.fixed`, and re-runs auto-grading for all attempts.
- Publishing results is blocked while any flag is unresolved: "Resolve 1 flagged question before publishing."

## Done when
"Try as examiner" → `/marking/<Quiz 1 id>`: the Q7 card shows; "Publish results" is blocked; "Change key to B" with reason "Top scorers chose B; B is correct": all 30 attempts regrade (Ayesha's total rises), the flag is resolved, publishing unblocks.

## Owns
`src/features/authoring/`, `src/app/(app)/marking/`.

## Stand-ins
None.
