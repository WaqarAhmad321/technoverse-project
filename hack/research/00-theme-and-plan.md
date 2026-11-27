# Theme & Plan Input: read this before `/shape`

> Written by Umar from the research in this folder. **Waqar:** run `/shape` with this file as the notes, e.g.
> `/shape Follow hack/research/00-theme-and-plan.md. Problem statement: Web-e-Thon Secure Examination Management System.`
> Everything here is a proposal; `/shape` decides the final split and tasks.

| File | Use it for |
|---|---|
| `00-theme-and-plan.md` (this) | Theme, product, demo story, must/should/extras, slices, data shapes, rules |
| `MASTER-problem-solution-map.md` | Every spec section → real problem → what other teams build → what we build → judge test |
| `problem-landscape.md` | All Pakistani problems found, ranking, ideas to avoid |
| `innovation-research.md` | Evidence + prior art + source reliability |
| `innovation-design.md` | Algorithms, schemas, edge cases for the innovation features |

---

## 1. The Theme

### Name & promise (proposal)
- **Product:** **Imtihaan** (امتحان, "exam")
- **Promise:** *"Online exams that survive Pakistan: load-shedding, leaked papers and wrong answer keys."*
- **Pitch line:** *Every feature answers a real Pakistani exam failure, and every one works without a camera, without paid AI, and on a 2G phone.*

### Why this theme wins
- Most teams use Claude, so they'll ship the same generic exam app (login, timer, MCQ autograde, chart, QR, maybe webcam AI). Judges will see it many times.
- The problem statement itself hints at edge cases: *refresh, device clock, duplicate submissions, repeated actions, "not conclusive evidence", "without exposing unnecessary candidate information"*. We design for those **plus** named Pakistani incidents.
- Rules we can't break: **no feature may depend on paid APIs** (so no Claude/OpenAI calls in required features); server-side authorization; fictional test data; README with credentials for all 3 roles; nothing pushed after the deadline.

