# Requirements

Product: **Imtihaan** (امتحان). Event brief: `hack/research/IMTIHAAN-complete-brief.md`. Evidence and algorithms: the rest of `hack/research/`.

## The person, the pain, the promise

- **The person:** Ayesha, a second-year student in Lahore on a mid-range Android phone, and Mr. Kamran Siddiqui, the lecturer who sets her 50-candidate midterm.
- **The pain:** load-shedding and bad internet cost her answers and time, and a wrong answer key costs her marks she can only get back by paying for a recount.
- **The promise:** online exams that survive Pakistan: load-shedding, leaked papers and wrong answer keys.

## The demo story

About six minutes of the fifteen-minute slot; the rest is questions and hands-on testing. The smoke test walks exactly these steps. Two browser windows: examiner on the left, candidate on the right.

1. **Open the live URL cold.** The judge reads the promise in one line and sees three buttons: "Try as examiner", "Try as candidate", "Try as admin".
2. **Institution admin (Sana Iqbal)** of Ravi Science College opens People, finds Bilal Ahmed, makes him an examiner. The change shows at once and lands in the audit log; a candidate who types `/admin/people` gets "not found". (The platform admin's screen lists institutions above her; shown only if a judge asks.)
3. **Examiner (Kamran Siddiqui)** opens the question bank (Physics, seeded with topics and difficulty), opens the draft "Physics Midterm" and presses "Review and publish". The checklist stops him: "Questions add up to 45 marks, the exam says 50". He adds one 5-mark question, the checklist turns clean, he publishes.
4. **Candidate (Ayesha Khan)** sees My exams split into open, upcoming and completed. She opens Physics Midterm, reads the instructions, starts. The workspace shows the time left from the server, the question navigator (answered, unanswered, marked for review) and "Saved".
5. **The outage moment.** The presenter turns the network off. Ayesha keeps answering; the bar says "Offline: 3 answers kept on this phone". Network back on: "All answers saved". She refreshes the page: every answer and the remaining time come back.
6. **Examiner live monitor.** Kamran sees Ayesha's progress and an "Offline for 40s" signal marked "for review, not evidence". He sends an announcement, "Q4: take g = 10 m/s²", and it appears in Ayesha's workspace within a few seconds.
7. **Submit.** Ayesha reviews her answers and submits (a double click makes one submission). She gets a receipt with a short code and the time the server accepted it.
8. **Grading and the Key Doctor.** On the finished "Physics Quiz 1" (30 submitted attempts), objective answers are already marked. Kamran grades the one written answer; typing 7 out of 5 is refused. The Key Doctor flags "Q7: 71% of the top scorers chose B, the key says C" and publishing is blocked. He fixes the key, all 30 attempts are regraded, he publishes.
9. **Ayesha's result.** She sees her Quiz 1 result with the corrected Q7, downloads the PDF report, and the QR on it opens the public verify page: valid, initials only, exam, score, version.
10. **Close.** "No camera, no paid AI, works on a 2G phone."

## Must-haves

Only what the story and the core marks (spec §03) need, running for real.

- **Institutions and roles (3.1):** a super admin above institutions; each institution has its own admins, examiners and candidates through memberships; one-click demo account for each role; every page and action checks institution, role and ownership on the server through one policy function; the institution admin lists people and changes roles; the super admin creates an institution and names its first admin.
- **Question bank (3.3):** create and edit single-answer, multiple-select and written questions with topic, difficulty and marks; assign them to an exam.
- **Exams (3.2):** create an exam with title, instructions, opening and closing time, duration, total marks and shuffle settings; draft, published, ongoing, completed, derived from server time; the pre-publish checklist blocks a broken exam.
- **Candidates (3.4):** the examiner enrolls candidates from a roster; the candidate sees open, upcoming and completed exams; nobody enters an exam they are not enrolled in or outside its window.
- **The exam workspace (3.5):** server timer; navigator with answered, unanswered and marked for review; autosave; offline answers kept on the device and sent when back; refresh and return restore answers and time; review and submit; one submission per attempt; the server finishes the attempt at expiry with the answers it received in time; questions and options shuffled per candidate and fixed at start.
- **Live monitor (3.6):** active attempts with progress, connection signals worded as signals for review, announcements during the exam.
- **Grading (3.7):** automatic marks for single and multiple-select answers (multiple-select formula shown); manual marks for written answers, never above the question's marks; totals from the server.
- **Results (3.8):** the Key Doctor flags suspect keys and blocks publishing until resolved; fixing a key regrades every attempt; controlled publish; a candidate sees only their own published results; an exam summary from real submissions.
- **Receipt:** the submission receipt with a code and server time.

## Should-haves

The eight secondary features (spec §04). Judges expect all eight.

- **Network-aware interface (4.1):** connection status from heartbeats, not `navigator.onLine`; "last saved 4s ago"; queued count.
- **PDF report (4.2):** the candidate's result as a PDF from real data, only for its owner and the examiner; carries the verify QR.
- **Exam sandbox (4.3):** "Preview as candidate" runs the real workspace; sandbox attempts never count in results or statistics.
- **Bulk import (4.4):** candidates and questions from CSV or JSON, with a dry run that lists row-level errors and an all-or-nothing commit; roll numbers kept as text.
- **Question analytics (4.5):** per question: share correct, discrimination, how often skipped, distractor choices, observed against labelled difficulty.
- **Verifiable reports (4.6):** a public verify page by code or QR showing initials, exam, score and version only; a superseded result says so.
- **Custom workspace (4.7):** font size, contrast and layout chosen by the candidate, kept on the server.
- **Scratchpad (4.8):** rough work per question, saved with the attempt, never graded, private to the candidate.

## Extras

What makes a judge say "they did that too?". In priority order; each is tied to a named Pakistani incident in the research.

1. **Fair time back after an outage (5.3):** no extra time if she kept working offline; capped credit if she could not; the examiner approves anything above five minutes.
2. **Dispute desk (5.4):** the candidate challenges a question from her result; a blind second examiner decides with a reason; question-wide fixes reach everyone; results are versioned and the verify page shows "superseded by v2".
3. **Equal-difficulty papers (5.2):** each candidate's random paper is balanced to the same expected difficulty; a histogram shows naive against balanced.
4. **Tamper-evident audit log:** every key change, regrade and publish in a hash chain, with a "verify chain" button.
5. **Leak Tracer (5.5):** paste a leaked paper, see which candidate's question order it matches, quarantine the papers not yet started.
6. **Camera-free integrity signals (5.1):** tab switches, pastes and timing anomalies as a review list, never a penalty.
7. **Governance roles:** controller of examinations approves result publication, blind marking with coded candidate ids, an examiner transparency panel, candidate complaints. Research: `hack/research/governance-roles-transparency.md`.
8. **Paper Reviewer (optional AI):** flags ambiguous wording or a suspicious key before publish; recorded answers in demo mode; the checklist works without it.

## Out of scope

Webcam or microphone proctoring, any paid AI in a required feature, payments, email or SMS, native apps, biometrics and impersonation checks, Urdu translation of the interface. The full Pakistani exam hierarchy (controller, deputies, moderators, invigilators, committees) is designed for in the data shapes but built only as extras.

## How it scores

- **Core functionality (30):** the full lifecycle runs live for all three roles, from question bank to published result.
- **Technical quality and reliability (20):** server-side role and ownership checks everywhere, server time, per-attempt snapshots, one submission per attempt, offline-safe saves, validation on both sides.
- **UI/UX (20):** one calm, consistent look; the exam workspace works with a keyboard and a screen reader and at 390px; every screen has its four states.
- **Secondary features (15):** all eight working with real data, each with a Pakistani edge (Urdu-safe import, heartbeat status, minimal-info verify).
- **Open innovation (15):** the outage-proof exam (5.3) and the Key Doctor (5.4) shown live, each answering a named incident.
