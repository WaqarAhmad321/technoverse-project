# Web-e-Thon — Problem Landscape & Idea Shortlist

> Broad scan of real Pakistani examination problems that a 10-hour hackathon team can **actually solve and demo**, ranked for impact, feasibility and *differentiation* (most teams are using Claude too → generic ideas will collide).
> Companion docs: [`innovation-research.md`](./innovation-research.md) (deep evidence for the first five) · [`innovation-design.md`](./innovation-design.md) (implementation design).
> Researched 27 Nov 2026.

---

## 1. The "everyone uses Claude" problem: what to avoid

Ask any AI for "innovative exam system features" and it suggests the same things. Expect several teams to show:

| Generic idea | Why it's weak here |
|---|---|
| AI webcam proctoring / face detection | Needs camera and bandwidth; biased and privacy-invasive; usually a non-working placeholder (the spec says placeholders get no full credit) |
| "AI grades written answers" via ChatGPT/Claude API | Paid API keys aren't allowed for required features; judges will ask "what if it's wrong?" |
| AI question generator | Not an exam-*integrity/fairness* problem; the spec says AI use earns no extra marks |
| Chatbot assistant | Not in any challenge; adds risk, no marks |
| Blockchain results | Buzzword; a hash-chained audit log does the same job in 20 lines |

**How to stand out:** deterministic, explainable *mechanisms* plus simple *statistics*, each tied to a **named Pakistani incident**, each **demoable in under 90 s** and able to survive a judge testing it. Judges can't tell who used Claude, but they can tell who understood the problem.

---

## 2. Problem Catalogue (Pakistan, with evidence)

| # | Problem | Evidence | Solvable in a hackathon? |
|---|---------|----------|--------------------------|
| P1 | **Power and internet cuts during exams** | Load-shedding at Karachi exam centres (2025); 16 exam-triggered internet shutdowns; ~60% of the population on mobile broadband | ✅ Feature 1 |
| P2 | **Paper leaks** | **MDCAT 2024 Sindh: leaked 13 h 44 m before the test, ~75% of questions compromised, Sindh High Court ordered a full retest by IBA**; Sindh matric 2025; CIE 2025 | ✅ Feature 2 (+ new "leak quarantine") |
| P3 | **Wrong answer keys and ambiguous questions** | **MDCAT 2026: Senate panel flagged 6 disputed questions; students not allowed to keep the paper; UHS score discrepancies from a wrong key**; KMU and SZABMU grace-marks court cases | ✅✅ **NEW: Key Doctor** (strong) |
| P4 | **Recount-only rechecking** | BISE: "does not imply re-rating… merely checking whether all answers have been checked"; Rs 1,200–1,500 per paper | ✅ Feature 3 |
| P5 | **Inconsistent manual marking** | **Karachi e-marking trial: 35% variation vs manual on 62,000 scripts**; 400+ Rawalpindi examiners penalized for wrong marking; Peshawar High Court overturned an erroneous zero | ✅ **NEW: Moderation & double-marking** |
| P6 | **Unequal randomized papers / "paper too hard"** | Recurring protests; psychometric ATA literature | ✅ Feature 4 |
| P7 | **AI-assisted cheating** | HEC GenAI framework; hidden-prompt trap cases | ✅ Feature 5 |
| P8 | **Disability accommodations are ad hoc** | HEC protocol 25% extra time with a writer; universities give 25–75%; PPSC 15/30 min; a KU student took exams alone with JAWS while others still needed writers | ✅✅ **NEW: Accommodation profiles + screen-reader-first exam** (cheap, earns UI/UX marks) |
| P9 | **Low-end phones, slow peak-hour data** | Phone taxes leave a 52% usage gap despite 81% coverage; students report < 1 Mbps at peak | ✅ **NEW: Lite mode / data budget** |
| P10 | Bilingual (Urdu/English) papers | Board papers are bilingual; RTL and Nastaliq support is rare | ⚠️ Possible, but a UI cost |
| P11 | Impersonation / proxy candidates | Widely discussed, but I **found no solid source** | ❌ Skip (needs ID/biometrics; weak evidence) |
| P12 | Results delays and opacity | Karachi board result-transparency crisis, students left without mark sheets | ➖ Partly covered by Features 3 and 4.6 |

