# MASTER: Real Problems → Our Solutions (Web-e-Thon)

> **One document with every idea.** Each spec requirement is mapped to: the real problem it hides (with Pakistani evidence), what *every other team* will build (the default answer Claude/ChatGPT gives), what **we** build instead, and how the judge will test it.
> Deeper docs: [`problem-landscape.md`](./problem-landscape.md) · [`innovation-research.md`](./innovation-research.md) · [`innovation-design.md`](./innovation-design.md)
> Last updated 27 Nov 2026.

---

## 0. Strategy in One Paragraph

Most teams will ask an AI "build me a secure exam system" and get the same app: role login, exam CRUD, MCQ timer, auto-grade, a chart, a jsPDF report, a QR code, tab-switch counter, maybe webcam proctoring. Judges will see that app 20 times. **We win on the edge cases the spec quietly hints at** (the spec text is full of them: "refreshes", "repeated actions", "device clock", "duplicate submissions", "not conclusive evidence", "without exposing unnecessary candidate information") **and on Pakistani reality** (load-shedding, leaks, wrong keys, recount-only rechecking, fake result cards, Urdu CSVs). Every feature gets a *one-line real incident* + a *90-second demo* + *a judge test it survives*.

---

## 1. Spec → Real Problem → Baseline vs Ours

Legend: **Effort** = extra time beyond the baseline. ⭐ = a differentiator worth showing in the demo.

