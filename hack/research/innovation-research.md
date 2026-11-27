# Web-e-Thon — Innovation Research (Pakistan Exam Context)

> Evidence base for the five innovation features. The implementation design is in [`innovation-design.md`](./innovation-design.md).
> Researched 27 Nov 2026. Source quality is noted; opinion/vendor sources are flagged.

---

## Summary

| # | Feature | Problem evidence (Pakistan) | What exists today | Our gap-filler |
|---|---------|-----------------------------|-------------------|----------------|
| 1 | Outage-Proof Exam (5.3) | Load-shedding at exam centres; 16 exam-triggered internet shutdowns; ~60% of the population on mobile broadband | Vendors either let the timer run during outages or terminate the exam | **Activity-aware credit**: time back only if the candidate *couldn't* work |
| 2 | Leak Tracer (5.5) | 2025 Sindh matric leaks, 250+ cheating cases in 4 days; CIE A-Level partial leak | Canary traps/zero-width marks used in journalism & security, not exam platforms | Multi-layer per-candidate fingerprint + tracer tool |
| 3 | Dispute Desk (5.4) | Rechecking = totals check only, Rs 1,200–1,500/paper, fee kept unless error found | Paid, opaque, individual-only rechecking | Free blind re-evaluation, question-wide fixes, hash-chained audit |
| 4 | Equal-Difficulty Papers (5.2) | Recurring "paper too hard" protests | ATA via MILP/IRT at big testing bodies only | Lightweight CTT-based hill-climb + fairness report |
| 5 | Camera-Free Integrity (5.1) | Low-bandwidth/mobile candidates; HEC flags AI cheating in assessments | Webcam proctoring: bandwidth-heavy, biased, privacy-invasive | Privacy-first signals + clipboard canary + mini-viva |

---

## 1. Connectivity & Power (→ Feature 1)

