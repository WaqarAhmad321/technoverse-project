# Inspiration: Global Platforms, SynchAI, South Korea, Public Repos

> What the world's exam platforms sell and how they pitch it, what SynchTravel's AI "workforce" teaches us, how South Korea runs high-stakes exams, and which public repos and libraries we can reuse. Each section ends with **what Imtihaan takes from it**.
> Researched 27 Nov 2026. Vendor claims are marked as such. Some vendor pages (Inspera, ExamSoft, Gradescope) blocked direct fetching, so those rows rely on review sites and help docs.

---

## 1. Global Exam Platforms: USPs & Pitch

| Platform | Segment | USPs (as marketed) | How they pitch | What we take |
|---|---|---|---|---|
| **Inspera** | Universities, awarding bodies | End-to-end: create, deliver, grade; formative + summative; open/closed book; originality checks in 30+ languages | "Move all assessment online in one platform" | Pitch Imtihaan as **one flow from question bank to verified result** |
| **ExamSoft / Examplify** | High-stakes: law, medical, professional | Offline mode, question banking, **forensic analytics**; cutting the network during the exam blocks AI tools and websites | Security + data-driven "exam forensics" for accreditation | Call Key Doctor + item analysis **"Exam Forensics"**. Our offline mode keeps working instead of locking down |
| **Mercer \| Mettl** | Enterprise hiring | 26+ question formats; AI + live proctors | Scale + variety + hiring outcomes | Clear **question-type coverage** (MCQ/MSQ/written + transparent formulas) |
| **Honorlock** | Colleges | AI monitors; **a live proctor pops in only when something is flagged**; ID verification | "Less intrusive, human only when needed" | Our **escalation pattern**: signals → examiner review → mini-viva. Human only when needed, no camera |
| **Talview** | Enterprise | Mobile + desktop proctoring, AI interviewing | Mobile-first reach | **Mobile-first exam workspace** (390px, 2G) |
| **Gradescope** (Turnitin) | Universities | ⭐ **AI-assisted answer groups**: AI clusters similar answers, the instructor confirms groups, then **grades each group once**; late submissions slot into existing groups | "Grade faster and more consistently" | ⭐ **Answer Groups for written answers**: cluster similar answers (local embeddings, free), grade once per group. A direct fix for the 35% marking variance |
| **College Board Bluebook** (digital SAT) | National test | Momentary network drops: **continue without losing time**; "Resume Testing" screen; submit from My SAT if a device fails | Reliability at national scale | Validates our resilience design. Their failure is a lesson too: **March 2025, a misconfiguration auto-submitted tests early, so students were refunded**; May 2026 AWS outage. → We **test auto-submit and outage paths explicitly** and show it |
| **Safe Exam Browser** (open source) | Lockdown browser | Locks the device into the exam | Control | Contrast point: **we don't lock devices** (impossible on phones and personal laptops); we design for integrity instead |

### Pitch patterns these vendors use
1. **Segment by stakes** ("high-stakes", "formative", "hiring") → our segment: **Pakistani universities and boards on unreliable infrastructure**.
2. **Integrity *and* candidate experience** in the same sentence ("secure without being intrusive").
3. **Human-in-the-loop as a trust feature** (Honorlock, Gradescope sign-off).
4. **Proof by numbers + named customers** → we use proof by **named incidents** and **live demo numbers** ("0 answers lost, 0 seconds of free time", "Q7 key error caught before publishing").
5. **End-to-end journey** in one story: author → deliver → grade → publish → verify.

---

## 2. SynchAI (SynchTravel): The "AI Workforce" Pattern

Source: `synchtravel.com/synchai-for-travel-agencies` (vendor page, read in full).

**Their headline:** "Meet SynchAI: AI workforce for modern travel businesses" · eyebrow "Where Travel Meets Intelligent Automation" · hook: **"What if your travel team had eight specialists?"** · reassurance: **"The goal isn't to replace your team. It's to give them more time to talk to customers…"**

**Their 8 agents:** Leads Manager · Quotation Agent · Package Agent · Activity Agent · Account Manager · Marketing Manager · WhatsApp Agent · Call Agent. Inputs come from **text, voice or files**; they work from the agency's *own* data.