### 3.1 Authentication & Authorization
| | |
|---|---|
| **Real problem** | Examiner accounts holding answer keys are the juiciest target; leaks often come from *insiders* (MDCAT 2024: doctors in the network; Karachi Board show-cause to a former Controller). CAA pilot scandal: 262/860 pilots hadn't sat their own exams; 28 tests logged on a *closed holiday*, a sign of admin-side tampering. |
| **Baseline (everyone)** | JWT + role middleware + hidden buttons. |
| **Ours** | Role **and ownership** checks in one policy layer (`can(user, action, resource)`), tested with a "403 matrix". **Admin actions are audited** in the hash-chained log (who changed a role, who reopened an exam). Optional TOTP 2FA for examiners (free, `otplib`). Login rate-limit + lockout. ⭐ **Separation of duties**: the paper setter ≠ the result publisher (optional two-person approval to publish results, mirroring boards' setter/moderator split). |
| **Judge test** | Candidate calls `GET /api/attempts/<other id>` → 403. Examiner B opens Examiner A's exam → 403. |
| **Effort** | Policy layer 45 min · 2FA 30 min (stretch) · 2-person publish 30 min |

### 3.2 Examination Management (lifecycle)
| | |
|---|---|
| **Real problem** | BISE Mardan handed **Class 11 students the Class 9 maths paper**, twice in one week. Karachi University entrance test: question numbers jumped 20 → 41. Wrong paper / broken paper reaches candidates because nobody checked. |
| **Baseline** | Status dropdown draft/published. |
| **Ours** | State machine enforced on the server (draft → published → ongoing → completed, no illegal jumps; status derived from server time, not a manual flag). ⭐ **Pre-publish checklist** that blocks publishing on: marks don't add up to total marks, a question with no correct key, a blueprint pool too small for the number of papers, no candidates enrolled, schedule in the past, duration > window. ⭐ **Scheduling guard**: warn if the exam overlaps Jumu'ah (Fri 12:30–14:30 PKT) or runs past midnight; all times shown in PKT. |
| **Judge test** | Try publishing an exam whose questions total 45 marks with total marks = 50 → blocked with a clear message. |
| **Effort** | 45 min |

### 3.3 Question Management
| | |
|---|---|
| **Real problem** | Lahore Board 2017: **Urdu and English versions of the same question asked different things**; invigilators told students to "answer both ways". Multiple-select marking rules are never explained to candidates → disputes. |
| **Baseline** | Question CRUD, MCQ/MSQ/written, shuffle. |
| **Ours** | Versioned questions (edits create a new version; active attempts keep their snapshot, which the spec requires). ⭐ **Transparent marking schemes**, shown to candidates in the instructions: single MCQ: `+m` / `0` / optional negative `−m/4`; multiple-select: choose *all-or-nothing* or *partial* = `max(0, (correct_picked − wrong_picked) / total_correct) × m` (floor at 0, the standard "no guess-everything" rule). Optional bilingual fields (EN + اردو) with a "both versions reviewed" checkbox before publish. |
| **Judge test** | Pick 2 of 3 correct + 1 wrong on MSQ → score matches the displayed formula exactly. |
| **Effort** | Partial formula 20 min · bilingual 45 min (stretch) |

### 3.4 Candidate Management
| | |
|---|---|
| **Real problem** | Accommodations are ad hoc: HEC protocol gives **25% extra time** where a writer is used; universities give 25–75%; PPSC 15/30 min. Students in shared homes/labs share devices. |
| **Baseline** | Enroll list; dashboard with upcoming/completed. |
| **Ours** | ⭐ **Accommodation profile** per enrollment (extra time %, larger font, high contrast) → **server-enforced** deadline modifier. Clear candidate dashboard states: *Not yet open (opens in 2h 14m)* · *Open now* · *In progress (resume)* · *Submitted, awaiting results* · *Results published*. **Shared-device safety**: on submit/logout, clear IndexedDB + local drafts for that attempt. |
| **Judge test** | Candidate tries to open an exam 5 min early → blocked server-side with countdown. Candidate with 25% accommodation gets a 75-min timer on a 60-min exam. |
| **Effort** | 40 min |

### 3.5 Examination Interface ⭐ (most-tested area)
| | |
|---|---|
| **Real problem** | GCUF online exam: slow portal, **students asked to retake exams they had already submitted**. Lahore School: submission failed on Macs, non-Chrome browsers, and some *time-zone settings*. Load-shedding mid-exam. |
| **Baseline** | Timer from `Date.now()`, localStorage autosave, a submit button. |
| **Ours** | • **Server-authoritative timer** (offset-corrected; device clock irrelevant).<br>• **Offline answer queue** in IndexedDB + idempotent batch saves (`op_id`, `client_seq`). Never loses an answer.<br>• Save-status pill: Saved / Saving / Offline (n answers on device) / Reconnecting.<br>• ⭐ **Signed Submission Receipt**: on submit, the server returns a receipt `{attempt, submitted_at, answers_hash, signature}`, downloadable as PDF/QR. If anyone later claims "you never submitted", the candidate holds cryptographic proof. Fixes the GCUF failure.<br>• ⭐ **Pre-exam system check** (like Pearson VUE): browser support, storage available, clock skew vs server, connection latency, with a practice question. Fixes the Lahore School browser/time-zone failures *before* the exam.<br>• Auto-submit at expiry by the **server** (works even if the tab is closed).<br>• Navigator: answered / unanswered / marked-for-review, keyboard shortcuts. |
| **Judge test** | Refresh, close the tab, change the PC clock, double-click submit, go offline: all handled. |
| **Effort** | Receipt 30 min · system check 40 min (rest is core) |

### 3.6 Examination Monitoring
| | |
|---|---|
| **Real problem** | Invigilators had no way to correct a paper error (Lahore 2017, Lahore 2024 maths Q10). Monitoring tools treat flags as guilt (biased webcam AI, false positives). |
| **Baseline** | Table of active attempts + an announcement box. |
| **Ours** | Live board: per-candidate progress, connection state (online / offline-working / lost), integrity signals as **"signals for review"**. ⭐ **Live Errata**: examiner issues a correction for Qn mid-exam → pushed to every active candidate (SSE with polling fallback for 2G), pinned on that question, **each candidate's acknowledgement recorded**, the correction versioned in the audit log, and an optional automatic time credit (e.g. +2 min) for everyone. ⭐ Incident review queue with dismiss/confirm + reason (never automatic penalties). |
| **Judge test** | Send an announcement while a candidate is offline → they get it on reconnect. |
| **Effort** | Errata 45 min |

### 3.7 Evaluation & Grading
| | |
|---|---|
| **Real problem** | **Karachi e-marking trial: 35% variation vs manual marking (62,000 scripts).** 400+ Rawalpindi examiners penalized for wrong marking. Peshawar High Court overturned an erroneous **zero**. Board rechecking only verifies *totals*. |
| **Baseline** | Auto-grade MCQs, a number input for written answers. |
| **Ours** | Rubric-based manual grading (per-criterion, validated `0 ≤ mark ≤ max`, totals computed by the server, so totaling errors are impossible). ⭐ **Blind double-marking of a random 10% sample** → discrepancy > 20% → moderator. ⭐ **Examiner consistency panel** ("Examiner X averages 18% below second markers"). Grading state machine: ungraded → graded → moderated → locked; results can't publish with ungraded items. |
| **Judge test** | Enter 12/10 → rejected. Try to publish with an ungraded essay → blocked. |
| **Effort** | Rubric 40 min · double-marking 1 h (stretch) |

### 3.8 Results & Analytics
| | |
|---|---|
| **Real problem** | **MDCAT 2026: Senate panel flagged 6 disputed questions/wrong keys *after* results**; KMU/SZABMU grace-marks court cases; students not allowed to keep their papers. Rawalpindi 2020: flawed maths question, board considered compensating *only students who attempted it*; parents demanded *everyone*. |
| **Baseline** | Publish button, bar chart of scores. |
| **Ours** | ⭐⭐ **Key Doctor**: item analysis (difficulty `p`, discrimination `D = p_top27 − p_bottom27`, distractor pick rates by top/bottom group) flags *likely wrong keys* ("top scorers chose B 71%, key says C, D = −0.32") and **blocks publishing** until resolved. ⭐ **Provisional key + challenge window**: candidates view *their own* paper with the provisional key and challenge items before final results. Question-wide resolution with explicit policy (*accept both / full marks to all / drop and rescale / credit only attempters*), applied to **every** attempt, versioned results, notification of changes. Analytics: score distribution, pass rate, per-topic mastery, all from real non-sandbox data. |
| **Judge test** | Seed a wrong key → flagged before publishing. Candidate sees only their own results. |
| **Effort** | Key Doctor 1–1.5 h · challenge window 45 min |

---

## 2. Secondary Features (4.1–4.8): Baseline vs Ours

| Feature | Baseline (everyone) | Ours (real-world edge) | Effort |
|---|---|---|---|
| **4.1 Network-aware** | `navigator.onLine` banner | `onLine` lies (it's "online" on captive Wi-Fi / dead 4G) → **heartbeat-based** detection, latency badge, queued-answer count, "last saved 4s ago", retry with backoff | in F1 |
| **4.2 PDF reports** | jsPDF screenshot | Server-generated PDF (exam report + candidate report), **access-checked**, contains the verification ID/QR, Urdu-capable font, no answer keys in candidate PDFs before results | 1 h |
| **4.3 Sandbox** | "Preview" page | Real attempt with `is_sandbox=true`, **excluded at the query layer** (stats, Key Doctor, difficulty, analytics, disputes), reset button, "SANDBOX" watermark | 40 min |
| **4.4 Bulk import** | Parse CSV, insert | ⭐ **Pakistan-proof importer**: detect encoding (Excel saves Urdu CSV as UTF-16/ANSI, which garbles it) → UTF-8 BOM handling; **preserve leading zeros** in roll numbers (Excel drops them); validate CNIC `#####-#######-#`, phone `+92 3xx`, emails; duplicate detection; **dry-run preview with row-level errors** ("Row 14: CNIC has 12 digits") before committing; all-or-nothing transaction; downloadable error CSV | 1 h |
| **4.5 Question analytics** | % correct per question | Difficulty `p`, discrimination `D`, distractor analysis, skip rate, avg time per question, **observed vs labelled difficulty** mismatch, which also feeds Key Doctor and F4 | in Key Doctor |
| **4.6 Verifiable reports** | QR → URL showing the full result | ⭐ **Offline-verifiable signed QR** (Ed25519 signature over `{report_id, exam, name_initials, score, version, issued_at}`): verify page shows *only* minimal info ("M. A***, Physics Mid, 72/100, valid, v2 current"). Also shows **"superseded by v2"** after disputes. Real-world hook: the **fake-degree scandals** (PIA/CAA: 16 pilots + 65 crew suspended for fake qualifications; 262 pilots under inquiry over exams). Employers can verify a result card without calling anyone. | 1 h |
| **4.7 Custom workspace** | Dark mode toggle | Font size, high contrast, one-question vs list layout, navigator position, **reduced motion**, Urdu/English UI, saved **server-side per user** (works across devices: phone dies → laptop keeps the preferences) | 40 min |
| **4.8 Scratchpad** | A textarea | Text + **drawing canvas** (pointer events, works on phones), per-question, autosaved with the offline queue, **never graded and never sent to examiners** (privacy, stated clearly), and the canary paste-stripper applies | 45 min |

---

## 3. Innovation Pillars (Section 05)

Full design in `innovation-design.md`. Summary of the problem → solution mapping:

| Pillar | Real problem (evidence) | Our solution | Spec |
|---|---|---|---|
| 🔌 **Resilience** | Load-shedding at exam centres; 16 exam-triggered internet shutdowns; ~60% on mobile broadband; vendors either let the timer run (Xobin) or terminate (Pearson VUE) | **Outage-proof exam**: offline queue, heartbeats, **activity-aware disruption credit** (time back only if the candidate *couldn't* work), capped, examiner-approved, device takeover; lite mode (< 300 KB exam session) | 5.3 |
| ⚖️ **Fairness & Trust** | MDCAT wrong keys + grace-marks court cases; recount-only rechecking (Rs 1,200–1,500); 35% marking variance; "paper too hard" protests | **Key Doctor** + provisional-key challenge · **Dispute Desk** (blind 2nd examiner, no-penalty rule, question-wide fixes, versioned results, hash-chained audit) · **Equal-difficulty papers** (CTT difficulty + hill-climb + fairness histogram) · double-marking | 5.4, 5.2 |
| 🔒 **Integrity** | MDCAT 2024 leaked 13h44m early → province-wide retest; Sindh matric leaks; AI cheating; webcam proctoring fails on 2G and is biased | **Leak Tracer** (ordering fingerprint + zero-width marks + overlay) + **Leak Quarantine** (regrade only affected papers) · **Camera-free signals** + **clipboard canary** + mini-viva follow-up | 5.5, 5.1 |

---

## 4. Small Real-World Touches (cheap, judges notice them)

| Touch | Why it matters |
|---|---|
| All times in **PKT** with explicit "(PKT)" label; server stores UTC | Lahore School failure mode was time-zone related |
| **Jumu'ah / late-night scheduling warning** | Real scheduling conflict in Pakistan |
| Countdown to opening on a locked exam card ("Opens in 1h 12m") | Removes "is it broken?" panic |
| Confirm dialog before submit lists **unanswered + marked-for-review counts** | Prevents accidental submit |
| "You are submitting with 4 min left" vs "Time's up: we submitted your last saved answers at 10:59:58 (PKT)" | Clear, reassuring |
| Error messages in plain language, never stack traces | Spec: "communicate failures clearly" |
| Exam route weight shown in README ("Exam session < 300 KB") | Works on cheap phones/2G |
| Screen-reader timer announcements every 5 min via `aria-live="polite"` | KU student took exams with JAWS; accessibility marks |
| Roll numbers kept as strings | Excel drops leading zeros |
| CNIC masked in UI/PDF (`35202-*******-1`) | "Don't expose unnecessary personal info" |
| Rate-limit login + answer saves | Hammering/DoS from refresh loops |
| Seed script with realistic **fictional** Pakistani data (names, CNIC-format dummies, 3 exams in different states, 30 attempts incl. one wrong key) | Demo in seconds; spec requires test data |

---

## 5. Judge Torture Tests: Expected Behaviour (rehearse all of these)

| # | Judge does… | We show… |
|---|---|---|
| 1 | Changes laptop clock +1 h mid-exam | Timer unchanged |
| 2 | Refreshes / closes tab / reopens | Same answers, same remaining time |
| 3 | DevTools → Offline, answers 3 Qs, back online | "3 answers saved on device" → "Saved", no loss, 0 credit |
| 4 | Double-clicks Submit / replays the request | One submission; second returns the same receipt |
| 5 | Edits attempt ID in the URL / API | 403 |
| 6 | Opens exam before start time via direct URL | Blocked server-side with countdown |
| 7 | Inspects network responses | No answer keys, no other candidates' data, no canary/watermark |
| 8 | Edits a question while an attempt is active | Active attempt keeps its snapshot |
| 9 | Enters marks > max | Rejected with message |
| 10 | Tries to publish with ungraded answers / flagged keys | Blocked with checklist |
| 11 | Imports a CSV with bad rows | Dry-run shows row-level errors, nothing committed |
| 12 | Scans the QR on a PDF | Minimal-info verification page, valid/superseded |
| 13 | Uses a sandbox attempt | Not visible in stats/analytics/results |
| 14 | Lets the timer hit zero with the tab closed | Server auto-submits with last saved answers |
| 15 | Asks "is a tab-switch proof of cheating?" | "No. Signals for review; examiner decides; candidate can dispute" |

---

## 6. Priority (what to build, in order, after core)

Core comes first (Section 3 = 30 marks, Technical quality = 20). Many items above *are* core done well, so they cost little extra.

| Order | Item | Why first |
|---|---|---|
| 1 | Server timer + offline queue + receipt + system check | Core 3.5 + 4.1 + F1 foundation; most-tested |
| 2 | Policy layer + audit chain | Security marks + used by everything |
| 3 | **Key Doctor** + question-wide fix | Highest impact/effort; MDCAT story |
| 4 | Disruption credit + monitoring board + live errata | Completes the Resilience pillar |
| 5 | Equal-difficulty generator + fairness histogram | Completes 5.2 |
| 6 | Pakistan-proof importer + signed QR + sandbox exclusion | Secondary marks with real-world edge |
| 7 | Leak Tracer + quarantine | Wow demo |
| 8 | Dispute desk + challenge window | Completes Trust pillar |
| 9 | Camera-free signals + clipboard canary | Integrity pillar |
| 10 | Double-marking, bilingual, 2FA, two-person publish | Stretch |

**If time collapses:** 1 → 2 → 3 → 4 is a complete, defensible submission.

---

## 7. Idea Log (append new ideas here)

| Date | Idea | Problem | Status |
|---|---|---|---|
| 27 Nov | Outage-proof exam / activity-aware credit | Load-shedding, shutdowns | Designed |
| 27 Nov | Leak Tracer + quarantine | MDCAT 2024, Sindh 2025 | Designed |
| 27 Nov | Dispute Desk | Recount-only rechecking | Designed |
| 27 Nov | Equal-difficulty papers | "Paper too hard" | Designed |
| 27 Nov | Camera-free integrity + clipboard canary | AI cheating, 2G | Designed |
| 27 Nov | Key Doctor + provisional key challenge | MDCAT wrong keys | Designed |
| 27 Nov | Double-marking + examiner consistency | 35% e-marking variance | Designed |
| 27 Nov | Signed submission receipt | GCUF "retake though submitted" | New |
| 27 Nov | Pre-exam system check | Lahore School browser/time-zone failures | New |
| 27 Nov | Live errata with acknowledgements | Lahore 2017/2024 paper errors | New |
| 27 Nov | Pre-publish checklist | Mardan wrong-paper blunder | New |
| 27 Nov | Pakistan-proof CSV importer | Urdu encoding, leading zeros, CNIC | New |
| 27 Nov | Offline-verifiable signed QR | Fake degree / CAA pilot scandals | New |
| 27 Nov | Accommodation profiles | HEC 25% extra-time protocol | New |
| 27 Nov | Transparent marking formulas | MSQ disputes | New |

---

## Sources (new in this document; earlier ones are in the companion docs)
- [GCUF online exam fiasco: slow portal, retakes despite submission (Dawn)](https://www.dawn.com/news/1611610)
- [Lahore School mock-exam submission failures on Macs / browsers / time zones (Crux)](https://www.crux.pk/mistreatment-by-pakistani-university-administrations-the-lse-deans-questionable-comments-and-the-lums-fee-hike/)
- [Universities in Lahore struggle with online class (The News)](https://www.thenews.com.pk/tns/detail/664917-the-online-class)
- [AIOU online system "a mess" (APP)](https://www.app.com.pk/national/487789/)
- [NUML students protest online exams (Pakaffairs)](https://pakaffairs.pk/pakistan/7142/numl-university-students-protest-against-online-exams/)
- [CAA reveals massive irregularities in pilots' exams (Tribune)](https://tribune.com.pk/story/2300044/caa-reveals-massive-irregularities-in-pilots-exams)
- [Licences of 16 pilots, 65 cabin crew suspended over fake degrees (Dawn)](https://www.dawn.com/news/1456452)
- [Clipped wings: how Pakistan's aviation was grounded (Dawn)](https://www.dawn.com/news/1587854)
- [Pakistan terminates 50 pilots (Daily Times)](https://dailytimes.com.pk/822000/pakistan-terminates-50-pilots-possessing-fake-degrees/)
- [Class 11 given Class 9 paper in Mardan (Geo)](https://www.geo.tv/latest/362591-class-11th-students-mistakenly-given-question-paper-of-class-9th-in-mardan)
- [BISE Mardan blunder again (ProPakistani)](https://propakistani.pk/2021/08/06/bise-mardan-makes-a-huge-blunder-in-intermediate-exams-yet-again/)
- [Karachi University erroneous question paper (Geo)](https://www.geo.tv/latest/324084-karachi-university-leaves-candidates-confused-with-erroneous-question-paper)
- [Grave mistakes in Lahore board papers, Urdu/English mismatch (Geo)](https://www.geo.tv/amp/135599-Grave-mistakes-found-in-Lahore-boards-exam-papers)
- [Error in Lahore Board matric maths paper 2024 (24NewsHD)](https://www.24newshd.tv/11-Mar-2024/error-in-lahore-board%E2%80%99s-matric-mathematics-paper-causes-concern-among-students)
- [Pindi BISE may compensate students for flawed maths paper (The News)](https://thenews.com.pk/print/630011-pindi-bise-may-compensate-students-for-ssc-maths-flawed-paper)
- [Multiple-select / negative marking conventions (Leeds Beckett)](https://www.leedsbeckett.ac.uk/teachlearn/mybeckett-and-digital-learning-guides/mybeckett/negative-marking-tests/), [UMass PARE](https://openpublishing.library.umass.edu/pare/article/1669/galley/1620/view)
- [Senate panel on MDCAT complaints (Minute Mirror)](https://minutemirror.com.pk/senate-panel-warns-of-fia-probe-over-mdcat-complaints-against-pmdc-648218/)
- [Karachi board 35% e-marking variance (ProPakistani)](https://propakistani.pk/2026/07/08/karachi-board-postpones-matric-science-group-results/amp/)
- [HEC exam accommodation letter, Mar 2026 (PDF)](https://www.fu.edu.pk/uploads/Letter-(RAA)%20HEC-IBD%2002.03.2026.pdf)