### Evidence
- **Load-shedding during exams:** In April 2025, Karachi matric candidates faced prolonged power cuts *at exam centres* despite K-Electric promising exemptions. ([ARY](https://arynews.tv/karachi-matric-students-disruptions-load-shedding-at-exam-centers))
- **Students name it directly:** A survey of 550 Lahore university students on online learning listed lack of internet, **load-shedding**, and *unreliable assessment results* among their main problems. ([ScienceDirect](https://www.sciencedirect.com/org/science/article/pii/S1548109322000444))
- **Shutdowns are a policy tool, and exams trigger them:** Access Now data (via Tribune): 77 shutdowns in nine years, 2024 the worst year; **exams were a leading trigger (16 shutdowns)**. ([Tribune](https://tribune.com.pk/story/2531903/internet-shutdowns-hit-record-high-in-2024))
- Election-day 2024: nationwide mobile data suspended ~13 h. ([Internet Society Pulse](https://pulse.internetsociety.org/blog/pakistan-elections-2024-reports-of-internet-and-mobile-services-disrupted))
- Regional suspensions lasting months (South Waziristan, 2026) block students from online education. ([Tribune India/ANI](https://www.tribuneindia.com/news/world/students-businesses-suffer-as-pakistans-internet-blackout-continues-in-south-waziristan/amp/?utm=relatedarticles))
- Infrastructure is weak overall — Dawn calls it Pakistan's "internet recession". ([Dawn](https://www.dawn.com/news/1886098)); PTCL undersea-cable repairs caused day-long degradations in 2025. ([WIE Pakistan](https://womeninenergy.org.pk/internet-outage-in-pakistan/))
- **Mobile is the main pipe:** ~200 M cellular subscribers, ~148–150 M mobile broadband users, ~60% mobile-broadband penetration (PTA data, 2025). ([Profit](https://profit.pakistantoday.com.pk/2026/01/20/pakistans-mobile-subscriber-base-tops-200-million-by-end-of-2025-pta-data-shows/), [Profit](https://profit.pakistantoday.com.pk/2025/06/20/pakistan-hits-200-million-telecom-subscribers-with-150-million-broadband-users/)) → so a mobile-data suspension cuts off most candidates.

> **Honest gap:** I found no news report specifically about *online university exams* failing due to outages in 2025. The argument rests on the student survey + general outage/shutdown data.

### Prior art / how others handle it
- **Pearson VUE OnVUE:** exam closes on connection loss; candidate relaunches; after 2 restarts the exam is terminated. ([Pearson VUE guide PDF](https://www.nicet.org/nicetorg/assets/file/public/onvue-reconnection-guide-kim-8-27-20-reference.pdf))
- **Xobin:** resume within 30 min in the same browser, **timer keeps running** during the outage. ([Xobin docs](https://docs.xobin.com/en-us/article/how-to-handle-internet-disconnection-during-assessment-5baaem/))
- **Respondus LockDown:** retries 30–60 s, then may auto-submit or pause (third-party source). ([ldbypass](https://ldbypass.com/questions/what-happens-if-internet-disconnects-respondus))
- **Offline-first vendors/prototypes:** local caching + sync with hash verification on upload (vendor claims). ([ConductExam](https://www.conductexam.in/blog/how-to-sync-offline-exam-software-data-when-the-internet-returns), [Eklavvya](https://www.eklavvya.com/blog/resume-exam-disconnected/), [OneMind prototype](https://github.com/kunal71612/Seva-Project-))

### Insight driving our design
Every existing approach treats "offline" as one state. In reality there are two: **offline-but-working** (internet down, device alive) and **unable-to-work** (power/device failure). Credit time only for the second, proven by server heartbeats + client activity → no answer loss *and* no free time. None of the platforms above make that distinction.

---

## 2. Paper Leaks (→ Feature 2)

### Evidence
- **Sindh matric 2025:** chemistry, biology and maths papers surfaced online before exams in Hyderabad, Shikarpur, Nawabshah; the Sukkur Board reported **250+ cheating cases in four days**; teachers reportedly helped in Dherki. ([Tribune](https://tribune.com.pk/story/2539490/exam-papers-leak-across-sindh-as-cheating-plagues-matric-exams), [Pakistan Today](https://www.pakistantoday.com.pk/2025/04/11/matric-exam-papers-leaked-across-sindh-as-cheating-mafia-operates-openly), [ilmkidunya](https://www.ilmkidunya.com/edunews/exam-paper-leak-in-sindh-widespread-cheating-in-larkana-khairpur-dherki-ghotki))
- **Karachi Board:** a chemistry paper reportedly leaked on social media; show-cause notice issued to a former Controller of Examinations. ([Tribune](https://tribune.com.pk/story/2603370/students-cry-foul-over-sudden-curveball))
- **Cambridge (CIE) June 2025:** partial leak of 3 A-Level papers in Pakistan confirmed; no free resits. ([VACE — secondary/marketing source](https://vaceglobal.com/cambridge-a-level-paper-leak-the-compensation/))
- Boards can't identify *who* leaked — enforcement focuses on raids at centres.

### Prior art
- **Canary trap:** give each recipient a slightly different copy; the leaked version identifies the source. Long used in intelligence and politics. ([Wikipedia](https://en.wikipedia.org/wiki/Canary_trap))
- **Zero-width watermarks:** U+200B/U+200C encode bits invisibly in copied text; a **checksum** is needed to avoid false decodes; **easy to strip** with sanitizers/Unicode normalization. ([dawid.dev](https://dawid.dev/sec/unicode/zero-width-watermark-canary-trap), [Towards Data Science](https://towardsdatascience.com/text-watermarking-in-python-catch-whoever-copies-your-writing/), [nervuri.net](https://nervuri.net/stega))
- **Most robust:** vary the *content* per recipient (wording/values) — no character filter removes it; layering methods is recommended. (same sources)

### Insight
Online exams already randomize question and option order per candidate — **that permutation is itself a canary trap** that survives screenshots and retyping. Add zero-width marks for copy-paste leaks and optional parameterized content for strength. Present output as *evidence for review*, not a verdict.

---

## 3. Rechecking & Disputes (→ Feature 3)

### Evidence
- **BISE Lahore 2025:** rechecking Rs 1,200 per subject, online only, fixed window; fee refunded **only if an error is found**. ([ProPakistani](https://propakistani.pk/2025/07/24/matric-exam-rechecking-schedule-announced/), [TechJuice](https://www.techjuice.pk/bise-lahore-announces-2025-matric-exam-rechecking-schedule/), [Pakistan Observer](https://pakobserver.net/lahore-board-matric-paper-rechecking-application-deadline-and-fee-structure-here/))
- **Key quote (Class 11, 2025):** rechecking *"does not imply re-rating the paper again but merely checking to see whether all answers have been checked."* ([Pakistan Truth](https://www.pakistantruth.com/rechecking-for-11th-class-2025/))
- **FBISE:** Rs 1,500 per paper, within 20 days (secondary guide). Punjab HSSC: within 15 days; fee retained if totals are correct. ([Pakera FBISE](https://pakera.pk/fbise-recount-marks-rs-1500-per-paper-20-days/), [Pakera HSSC](https://pakera.pk/hssc-result-rechecking-punjab-apply/))
- **Critique (opinion):** rechecking exists largely as a formality and revenue source; matric/inter students have no formal complaint mechanism. ([Friday Times, Oct 2025](https://www.thefridaytimes.com/23-Oct-2025/rot-within-pakistan-s-board-examination-system-produces-broken-futures))

### Insight
The existing system **recounts**; it doesn't **re-evaluate**, and a wrong or ambiguous question is only fixed for those who pay. Ours: free re-evaluation by a *different*, *blind* examiner, mandatory reasons, a no-penalty rule for the disputer, question-level fixes applied to everyone, versioned results, and a tamper-evident audit chain that ties into the verifiable-report feature (4.6).

---

## 4. Fairness of Randomized Papers (→ Feature 4)

### Evidence
- Recurring complaints that papers were unusually hard; boards defend them as "within syllabus". ([Tribune](https://tribune.com.pk/story/2603370/students-cry-foul-over-sudden-curveball))
- With per-candidate randomization (needed for leak resistance), difficulty variance *between candidates* becomes a new fairness risk — the problem in spec 5.2.

### Prior art (psychometrics: Automated Test Assembly)
- Parallel forms built by **mixed-integer linear programming** on IRT models; matching test information functions gives equal *precision* but **not necessarily equal difficulty** — the test characteristic curve (difficulty) must be targeted directly. ([PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC5978482/))
- MAXIMIN/MINIMAX formulations also **minimize items shared between forms**. ([MDPI Psych](https://www.mdpi.com/2624-8611/2/4/24))
- Heuristics/metaheuristics (maximum clique, CLONALG, genetic algorithms) are used when MILP is too heavy. ([ResearchGate](https://www.researchgate.net/publication/251317353_Simultaneously_construct_IRT-based_parallel_tests_based_on_an_adapted_CLONALG_algorithm))
- **CTT vs IRT:** a weighted-deviations heuristic study found CTT-based assembly performed **at least as well** as IRT approaches. ([JTLA](https://ejournals.bc.edu/index.php/jtla/article/view/1638), [ERIC PDF](https://files.eric.ed.gov/fulltext/EJ838620.pdf))
- Commercial ATA tools exist for big testing bodies. ([ASC TestAssembler](https://assess.com/testassembler/))

### Insight
Use CTT difficulty (proportion correct, Bayesian-smoothed with the examiner's label) and a fast randomized hill-climb per candidate. That's the practical subset of ATA for a small institution with a new question bank, plus exposure balancing (which also limits leak damage — Feature 2).

---

## 5. Integrity in the AI Era, Without Cameras (→ Feature 5)

### Evidence — the AI side
- **HEC GenAI Framework:** lists cheating in assessments, impersonation, and manipulation of automated grading as concerns; asks institutions to monitor and audit AI use; regulatory, not a blanket ban. ([HEC PDF](https://www.hec.gov.pk/english/policies/Documents/Framework-Gene-AI.pdf), [The Neutral](https://theneutral.pk/hec-unveils-pakistans-first-ai-policy-for-universities/))
- Pakistani institutions reportedly moving toward vivas, supervised exams and presentations for AI-resistant assessment; LUMS draft asks departments to define competencies shown without AI. ([ICAI](https://www.academicintegrity.org/aws/ICAI/pt/sd/news_article/636518/_PARENT/layout_details/false))

### Evidence — why not webcams
- Students on low bandwidth see proctoring software crash, disrupting tests or triggering cheating accusations; "a student in Afghanistan working with a 2G connection and no webcam". ([Wharton Magazine](https://magazine.wharton.upenn.edu/digital/the-surveillance-state-of-education/))
- Face detection struggles with darker faces → more ID failures and flags. ([Indiana University CITL](https://citl.indiana.edu/teaching-resources/diversity-inclusion/proctoring/index.html))
- False positives from biased AI led some jurisdictions to restrict remote proctoring. ([arXiv 2205.03009](https://arxiv.org/abs/2205.03009))
- Opaque data retention in proctoring privacy policies. ([Coda Story](https://www.codastory.com/?p=18910))

### Prior art — hidden-prompt traps
- History professor's hidden "mention Madagascar" prompt caught **32 of 35** students; one was cleared after showing the hidden white text **was visible in dark mode**. ([TechSpot](https://www.techspot.com/news/113243-professor-invisible-prompt-trap-catches-32-students-cheating.html), [IBTimes](https://www.ibtimes.co.uk/professors-ingenious-trap-exposes-ai-cheating-1811438), [HuffPost](https://www.huffpost.com/entry/history-professor-ai-cheating-students_n_69178150e4b0781acfd62540))
- Oklahoma "Dua Lipa / Finland" trap flagged 33 of 122 papers; 14 more confessed. (same coverage)
- Commentators: a trap is **"a clue, not a conviction"**; it fails if the student retypes or paraphrases the prompt; due-process concerns. ([PaperBleach](https://paperbleach.ai/post/trojan-horse-prompt-trick-hidden-instructions-catch-ai), [Lervan](https://lervan.com/guides/trojan-horse-assignment-prompts))

### Insight
- Lightweight browser signals (blur/visibility, paste, copy, keystroke-vs-text ratio, timing anomalies) cost almost no bandwidth and collect no biometric data.
- Fix the known canary failure mode: **don't hide text in the page**; inject the canary into the **clipboard on copy**. Nothing to see in dark mode and nothing for screen readers to read.
- Treat everything as signals → human review → optional **mini-viva** follow-up, which matches the viva direction reported in Pakistani universities. Contestable via Feature 3.

---

## Risks & Open Questions

| Risk | Mitigation |
|------|------------|
| Time budget (10 h, core first) | Tiered build plan in design doc §8; cut list defined |
| Judges see signals as "surveillance" | Upfront disclosure screen; no camera/mic/content; "signals, not evidence" wording |
| False canary hits | Per-attempt unique token; no-penalty-without-review; dispute path |
| Credit abuse (pulling power) | Cap, examiner approval > 5 min, incident visible, no credit when activity continues |
| Zero-width stripped | Ordering fingerprint + optional parameterized content |
| Few attempts → noisy difficulty stats | Bayesian smoothing with examiner prior (k = 10) |
| Sandbox polluting stats | `is_sandbox` excluded everywhere |

## Source Reliability Notes
- **Strong:** Dawn, Tribune, ARY, HEC PDF, PTA-based Profit reports, PMC/MDPI/JTLA papers, Pearson VUE/Xobin official docs, Internet Society Pulse.
- **Medium:** ProPakistani/TechJuice board notices, Wharton Magazine, IU CITL, news coverage of prompt-trap cases.
- **Weak / verify before quoting on stage:** VACE (marketing), Pakera guides, ldbypass (Respondus behaviour), Friday Times (opinion), vendor offline-exam blogs.