---

## 3. New Ideas from the Wider Scan

### ⭐ NEW-A: "Key Doctor": catch wrong answer keys before results go out (P3)
**Why it's the best new find:** MDCAT has had answer-key disputes in multiple years, with grace-marks court cases at KMU and SZABMU and Senate involvement in 2026. Every one of them happened *after* results. Standard **item analysis** catches most bad keys automatically, before publication.

**Mechanism (pure statistics, no AI, about 1–1.5 h):**
1. After the exam closes, for each objective question compute:
   - `p` = proportion correct (already in Feature 4 / secondary 4.5).
   - **Discrimination index** `D = p_top27% − p_bottom27%` (rank candidates by total score excluding this question).
   - Per-option pick rates for top and bottom groups.
2. Auto-flags:
   - 🔴 **Likely wrong key:** `D < 0` *and* one distractor is chosen by most of the top group → "Top scorers chose B (71%); key says C."
   - 🟠 **Ambiguous:** two options both popular with the top group.
   - 🟡 **Too hard / out of syllabus?:** `p < 0.15`.
   - ⚪ **Non-functional distractor:** chosen by < 2%.
3. **Results publishing is blocked** until the examiner resolves every 🔴 flag (keep, fix key, accept both, drop). The resolution is regraded across all attempts and audited (reuses Feature 3's question-wide fix + audit chain).
4. **Provisional key + challenge window** (the JEE/NEET-style process Pakistani candidates are asking for): after the exam, candidates can view their *own* paper with the provisional key and challenge a question for N hours. Challenges and Key Doctor flags appear together. This directly answers "students not allowed to keep the paper."

**Demo:** seed 30 attempts where Q7's key is wrong → Key Doctor shows "🔴 Q7: top group picked B 71%, D = −0.32" → examiner clicks "Fix key → B" → 30 results regrade → the publish button unlocks.

**Spec fit:** 5.4 Trust & Dispute (prevents disputes at the source) + 4.5 Question Analytics + 3.7/3.8 "review before publication". Merge it with Feature 3 as **"Dispute *Prevention* & Resolution."**

### NEW-B: Moderation & double-marking for written answers (P5)
- **Rubric-based marking:** examiners score per criterion, the total is computed and validated against max marks, which removes totaling errors (the only thing board rechecking actually checks).
- **Blind second-marking of a random 10% sample** (configurable) → if the two marks differ by more than a tolerance (e.g. 20% of the question's marks), the script goes to a third marker / moderator.
- **Examiner consistency dashboard:** each examiner's mean awarded % vs. the second-marker's on the same scripts → flags "Examiner X marks +18% harsher." That is exactly the 35% variation Karachi found, made visible *before* results.
- Effort about 1.5 h; it reuses Feature 3's blind-review screen. **Spec fit:** 3.7 "consistent grading state", 5.4.

### NEW-C: Accommodation profiles + screen-reader-first exam (P8)
- The admin/examiner sets a per-candidate accommodation: extra time % (25/50/75 per HEC and institutional policies), larger text, high contrast, no auto-submit warning sounds, etc. **The extra time is enforced on the server** (it's just a modifier on `base_deadline_at`).
- The exam workspace is fully keyboard + screen-reader operable (proper labels, `aria-live` timer announcements every 5 min, focus management on question change). Demo it with the OS screen reader (Orca/NVDA/VoiceOver).
- Effort: < 1 h on top of good UI. It earns marks in **UI/UX (20) "accessibility"** and **secondary 4.7**, and gives a Pakistan story ("a KU student had to fight to sit an exam with JAWS").
- ⚠️ The spec says the same work isn't rewarded twice, so pitch it as accessibility/UX quality rather than as a separate innovation.

### NEW-D: Lite mode / data budget (P9)
- Exam delivery is designed to stay under a size budget (e.g. < 300 KB for the whole exam session): no webcam, no heavy libraries on the exam route, images lazy-loaded, answers sent as small diffs.
- A **"Data used: 142 KB"** indicator on the exam screen and an examiner-side note "works on 2G."
- Pairs naturally with Feature 1. Effort is mostly discipline, ~30 min to measure and show.

### NEW-E: Leak quarantine (extends Feature 2, P2)
MDCAT 2024 required a *whole retest* because ~75% of one fixed paper leaked. With per-candidate papers from a bank:
- When the Leak Tracer confirms a leak, the examiner marks the leaked questions **compromised** → every attempt *not yet started* regenerates without them, and attempts already finished get a "contained compromised question" flag → that question can be dropped for everyone (Feature 3 question-wide fix).
- **Impact report:** "Leak affected 12% of papers (exposure-balanced), not 100%." That is the story: *a leak becomes a partial regrade, not a province-wide retest.*
- Effort about 45 min once Features 2 and 4 exist.

---

## 4. Final Ranking (impact × feasibility × differentiation × demo)

Scores 1–5. **Diff** = how unlikely another team builds it.

| Rank | Idea | Challenge | Impact | Feasible | Diff | Demo | Notes |
|---|---|---|---|---|---|---|---|
| 1 | **Outage-Proof Exam** (F1) | 5.3 | 5 | 4 | 4 | 5 | Reuses mandatory autosave / 4.1 work |
| 2 | **Key Doctor + provisional key challenge** (NEW-A) | 5.4 | 5 | 5 | 5 | 5 | Pure stats; MDCAT story is very strong |
| 3 | **Equal-difficulty papers** (F4) | 5.2 | 4 | 4 | 4 | 4 | Feeds exposure balancing for leaks |
| 4 | **Leak Tracer + Quarantine** (F2 + NEW-E) | 5.5 | 5 | 3 | 5 | 5 | Turns "MDCAT retest" into "partial regrade" |
| 5 | **Dispute Desk + Moderation** (F3 + NEW-B) | 5.4 | 4 | 3 | 3 | 4 | Merge with Key Doctor into one "Trust" module |
| 6 | **Camera-free integrity + clipboard canary** (F5) | 5.1 | 4 | 4 | 3 | 5 | Other teams may do tab-switch tracking; the canary is the differentiator |
| — | Accommodations + screen-reader exam (NEW-C) | UI/UX | 4 | 5 | 4 | 4 | Do it as part of core UI, not as an "innovation" |
| — | Lite mode / data budget (NEW-D) | Tech quality | 3 | 5 | 4 | 3 | Do it as part of F1 |

---

## 5. Recommended Package (pitch as 3 pillars, not 8 features)

Judges score "quality and effectiveness rather than quantity", so group the features into **three coherent pillars** with one story each:

1. **🔌 Resilience — "Load-shedding can't fail your exam"**
   F1 outage-proof exam + Lite mode + accommodations-aware timer.
2. **⚖️ Fairness & Trust — "No more MDCAT-style key scandals"**
   Key Doctor + provisional key challenge → Dispute Desk with blind review → question-wide fixes → hash-chained audit + versioned results. Equal-difficulty papers. Moderation as a stretch goal.
3. **🔒 Integrity — "Leaks get traced, not retested"**
   Time-lock + per-candidate fingerprint + leak quarantine + camera-free signals + clipboard canary.

**Build order after the core:**
F1 (1.5 h) → Key Doctor (1–1.5 h) → F4 (1 h) → F2 + quarantine (1.5 h) → F3 disputes (1.5 h) → F5 (1 h) → moderation (stretch).
**Minimum winning set if time runs short:** F1 + Key Doctor + F4. That's one pillar fully done, one mostly done, and the strongest two demos.

---

## 6. Demo Narrative (about 5 of the 15 minutes)

1. *"Pakistan had 16 internet shutdowns triggered by exams, plus daily load-shedding."* → go offline mid-exam, keep answering, reconnect: no loss, zero free time. Then a power-cut simulation: capped credit, examiner approval.
2. *"In 2024, MDCAT Sindh leaked 13 hours early and the whole province had to retest."* → paste the leaked text → Leak Tracer names the attempt → quarantine → "12% of papers affected, regrade only those."
3. *"In 2026, a Senate panel flagged six disputed MDCAT questions after results."* → Key Doctor flags Q7 *before* publishing → fix → 30 results regrade → audit chain verifies.
4. *"Every candidate got a different paper, all equally hard."* → fairness histogram.
5. Close: *"No camera, no paid AI, works on a 2G phone."*

---

## Sources (new in this scan)
- [MDCAT 2024: Sindh High Court orders reconduct (ARY)](https://arynews.tv/mdcat-2024-court-orders-reconduct-within-month)
- [Sindh High Court order CP D-4850/2024 (leak timing)](https://caselaw.shc.gov.pk/caselaw/download-file.php?doc=MjIyMTg3Y2Ztcy1kYzgz&citation=2024+SHC+KHI+667)
- [MDCAT retest ordered after probe confirms leak (Geo)](https://www.geo.tv/latest/571092-mdcat-retest-ordered-by-shc-after-paper-leak-confirmed-by-probe-committee)
- [FIA unveils network in MDCAT leak (Daily Pakistan)](https://en.dailypakistan.com.pk/27-Oct-2024/mdcat-2024-paper-leak-fia-unveils-network-of-complicit-doctors-in-sindh)
- [Senate panel warns of FIA probe over MDCAT complaints (Minute Mirror)](https://minutemirror.com.pk/senate-panel-warns-of-fia-probe-over-mdcat-complaints-against-pmdc-648218/)
- [UHS opens MDCAT 2026 recount/review portal (Tribune)](https://tribune.com.pk/story/2631715/uhs-opens-mdcat-2026-recount-review-portal-for-result-verification)
- [PHC seeks KMU response on MDCAT grace marks (Dawn)](https://www.dawn.com/news/1866304)
- [High court stays MDCAT results (Dawn)](https://www.dawn.com/news/1861175)
- [PMC grace marks decision 2022](https://www.dentalnewspk.com/16-Nov-2022/pmc-decides-to-give-grace-marks-to-candidates)
- [Matric boards' e-marking dream crashes (Tribune)](https://tribune.com.pk/story/2608695/matric-boards-e-marking-dream-crashes)
- [Teachers fail e-marking system (Tribune)](https://tribune.com.pk/story/2583221/teachers-fail-e-marking-system)
- [Karachi board postpones matric science results, 35% e-marking variation (ProPakistani)](https://propakistani.pk/2026/07/08/karachi-board-postpones-matric-science-group-results/amp/)
- [Board under scrutiny over marking disparity (Tribune)](https://tribune.com.pk/story/2635663/board-under-scrutiny-over-marking-disparity)
- [Punjab boards to take paper checking online (Tribune)](https://tribune.com.pk/story/2632845/punjab-boards-to-take-paper-checking-online)
- [400+ Rawalpindi examiners face action for wrong marking (Dawn)](https://dawn.com/news/1872208/over-400-rawalpindi-examiners-face-the-music-for-wrong-marking-in-annual-matric-examination)
- [PHC notice on erroneous zero marks, BISE Peshawar (APP)](https://www.app.com.pk/?p=1268934)
- [Karachi boards' result transparency crisis (Tribune)](https://tribune.com.pk/story/2573856/karachi-boards-result-transparency-crisis-hits-students)
- [HEC letter on exam accommodations, Mar 2026 (FU PDF)](https://www.fu.edu.pk/uploads/Letter-(RAA)%20HEC-IBD%2002.03.2026.pdf)
- [IBA ODAI disability policy (PDF)](https://osa.iba.edu.pk/student-resources/policies/policy-office-of-diversity-accessibility-inclusion-odai.pdf)
- [PPSC extra time for candidates with disabilities (Daily Pakistan)](https://en.dailypakistan.com.pk/03-Jan-2025/ppsc-announces-extra-time-for-exams-for-these-candidates)
- [Visually impaired students sit board exams without writers (Daily Pakistan)](https://en.dailypakistan.com.pk/13-Jun-2022/in-a-first-visually-impaired-students-allowed-to-sit-board-exams-without-writers)
- [A vision for the visually-impaired, KU JAWS (Tribune)](https://tribune.com.pk/story/1732210/entertainment)
- [Phone costs lock 52% out of internet (Tribune)](https://tribune.com.pk/story/2608178/phone-costs-lock-52-out-of-internet)
- [Pakistan $0.10/GB data, but at what cost? (PhoneWorld)](https://www.phoneworld.com.pk/pakistans-0-10-gb-data-worlds-6th-cheapest-but-at-what-cost/)
- [Wharton: surveillance state of education (proctoring and bandwidth)](https://magazine.wharton.upenn.edu/digital/the-surveillance-state-of-education/)