### Three pillars (how we present innovation, spec §05)
| Pillar | Real problem (evidence in research docs) | What we build | Spec |
|---|---|---|---|
| **Resilience**: "Load-shedding can't fail your exam" | Load-shedding at exam centres; 16 exam-triggered internet shutdowns; ~60% of people on mobile broadband; GCUF students told to retake already-submitted exams | Offline-safe answers, server clock, **activity-aware disruption credit** (time back only if the candidate *couldn't* work), signed **submission receipt** | 5.3 |
| **Fairness & Trust**: "No more MDCAT-style key scandals" | MDCAT wrong keys → Senate panel / court grace marks; BISE rechecking = totals only, Rs 1,200–1,500; Karachi e-marking 35% variance | **Key Doctor** (item analysis flags wrong keys *before* results), question-wide fixes for everyone, **dispute desk** (blind 2nd examiner), **equal-difficulty papers**, hash-chained audit | 5.4, 5.2 |
| **Integrity**: "Leaks get traced, not retested" | MDCAT 2024 Sindh leaked 13h44m early → full retest; Sindh matric 2025 leaks; AI cheating; webcam proctoring fails on 2G | **Leak Tracer** (per-candidate ordering fingerprint + invisible marks) + **leak quarantine**, camera-free integrity signals, **clipboard canary** | 5.5, 5.1 |

Judges reward **quality over quantity**. If time is short, Resilience + Key Doctor + equal-difficulty papers is the minimum winning set.

---

## 2. The People & the Pain (for `hack/requirements.md`)
- **Candidate:** *Ayesha, a 2nd-year student in Lahore on a mid-range Android phone; her area has load-shedding twice a day.* Pain: losing answers/time to outages; never sure her submission counted; can't challenge a wrong key without paying.
- **Examiner:** *Mr. Kamran Siddiqui, lecturer setting a 50-candidate midterm.* Pain: building fair randomized papers, catching key mistakes before students do, handling disputes and leaks without chaos.
- **Admin:** manages accounts/roles; needs everything auditable.
- **Promise:** exams that are fair, recoverable and verifiable, even when the power goes out.

---

## 3. Demo Story (proposal, about 6 min of the 15-min slot; the rest is Q&A)
1. **Open the live URL cold.** The landing line states the promise; one-click demo logins for **Admin / Examiner / Candidate**.
2. **Examiner** opens the question bank (seeded, with topics and difficulty) → creates "Physics Midterm" from a blueprint → **pre-publish checklist** catches "marks don't add up" → fix → publish. **Fairness panel**: balanced vs naive paper difficulty histogram.
3. **Candidate** sees the dashboard (upcoming / open / completed) → **system check** passes → starts the exam: server timer, navigator, autosave pill.
4. **Outage moment:** DevTools → Offline → keeps answering ("3 answers saved on this device") → back online → synced, **0 credit**. Then close the tab for 1 min ("power cut") → reopen → answers restored, **capped credit** shown on the examiner monitor.
5. **Submit** → signed **submission receipt** with QR.
6. **Examiner monitor**: live progress and incidents ("signals for review, not evidence") + a **live correction** pushed mid-exam.
7. **Key Doctor**: after the exam, "Q7: top scorers chose B 71%, key says C" → **publishing blocked** → fix key → all 30 attempts regrade → publish.
8. **Candidate** sees the result → raises a **dispute** → blind review → result v2 → **QR verify page** shows "valid, superseded by v2", minimal info.
9. *(If built)* **Leak Tracer**: paste leaked text → "matches Roll #23" → quarantine → "12% of papers affected, regrade only those".
10. Close: audit chain verify ✅ → "No camera, no paid AI, works on 2G."

---

## 4. Requirements Mapped to the Spec

### Must-haves (core = 30 marks + technical quality 20; demo can't run without these)
| Spec | Must-have |
|---|---|
| 3.1 | Supabase auth, `role` on profile (admin/examiner/candidate), role + ownership checked in **every** server action/page; admin user & role management; 3 demo accounts |
| 3.2 | Exam CRUD: title, instructions, schedule window, duration, total marks, settings; lifecycle draft → published → ongoing → completed (time-derived); pre-publish review |
| 3.3 | Question bank (topic, difficulty, MCQ / multi-select / written), assign to exam, shuffle questions/options, **snapshot per attempt** |
| 3.4 | Enrollment, candidate dashboard (available / upcoming / completed), server-side window enforcement |
| 3.5 | Exam workspace: server-authoritative timer, navigator (answered / unanswered / marked), autosave, refresh-safe resume, review & submit, **server auto-submit at expiry**, idempotent submit |
| 3.6 | Monitor active attempts + incidents + announcements |
| 3.7 | Auto-grade objective (transparent MSQ formula), manual grading of written answers with mark validation, review before publish |
| 3.8 | Controlled publish, own-results-only, exam summary + candidate scores from real data, retained attempts |

### Should-haves (secondary = 15 marks; all 8 are expected)
4.1 heartbeat-based network status · 4.2 server PDF reports (access-checked) · 4.3 sandbox attempts excluded everywhere · 4.4 CSV/JSON import with dry-run + row errors (Urdu encoding, leading zeros, CNIC) · 4.5 question analytics (p, discrimination, distractors, skips) · 4.6 signed QR verification, minimal info · 4.7 saved workspace preferences (font, contrast, layout) · 4.8 scratchpad (text + draw, autosaved, never graded)

### Extras (innovation = 15 marks; in priority order)
1. Offline queue + **activity-aware disruption credit** + submission receipt (5.3)
2. **Key Doctor** + question-wide fix + publish block (5.4)
3. **Equal-difficulty paper generator** + fairness histogram (5.2)
4. **Dispute desk** (blind review, versioned results) + **hash-chained audit** (5.4)
5. **Leak Tracer** + quarantine (5.5)
6. Camera-free integrity signals + **clipboard canary** (5.1)
7. Stretch: live corrections, accommodation extra-time profiles, double-marking, bilingual questions

### Out of scope
Webcam/mic proctoring, any paid AI in required paths, payments, email/SMS sending, native apps, impersonation/biometrics.

### How it scores
- **Core 30:** full lifecycle working live with three roles.
- **Technical 20:** server-side auth on every action, snapshots, idempotent saves, server clock, audit chain, validation.
- **Secondary 15:** all 8, each with a real-world edge.
- **Innovation 15:** three pillars, each tied to a named incident.
- **UI/UX 20:** one consistent look (`ui-design.md`), accessible exam screen, 390px-ready, no template feel.

---

## 5. Proposed Slices (two people, two Claudes)

The kit says the riskiest slice goes to Waqar. **Swap if Umar prefers delivery.**

### Slice A: "Exam Delivery & Resilience" (Waqar, riskiest)
- **Covers demo steps:** 3, 4, 5, 6 (candidate side + live monitor)
- **Screens:** `/exams` (candidate dashboard), `/exams/[id]/check` (system check), `/exams/[id]/take` (workspace), `/exams/[id]/receipt`, `/monitor/[examId]` (examiner live board)
- **Writes:** `attempts`, `attempt_questions` (snapshot), `answers`, `incidents`, `heartbeats`, `credits`, `announcements`, `preferences`, `scratchpads`
- **Reads:** `exams`, `questions`, `exam_questions`, `enrollments` (Slice B). Stand-in: seeded sample exam until B lands.
- **Innovation:** offline queue, disruption credit, receipt, integrity signals, canary, live corrections.

### Slice B: "Exam Authoring, Grading & Trust" (Umar)
- **Covers demo steps:** 2, 7, 8, 9 (+ admin)
- **Screens:** `/admin/users`, `/questions` (bank + import), `/manage/exams` (+ `/new`, `/[id]` setup, publish checklist, fairness), `/grading/[examId]`, `/results/[examId]` (analytics, Key Doctor, publish), `/my-results`, `/disputes`, `/verify/[code]` (public), `/leaks/[examId]`
- **Writes:** `exams`, `questions`, `exam_questions`/blueprint, `enrollments`, `grades`, `results` (versioned), `disputes`, `key_fixes`, `audit_events`, `reports`
- **Reads:** `attempts`, `answers`, `incidents` (Slice A). Stand-in: seeded 30 fake submitted attempts (one with a wrong key on Q7) until A lands.
- **Innovation:** Key Doctor, paper generator, disputes, audit chain, QR verify, leak tracer + quarantine, importer.

**Contract between slices:** the paper generator (B) exposes a pure function `generatePaper(examId, candidateId) → snapshot rows` in `src/lib/` (shared), which A calls when an attempt starts. Grading reads A's `answers` + snapshot keys.

---

## 6. Data Shapes (draft for `hack/architecture.md`; Supabase / Postgres)

Kit rule: every table has `user_id → auth.users on delete cascade`. Here `user_id` = **the owner of the row** (examiner for exam content, candidate for attempt data). All access goes through server code that checks role + ownership.

```
profiles           (existing) + role text check in ('admin','examiner','candidate'), cnic_masked text, accommodation_extra_pct int default 0
questions          writer: B   user_id(examiner), topic, difficulty_label, type('mcq','msq','written'), text, options jsonb, answer_key jsonb, marks, msq_rule('all_or_nothing','partial'), version int, created_at
exams              writer: B   user_id(examiner), title, instructions, opens_at, closes_at, duration_minutes, total_marks, settings jsonb(shuffle, credit_cap_pct, auto_credit_max_s), status('draft','published','completed'), results_published_at
exam_questions     writer: B   user_id(examiner), exam_id, question_id, slot (blueprint section/topic), position
enrollments        writer: B   user_id(examiner), exam_id, candidate_id
attempts           writer: A   user_id(candidate), exam_id, is_sandbox, status('in_progress','submitted','auto_submitted'), started_at, base_deadline_at, credit_seconds, watermark_code, paper_difficulty, integrity_score, submitted_at, receipt_signature, active_session_id
attempt_questions  writer: A   user_id(candidate), attempt_id, position, question_id, text_snapshot, options_snapshot, answer_key_snapshot (never sent to client), marks, difficulty
answers            writer: A   user_id(candidate), attempt_id, question_id, response jsonb, client_seq, client_op_id unique, authored_offline, marked_for_review, received_at
incidents          writer: A   user_id(candidate), attempt_id, type, severity, details jsonb, status, created_at
announcements      writer: A   user_id(examiner), exam_id, body, question_id null (correction), created_at
grades             writer: B   user_id(examiner), attempt_id, question_id, marks_awarded, rubric jsonb, grader_id
results            writer: B   user_id(candidate), attempt_id, version, total, breakdown jsonb, reason, is_current, verify_code
disputes           writer: B   user_id(candidate), attempt_id, question_id, category, body, status, reviewer_id, independent_mark, decision_reason
audit_events       writer: B (shared helper in src/lib/audit.ts) actor_id, action, entity, payload, prev_hash, hash
preferences        writer: A   user_id, prefs jsonb
```

---

## 7. How We Proceed (timeline for today, 10:00–20:00)

| Time | What |
|---|---|
| now | Waqar: `/shape` using this file → confirm the split in one message → shared core (roles, 3 demo logins, nav, seed data) lands |
| +15 min | Both: `/start <name>` → `/next` |
| until ~15:30 | **Must-haves only**, both slices, in demo-story order. Stub every screen first (task 010) so the whole story is clickable early |
| ~15:30–18:00 | Should-haves (all 8 secondary), then extras in the priority order above |
| ~18:00–19:30 | Freeze: `/polish`, `/judge`, rehearse the **torture tests** (MASTER doc §5), README with credentials + innovation write-up |
| 19:30–20:00 | Final check on the live URL, backup video, **no pushes after 20:00** |

**Cut order if behind:** leak tracer → canary/integrity → disputes → equal difficulty. **Never cut:** the core lifecycle, the server timer/offline save, Key Doctor.

---

## 8. Non-negotiable Rules (from the spec, for both Claudes)
1. Every page/action: `requireUser()` + role check + ownership check. Hiding buttons doesn't count.
2. `answer_key_snapshot`, watermark, canary and integrity scores **never** reach a candidate response.
3. Time comes from the server only. Deadline = `base_deadline_at + credit_seconds`.
4. Submits and saves are idempotent; double-click = one submission.
5. Sandbox attempts are excluded from every stat, result and analytic.
6. Integrity signals are "for review", never automatic penalties.
7. No paid API in any required feature. Fictional Pakistani sample data only (no real CNICs).