**UI and pitch mechanics worth copying:**
- Each agent is a **card with a live mini-demo** and **progress states** ("Matching inventory → Calculating margin → **Ready for review**").
- Outputs land as **"Ready for review" / "flagged for review"** with a **Recommended Action** button ("Review Now", "Publish Tour").
- A **"Recent Activity" feed** shows the agents working ("3 customers due to rebook this week").
- **Handoff with full history** (WhatsApp agent → human, no repetition).
- An **FAQ that answers objections** up front.
- Weak spot to avoid: their call-agent demo shows **"Refund initiated" with no review step**. Imtihaan never lets AI apply a grade, key or penalty by itself.

### What Imtihaan takes: "Your AI Exam Office"
> *"What if your exam office had six specialists, and none of them could change a mark without you?"*

| Imtihaan agent (card) | Progress states shown | Output gate |
|---|---|---|
| **Paper Reviewer** | Reading 40 questions → Checking keys → Comparing Urdu/English → Ready for review | "3 issues flagged · Review Now" |
| **Grading Assistant** | Grouping 50 answers → Proposing rubric marks → Ready for review | "12 answer groups · Grade groups" |
| **Exam Forensics** (Key Doctor) | Analysing 50 attempts → Item statistics → 1 likely wrong key | "Publishing blocked · Resolve" |
| **Dispute Triage** | Collecting evidence → Summarising → Ready for review | "Suggested: uphold · Decide" |
| **Integrity Analyst** | Reading signal timeline → Drafting neutral summary → Follow-up question ready | "Send mini-viva?" |
| **Leak Hunter** | Reading screenshot (OCR) → Matching papers → Roll #23 (high confidence) | "Quarantine 3 questions?" |

Plus an **"Exam office activity" feed** on the examiner home ("Paper Reviewer flagged Q12 wording", "2 disputes awaiting decision"). Every card works with AI off (deterministic part only).

---

## 3. South Korea: How a High-Stakes Exam Country Handles It

### 3.1 Suneung (CSAT) exam day: the whole country protects the exam window
- **Flights halted** nationwide during the English listening section (2026: take-offs/landings suspended ~13:05–13:40); planes in the air stay high.
- **Police escorts** for candidates at risk of being late (one year: 10,475 officers, 2,238 patrol cars); **stock market opens an hour late**; offices start late to clear traffic.
- **Lesson for us:** Korea removes disruptions *from the environment*. Pakistan can't stop load-shedding, so **Imtihaan makes the exam immune to disruptions**.
- **Pitch line:** *"Korea grounds its planes so a listening test isn't disturbed. Pakistan can't switch off load-shedding, so we built an exam that doesn't care."*

### 3.2 Question security: setters in seclusion, insiders as the main threat
- Question writers are reportedly **secluded for about a month** with no outside contact (secondary source, unverified).
- **Insider leaks still happen:** **Andong 2025**: a parent and a contract teacher broke into a school to steal exam papers → **4.5 and 5 years in prison** (Jan 2026); **Bundang**: a temporary teacher leaked maths questions to a cram school, twice; a probe apprehended **46 teachers/instructors** over assessment and mock-exam leaks; a teacher was dismissed for photographing a mock CSAT question while proctoring and sharing it in a group chat.
- **Lesson:** the threat is **insiders with access**. → Imtihaan: **least-privilege question access** (only the exam's examiners), **time-lock** (no candidate access before start), **audit of every question view/export** in the hash chain, and the **Leak Tracer** for when it happens anyway.

### 3.3 Answer-key objections: a formal process (our closest model)
- After the CSAT, candidates get a **formal objection window (~5 days)**; **final answers are confirmed on a set date** before scores are released.
- Scale: the 2024 CSAT got **288 objections in 5 days** (one English question flagged 13 times).
- **2014 world geography Q8:** an error → lawsuits → the court ruled the question wrong → **18,884 students' scores recalculated about a year later**, plus remedial admissions.
- **2022 Life Science II Q20:** the court found a **"clear error in the question"** → **all answers marked correct** → **KICE president resigned**; KICE pledged to **improve the objection review system**.
- **Lesson:** even the world's most serious exam system gets keys wrong, and late fixes are very costly (lawsuits, a year of delay, resignations). → Imtihaan: **Exam Forensics catches likely-wrong keys *before* results**, a **provisional key + objection window + final key date** (Korea's model), and **question-wide resolutions** ("all answers correct" is one of our explicit options), applied to everyone, versioned and audited.
- **Pitch line:** *"In Korea, a wrong key cost 18,884 students a year and a president his job. Imtihaan flags it before results are published."*

