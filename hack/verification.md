# Verification

## The smoke test

The demo story as steps a browser test can check. `scripts/check` runs it before every landing. A step whose slice is still a stub only checks that the screen opens; its owner tightens it when the real thing lands. Tests use fresh accounts (each gets its own seeded institution), never the shared demo accounts.

| Step | Owner | Do | Expect |
|---|---|---|---|
| 1 | shared | Open `/` signed out | The promise line and "Try as examiner", "Try as candidate", "Try as admin" |
| 2 | waqar | As a fresh institution admin, open People, make the seeded Bilal an examiner | His row shows "examiner"; as a candidate `/admin/people` shows not found |
| 3 | umar | As the examiner, Physics Midterm → "Review and publish" | "add up to 45 marks" fails; after adding a 5-mark question all pass; publish → phase open |
| 4 | waqar | As the paired candidate, My exams → Physics Midterm → Start, answer Q1, reload | Q1 still answered; time left shown |
| 5 | waqar | Go offline (`context.setOffline(true)`), answer Q2, go online | "kept on this phone", then "All answers saved" |
| 6 | waqar | As the examiner, `/monitor/<id>`, send an announcement | The candidate's workspace shows it |
| 7 | waqar | Submit twice | One receipt code, same on reload |
| 8 | umar | As the examiner, Quiz 1 marking: mark the written answer 7 of 5, then 4; resolve Q7; publish | 7 refused; Q7 flag shown then resolved; results published |
| 9 | waqar | As the candidate, My results → Quiz 1 → PDF; open `/verify/<code>` signed out | PDF responds `application/pdf`; verify page shows initials and score only |

## Outside services and their fallbacks

The required demo path uses no outside service except Supabase.

| Service | Used for | If it fails or is slow | Recorded answer lives at |
|---|---|---|---|
| Supabase | Database and accounts | Plain error screen with a retry; offline answers stay queued on the phone | Not recorded: it is the product |
| Claude API (optional) | AI Paper Reviewer (extra 8) | "Assistant unavailable"; the checklist still works | `src/features/authoring/recorded/paper-review.json` |

## Reset

`scripts/db reset-demo` removes the demo accounts and Ravi Science College; the next "Try as …" click recreates them with fresh data.
