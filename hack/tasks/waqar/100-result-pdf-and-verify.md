---
status: todo
tier: must
review: yes
---
# Result PDF with a QR that verifies it

## Goal
Ayesha downloads her result as a PDF; anyone who scans its QR sees that it is genuine without seeing more than they need. Covers secondary features 4.2 (PDF from real data, access-checked) and 4.6 (verifiable report, minimal information), and story step 9.

## What to build
- `/results/[resultId]/pdf`: a route handler, same access rule as the result page (the candidate, or an examiner of the institution). Generates the PDF on the server (pick a small library such as `pdf-lib` or `@react-pdf/renderer`; log the choice) with the institution name, exam, candidate name and roll number, date, score, the breakdown, the result version, and a QR pointing at `/verify/<verify_code>` (`qrcode` package).
- `/verify/[code]` (public, outside the login area): "Valid result" with institution, exam, candidate initials only ("A. K."), score, version and published date. If a newer version exists: "This report was superseded by version 2 on 3 Dec." Unknown code: "We could not find a result with this code." No email, CNIC, roll number or answers.
- A rate limit is not needed today; codes are long enough not to guess (10+ characters).

## Done when
"Try as candidate" → Physics Pre-test result → "Download PDF report": a readable one-page PDF opens with the QR; opening the QR's link in a private window shows the minimal verify page.

## Owns
`src/features/delivery/`, `src/app/(app)/results/`, `src/app/verify/`.

## Stand-ins
None.