### 3.4 "Killer questions" and fairness
- In June 2023 the government ordered **ultra-hard "killer questions" removed** from the CSAT to reduce reliance on cram schools; critics questioned the **selection criteria** (questions with similar correct-answer rates were treated differently) and warned of a "balloon effect" (overall difficulty rises instead).
- KICE claimed killer questions were **thoroughly excluded** from the 2025 CSAT, verified by an **independent review committee**.
- **Lesson:** difficulty decisions need **transparent, data-based criteria**, not opinion. → Imtihaan: a **"Killer question" detector** in Exam Forensics (very low p-value, discriminates only among the top group), shown with the numbers; the **equal-difficulty generator** with published criteria; **Paper Reviewer + a second human** as the "independent review committee".

### 3.5 AI cheating at top universities: surveillance didn't stop it
- **Yonsei (Oct 2025):** ~**190 of ~600** students caught cheating on an online midterm for a ChatGPT/NLP course, **even though students had to record their screens, hands and faces**.
- **Korea University:** a large group shared answers in a group chat during an **unproctored** online exam → midterm **voided**.
- **Seoul National University (Dec 2025):** final invalidated after signs of cheating among nearly half of 36 students.
- Response: Yonsei moved finals **in person**; academics say online factual-recall tests "invite cheating".
- **Lesson:** **cameras don't fix AI cheating**; assessment design + signals + follow-up do. → Imtihaan: camera-free signals, clipboard canary, **mini-viva follow-ups**, Paper Reviewer flags **"easily answerable by AI"** questions, randomized and fingerprinted papers (group-chat sharing becomes traceable and less useful).
- **Pitch line:** *"Yonsei recorded students' faces, hands and screens, and 190 still cheated. We don't add cameras; we change the incentives."*

---

## 4. Public Repos & Libraries

### 4.1 Repos to study (ideas, not drop-in code: different stacks; check licences before copying)
| Repo | ★ | Why it's useful |
|---|---|---|
| [mindskip/xzs](https://github.com/mindskip/xzs) | 3.9k | Mature Java+Vue exam system (web + WeChat mini-program): feature checklist, paper/question models |
| [Alanosy/exam-platform](https://github.com/Alanosy/exam-platform) | 888 | Another full online exam system: compare flows and screens |
| [tecnickcom/tcexam](https://github.com/tecnickcom/tcexam) | 634 | Long-lived CBT system used by universities: question types, randomisation, reports |
| [doudou0308/ExamMind_Studio](https://github.com/doudou0308/ExamMind_Studio) | 26 | **Genetic-algorithm paper assembly** + AI question generation + wrong-answer analysis: reference for F4 + agents |
| [maxingan2412/MathInsight](https://github.com/maxingan2412/MathInsight) | 237 | **Rasch model** analytics + graded-difficulty paper assembly: reference for analytics/F4 |
| [douglasrizzo/catsim](https://github.com/douglasrizzo/catsim) | 154 | Adaptive testing simulator: item selection algorithms |
| [eribean/girth](https://github.com/eribean/girth) | 129 | Python IRT package: formulas to port for item statistics |
| [giadasp/ATA.jl](https://github.com/giadasp/ATA.jl), [Hongchen030/mstATA](https://github.com/Hongchen030/mstATA) | n/a | Automated Test Assembly (MILP): the "proper" version of our hill-climb, for the judge Q&A |
| [aesophor/hacklympics](https://github.com/aesophor/hacklympics) | 69 | Programming-exam prototype with anti-cheat (keystroke logging, playback) |
| [SafeExamBrowser/seb-win-refactoring](https://github.com/SafeExamBrowser/seb-win-refactoring) | 376 | Lockdown browser: contrast for our "no lockdown" stance |
| [Mahmoud-s-Khedr/qbank](https://github.com/Mahmoud-s-Khedr/qbank) | 0 | AI question bank from scanned **Arabic-first** workbooks with human review: close to our Urdu/bilingual + Question Bank Builder idea |

### 4.2 Evidence repos: the threat is real and public (use in the 5.1 pitch)
| Repo | ★ | What it shows |
|---|---|---|
| [ooboqoo/shiping](https://github.com/ooboqoo/shiping) | 1.2k | Screenshot + AI answers anything on screen (questions included) via a hotkey. **Bypasses clipboard-based detection**, so signals + viva + design matter |
| [yoannchb-pro/MoodleGPT](https://github.com/yoannchb-pro/MoodleGPT) | 87 | Extension that **hides ChatGPT inside a Moodle quiz** |
| [Meghdut-Mandal/TyperX](https://github.com/Meghdut-Mandal/TyperX) | 43 | **Bypasses copy-paste restrictions** in online exams, so blocking paste is pointless; we *detect* it instead |
| [vardanagarwal/Proctoring-AI](https://github.com/vardanagarwal/Proctoring-AI) | 635 | Typical webcam AI proctoring (what other teams will copy) |

Honest note for judges: the clipboard canary doesn't catch screenshot tools like Shiping. That's why it is one signal among several, backed by follow-up questions and AI-resistant question review.

### 4.3 npm libraries (versions checked today; Next 16 compatibility not yet tested)
| Need | Library | Notes |
|---|---|---|
| Offline answer queue | `dexie` 4.4.7 or `idb-keyval` 6.3.0 | IndexedDB wrappers |
| Offline app shell / PWA | `@serwist/next` 9.6.0 | Service worker for Next.js (stretch) |
| PDF reports | `@react-pdf/renderer` 4.9.2 or `pdf-lib` 1.17.1 | Server-side generation |
| QR codes | `qrcode.react` 4.2.0 | Verification QR, receipt QR |
| Signed receipts / verifiable QR | `@noble/ed25519` 3.2.0 | 5 KB, audited-style crypto, offline-verifiable signatures |
| CSV import | `papaparse` 5.7.1 + `jschardet` 4.1.0 | Parsing + **encoding detection** (Urdu Excel CSVs) |
| Leak screenshot OCR | `tesseract.js` 7.0.0 | Runs **in the browser, free**: allowed under the AI rules |
| Local AI (answer grouping, duplicate questions) | `@huggingface/transformers` 4.3.2 | In-browser embeddings: **free, no API key**, so it can power a required feature |
| Scratchpad drawing | `perfect-freehand` 1.2.3 (light) or `@excalidraw/excalidraw` 0.18.1 (heavy) | Prefer the light one for 2G |
| Charts | `recharts` 3.11.1 | Fairness histogram, item analytics |
| Examiner 2FA | `otplib` 13.6.0 | TOTP (stretch) |

---

## 5. New Ideas Added to Imtihaan From This Research
| Idea | Inspired by | Pillar |
|---|---|---|
| **Answer Groups** for written grading (cluster → grade once per group → consistency) using local embeddings | Gradescope | Fairness & Trust |
| **"Your AI Exam Office"**: agent cards with progress states, Ready-for-review gates, recommended actions, activity feed | SynchAI | AI layer |
| **Provisional key → objection window → final key date**, with an explicit "all answers correct" resolution | Korea CSAT / KICE | Fairness & Trust |
| **Killer-question detector** with transparent criteria | Korea 2023 killer-question policy | Fairness |
| **"Exam Forensics"** naming for item analysis | ExamSoft | Fairness & Trust |
| **Escalate to human only when flagged** | Honorlock | Integrity |
| **Insider access audit** (who viewed/exported which questions, when) + time-lock | Korea paper thefts, MDCAT doctors | Integrity |
| **Explicit auto-submit / outage tests** shown in the demo | Bluebook March 2025 early auto-submit | Resilience |
| **"AI-answerable question" flag** in Paper Reviewer | Yonsei/KU/SNU scandals | Integrity |

## 6. Pitch Lines Collected
- *"Korea grounds its planes for a listening test. Pakistan can't switch off load-shedding, so we built an exam that doesn't care."*
- *"In Korea, a wrong key cost 18,884 students a year and a president his job. Imtihaan flags it before results go out."*
- *"Yonsei recorded faces, hands and screens, and 190 still cheated. We don't add cameras; we change the incentives."*
- *"What if your exam office had six specialists, and none of them could change a mark without you?"*
- *"Zero answers lost. Zero seconds of free time."*

---

## Sources
**Platforms:** [Brainvire: online exam software by stakes](https://www.brainvire.com/blog/best-online-exam-software/) · [Lilach Bullock: proctoring software 2026](https://www.lilachbullock.com/best-proctoring-software/) · [Gitnux: online exam software](https://gitnux.org/best/online-exam-software/) · [Gradescope: AI-assisted grading and answer groups](https://guides.gradescope.com/hc/en-us/articles/24838908062093-AI-assisted-grading-and-answer-groups) · [Turnitin: design principles of AI-assisted grading](https://www.turnitin.com/blog/design-principles-of-ai-assisted-grading) · [College Board: connectivity issues on test day](https://satsuite.collegeboard.org/help-center/what-happens-if-students-issue-device-connectivity-test-day) · [College Board: March 8–9 weekend SAT](https://newsroom.collegeboard.org/what-happened-march-8-9-weekend-sat-and-what-college-board-doing-about-it) · [Bluebook troubleshooting](https://bluebook.collegeboard.org/technology/help/bluebook-troubleshoot) · [Bluebook alerts](https://bluebook.collegeboard.org/alerts)

**SynchTravel:** [SynchAI for travel agencies](https://synchtravel.com/synchai-for-travel-agencies) · [AI travel management platforms (blog)](https://synchtravel.com/blogs/the-future-of-travel-operations-why-ai-travel-management-platforms-are-taking-over) · [About Synch Travel](https://synchtravel.com/about-us)

**South Korea:** [Business Standard: Suneung 2026 flights halted](https://www.business-standard.com/s/2gApNRE) · [Khaleej Times: flights halted](https://www.khaleejtimes.com/world/asia/south-korea-halts-flights-college-entry-exam) · [Manila Bulletin: police escorts](https://mb.com.ph/2022/11/17/police-escorts-flight-bans-as-half-a-million-s-koreans-sit-key-exam) · [iTutor: Suneung explained (objection dates)](https://itutoronline.com/blog/suneung-csat-explained) · [Koreaboo: 288 objections](https://www.koreaboo.com/stories/csat-english-question-so-hard-made-korean-national-news/) · [The Soul of Seoul: setters secluded (secondary)](https://thesoulofseoul.net/korea-suneung/) · [JoongAng: court says geography question wrong](https://www.koreajoongangdaily.com/korea/court-says-csat-geography-question-was-wrong/11434844) · [JoongAng: CSAT will be rescored](https://www.koreajoongangdaily.com/korea/last-years-csat-will-be-rescored/11547440) · [Korea Times: over 9,000 grades revised](https://www.koreatimes.co.kr/southkorea/20141120/over-9000-csat-grades-revised) · [Asiae: Life Science II all marked correct](https://www.asiae.co.kr/en/article/2021121516002277838) · [Asiae: objection system improvements](https://www.asiae.co.kr/en/article/2021122015312782224) · [JoongAng: killer questions axed](https://www.koreajoongangdaily.com/2023/06/26/national/socialAffairs/Korea-Education-Ministry-CSAT/20230626175030001.html) · [Asiae: killer-question criteria questioned](https://www.asiae.co.kr/en/article/2023062523204212526) · [Korea Times: insiders expose CSAT flaws](https://www.koreatimes.co.kr/southkorea/society/20260131/insiders-expose-flaws-in-koreas-college-entrance-exam) · [Korea Herald: Yonsei mass cheating](https://www.koreaherald.com/article/10612853) · [Korea Times: cheating scandals at top universities](https://www.koreatimes.co.kr/southkorea/society/20251112/cheating-scandals-at-top-universities-prompt-rethink-of-education-in-digital-era) · [Korea Times: online finals marred by cheating](https://www.koreatimes.co.kr/southkorea/society/20251221/online-finals-at-korean-universities-again-marred-by-cheating) · [THE: mass cheating case](https://www.timeshighereducation.com/news/mass-cheating-case-exposes-south-koreas-assessment-crisis) · [Korea Times: parent sentenced for exam paper theft](https://www.koreatimes.co.kr/southkorea/society/20260115/parent-sentenced-to-prison-for-exam-paper-theft) · [Korea Herald: cost of score obsession](https://www.koreaherald.com/article/10656366) · [Korea Times: Bundang leaks](https://www.koreatimes.co.kr/southkorea/society/20250323/two-exam-leaks-confirmed-at-bundang-high-school-police-refer-teacher-and-instructor-for-prosecution)
