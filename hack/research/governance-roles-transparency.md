# Governance: Super Admin, Institutions, Real Pakistani Exam Roles, Examiner Transparency & Candidate Reporting

> Extends the spec's three roles (Administrator / Examiner / Candidate, §02) into the **actual exam hierarchy of Pakistani universities and boards**, with a **super admin** above institutions. Goal: **examiners are monitored and accountable too**, not just candidates, and candidates get proper reporting channels.
> Spec fit: §02 roles, §3.1 "manage users, roles, access permissions", "access only what they're authorized for", §3.6 incidents, §5.4 trust, §06 security.

---

## 1. Why: examiner-side failures are real
| Evidence | What it shows |
|---|---|
| Rawalpindi: **435 examiners punished for wrong marking** (SSC 2024), after students' written complaints | Marking errors are systemic and are found only when students complain |
| Rawalpindi: examiner **arrested for taking a Rs 45,000 bribe to tamper with marks**, then demanding Rs 25,000 more | Mark tampering for money |
| Mianwali: students acknowledged paying **up to Rs 500,000 to have grades changed** | Post-result grade changes are an attack surface |
| Rawalpindi practical: **fail → full marks** reversal; enquiry held the **head examiner** responsible for tampering | Supervisors can tamper too, so supervisors need oversight |
| Mirpurkhas: **secrecy-branch staffer arrested**, a former controller among the suspended | Insiders in the exam office itself |
| Lahore BISE: **superintendent + 2 invigilators suspended for helping students cheat**; Faisalabad 2026: deputy superintendent and invigilator removed | Invigilators can facilitate cheating |
| Commentary: "virtually **no recourse** for a student wronged by a board"; university students "rarely succeed" with grade grievances; alleged nexus of **harassment and opaque, discretionary grading** | Candidates need protected, trackable reporting |
| MDCAT 2024: doctors in the leak network; Korea 2025–26: teachers leaking/stealing papers, 46 apprehended | Insider leaks |

**Principle:** *Everyone with power over a result leaves a trail, and someone independent can see it.*

---

## 2. How real Pakistani exam offices are organised (the model we mirror)
From university and board regulations (Sargodha, UET, Faisalabad Medical University, UHS, BISE Bahawalpur, NUML, FBISE, AWKUM):
- **Controller of Examinations (CoE):** runs exams under the Vice-Chancellor/Chairman, keeps the **secrecy** of paper printing and tabulation, frames exam regulations.
- **Secrecy branch:** paper setting and evaluation, printing/sealing, **security of papers**, **coding answer books with fictitious numbers** (blind marking), **centralised assessment**, paying setters/examiners.
- **Conduct branch:** date sheets, **appointing supervisory staff** (superintendents, invigilators).
- **Tabulation branch:** roll-number slips, **result sheets prepared with fictitious numbers, decoded just before announcement**, result notifications, mark certificates.
- **Paper setter, moderator/censor** (the censor is appointed by the Controller with VC approval), **examiners / head examiners**.
- **Superintendent & invigilators:** file a **daily declaration signed by at least two invigilators**; register **unfair-means (UFM) cases**.
- **Unfair Means Committee / Discipline Committee:** reviews **all evidence** (answer book, inspector's comments, **invigilator and student statements**), records a finding per candidate, recommends a penalty (cancel paper, fine, both).
- **Grievance committee** (universities): handles grade grievances; **if the teacher concerned is the Chairman, the Dean convenes**, which is a built-in conflict-of-interest rule.

---

## 3. Imtihaan Role Model

### 3.1 Levels
```
PLATFORM      Super Admin (Imtihaan operator)
                 │ onboards
INSTITUTION   University / College / Board / Testing body   (tenant)
                 ├── Institution Admin (Registrar / IT)
                 ├── Controller of Examinations
                 │     ├── Deputy Controller, Secrecy      (paper custody)
                 │     ├── Deputy Controller, Conduct      (scheduling, invigilation)
                 │     └── Deputy Controller, Results      (tabulation, publication, verification)
                 ├── Committees: Unfair Means Committee · Grievance & Dispute Committee
                 ├── Observer / External Auditor (read-only; e.g. HEC/board inspector)
DEPARTMENT       └── Head of Department / Chairperson (Dean as fallback)
EXAM (per exam staff assignment)
                     Paper Setter · Moderator · Examiner · Head Examiner · Invigilator
CANDIDATE        Student (enrolled per exam)
```

### 3.2 Roles & permissions (summary)
| Role | Can | Cannot |
|---|---|---|
| **Super Admin** | Create/suspend institutions, assign the first Institution Admin + CoE, platform health, **platform-wide audit**, global result-verification registry | **See exam content, answers or marks by default**. "Break-glass" access only with a written reason, time-limited and audited, and the institution is notified |
| **Institution Admin** | Users, departments, role assignments, bulk import, institution settings | Grade, publish, view papers |
| **Controller of Examinations** | Exam calendar; appoint deputies, committees and exam staff; **approve result publication**; **Examiner Transparency dashboard**; institution audit | Edit marks directly (only via a recorded, reasoned override that goes through two-person approval) |
| **Deputy Controller, Secrecy** | Approve the final paper; **time-lock release**; view **question access logs**; leak tracer/quarantine | Grade |
| **Deputy Controller, Conduct** | Schedule sessions; **assign invigilators**; live monitoring; announcements/errata; incident queue | Change questions or marks |
| **Deputy Controller, Results** | Run tabulation (decode blind IDs), Exam Forensics/Key Doctor, prepare results; publish **after CoE approval**; reports, verification | Change individual marks without the dispute/override flow |
| **Head of Department** | Oversight of the department's exams and examiners; convene grievances (Dean if HoD is conflicted) | Grade own-department disputes where they are the examiner |
| **Paper Setter** | Create questions, build papers/blueprints, answer keys | Approve own paper; see candidate identities |
| **Moderator** | Review and approve/return a paper (+ AI Paper Reviewer); flag issues | Edit the paper silently (changes go back to the setter, tracked) |
| **Examiner** | Grade assigned written answers **blind** (coded IDs), rubric-based | See candidate names; grade after lock; review disputes on their own grading |
| **Head Examiner** | Supervise examiners, double-marking/moderation, resolve discrepancies | Override without a reason; act on their own scripts |
| **Invigilator** | Watch assigned live sessions, log observations, **raise UFM reports** (second invigilator countersigns) | Decide penalties; see answers |
| **Unfair Means Committee** | Hear UFM cases with full evidence + candidate statement, record finding and penalty | Include the reporting invigilator as a member |
| **Grievance & Dispute Committee** | Resolve candidate disputes and **complaints against staff** | Include the person complained against |
| **Observer / Auditor** | Read-only: audit log, transparency dashboard, aggregated stats | Any write; personal data beyond what's needed |
| **Candidate** | Take assigned exams, see own results, **file reports, disputes and complaints**, track cases, submit statements | See others' data, examiner identities on their scripts |

A person can hold **different roles in different exams** (a lecturer is the setter in one course and the examiner in another). So exam-level roles come from an **exam staff assignment**, not a single global role.

### 3.3 Separation-of-duties rules (server-enforced)
1. **Setter ≠ Moderator** for the same paper.
2. **Examiner ≠ dispute reviewer** for the same answer; reviewer ≠ original grader.
3. **Grader ≠ result publisher**; publication needs **CoE approval** (two-person rule).
4. **Key changes after the exam** need Results Deputy + CoE (two-person), with reasons, then a question-wide regrade.
5. **Reporting invigilator ≠ UMC member** on that case; a UFM report needs a **second invigilator's countersign** (mirrors the board's two-invigilator declaration).
6. **Complained-against person ≠ committee member**; if the HoD is conflicted, the **Dean/CoE** convenes (mirrors the AWKUM rule).
7. **Conflict-of-interest declaration**: staff declare relatives/tutoring links at assignment; declared conflicts are auto-excluded.
8. **Marks lock after publication**; any change creates a new **result version** via dispute/override only.
9. **Super admin can't read content** without break-glass + audit + institution notification.

---

## 4. Examiner Transparency (oversight by CoE, HoD, Observers)

### 4.1 Blind marking (a real Pakistani practice, made digital)
- Examiners see **coded IDs** ("Script K7-0412"), never names or roll numbers; **decoding happens only at tabulation** (the fictitious-number system). This removes favouritism and harassment leverage at the source.

### 4.2 Examiner Transparency Dashboard (per examiner, per exam)
| Metric | Why |
|---|---|
| **Severity/leniency index**: avg % awarded vs second markers on the same scripts | Catches the 35%-variance problem |
| **Double-marking discrepancy rate** | Consistency |
| **Disputes upheld against their grading**, regrades caused | Quality + accountability |
| **Key errors in their papers** (from Exam Forensics) | Setter quality |
| **Turnaround**: scripts graded/day, overdue scripts | Delays |
| **Locked-mark change attempts** (blocked) and overrides used | Tampering signal |
| **Pass-boundary bumps**: unusual concentration of marks moved to just above the pass mark (e.g. 33%) | The classic bribery pattern |
| **Access anomalies**: viewing/exporting papers outside schedule, from unusual places, many downloads | Leak/insider signal (cf. CAA tests on a closed holiday) |
| **Grading outside working windows**, bulk edits in seconds | Rubber-stamping signal |

- Same rule as for candidates: **signals for review, not proof**. Examiners can see their own scorecard and respond. Fairness applies both ways.
- **Exam office activity feed**: "Examiner A changed Q4 marks for 3 scripts after the second marker disagreed (reason: rubric misread)."
- **AI layer (optional):** an "Oversight Analyst" agent writes a neutral monthly summary per department; the CoE decides.

### 4.3 Audit everything with power
Every action by setters, moderators, examiners, deputies, CoE and super admin (paper views, exports, key edits, grade entries and changes, publication, break-glass) goes into the **hash-chained audit log**. Observers can **verify the chain**.

---

## 5. Candidate Reporting & Case Tracking

| Channel | When | Goes to | Notes |
|---|---|---|---|
| **Report a problem** (in exam) | Question error, display issue, connection trouble | Conduct Deputy live queue | One tap per question; aggregated ("5 candidates reported Q7") → live errata and Key Doctor; timestamped for disruption credit |
| **Question objection** | Provisional key window after the exam | Results Deputy → Exam Forensics | Korea-style objection window |
| **Mark dispute** | After results | Grievance & Dispute Committee | Blind second review, no-penalty rule, versioned results |
| **Complaint against staff** (examiner, invigilator, setter) | Any time | Grievance Committee + CoE, **never the person named** | Bias, harassment, **bribe requests**, misconduct. **Confidential**, optional anonymous mode, evidence upload, anti-retaliation (blind marking means the examiner can't identify them) |
| **Leak / cheating tip** (whistleblower) | Any time | Secrecy Deputy → Leak Hunter | "Paper circulating on WhatsApp" + screenshot |
| **Accommodation request** | Before the exam | Conduct Deputy / Institution Admin | Extra time %, accessibility needs |
| **UFM case response** | When an unfair-means case is opened against them | UMC | Candidate sees the evidence summary and **submits a statement** (due process, as board rules require); outcome + appeal |

**Case tracker (for every report):** ticket ID → status (*received → under review → decision → closed*) → **SLA countdown** → written decision with reasons → appeal option. Candidates see their own cases only. CoE and Observers see aggregates (complaints per department/examiner, SLA breaches).

---

## 6. Data Model Additions (for the architecture)
```
institutions        id, name, type(university|college|board|test_body), city, status, created_by(super admin)
memberships         user_id, institution_id, department_id?, role(institution_admin|coe|dep_secrecy|dep_conduct|dep_results|hod|observer|candidate), active
departments         id, institution_id, name, hod_user_id, dean_user_id
exam_staff          exam_id, user_id, role(setter|moderator|examiner|head_examiner|invigilator), assigned_by, coi_declared bool
committees          id, institution_id, type(umc|grievance), members[]
script_codes        attempt_id, code (blind ID), decoded_at, decoded_by
reports             id, institution_id, reporter_id (nullable if anonymous), type(problem|objection|dispute|complaint|tip|accommodation|ufm_response), subject_ref, against_user_id?, body, evidence[], status, sla_due_at, assigned_committee, decision, decided_by, is_confidential
ufm_cases           id, attempt_id, reported_by, countersigned_by, evidence, candidate_statement, finding, penalty, decided_at
approvals           id, action(publish_results|key_change|override|break_glass), requested_by, approved_by, reason, at
examiner_metrics    (computed view) examiner_id, exam_id, severity_index, discrepancy_rate, disputes_upheld, boundary_bumps, access_anomalies
+ institution_id on every existing table (exams, questions, attempts, results, audit_events …)
```
Policy check becomes `can(user, action, resource)` = platform role × institution membership × exam staff role × separation-of-duty rules. All of it on the server (spec §3.1).

---

## 7. Scope for 10 Hours (suggested)
| Tier | Build |
|---|---|
| **Must** | Super admin → institution → CoE/admin/examiner/candidate roles; `exam_staff` (setter, examiner, invigilator); server policy check; **CoE approval to publish**; **blind marking (coded IDs)**; candidate **Report a problem** + **mark dispute** with case tracker |
| **Should** | Moderator approval step; **Examiner Transparency dashboard** (severity index, disputes upheld, locked-change attempts, boundary bumps); **confidential complaint against staff**; UFM case with invigilator countersign + candidate statement; observer read-only role |
| **Extra** | Separate Secrecy/Conduct/Results deputies; committees UI; conflict-of-interest declarations; break-glass flow; access-anomaly detection; Oversight Analyst agent |

**Demo moment:** CoE dashboard: *"Examiner R. grades 18% harsher than second markers; 3 disputes upheld; 7 scripts bumped from 31 to 33"* → drill into the audit trail → a candidate's confidential complaint shows up with its case tracker. **Pitch line:** *"In Rawalpindi, 435 examiners were punished only after students complained. Imtihaan shows the pattern before results go out, and gives students a safe place to say something."*

---

## Sources
**Exam office structure:** [University of Sargodha: Controller of Examinations](https://su.edu.pk/office/controller-office) · [UET: administrative branches](https://www.uet.edu.pk/about-uet/administration/administrative-branches/) · [UET: examination branch](https://www.uet.edu.pk/about-uet/administration/examination-branch/) · [Faisalabad Medical University: examination (secrecy, fictitious numbers)](http://pmc.edu.pk/Examination.aspx) · [UHS: examination regulations](https://www.uhs.edu.pk/downloads/examinationregulations.pdf) · [Examination system in Pakistan (study)](https://www.scribd.com/document/511275984/1586982123-unit-7)

**Unfair means / invigilation:** [BISE Bahawalpur rules](https://www.bisebwp.edu.pk/Rules.aspx) · [NUML: Unfair Means Committee policy](https://numl.edu.pk/offices/policies/1781622153UNFAIR%20MEANS%20COMMITTEE%20(UMC).pdf) · [FBISE: penalty for unfair means](https://mail.fbise.edu.pk/regulations_new/4-PENALTY%20FOR%20USE%20OF%20UNFAIR%20MEANS.pdf) · [Tribune: superintendent and invigilators suspended](https://tribune.com.pk/story/956947/supplementary-examinations-three-board-employees-suspended) · [APP: BISE removes invigilators](https://www.app.com.pk/?p=1231889) · [Dawn: invigilators removed in Attock](https://www.dawn.com/news/1539255/three-ssc-exam-invigilators-removed-in-attock)

**Grievances:** [AWKUM: examination rules 2018 (grievance committee)](https://aup.edu.pk/downloads/rules-regulations/Examinations%20Rules%20&%20Regulations%202018%20onwards.pdf) · [HEC draft semester examination guidelines](https://bnu.edu.pk/portals/HEC-Draft-Policy-Guidelines-for-Semester-Examination-System-(Final).pdf) · [PU semester rules](https://pu.edu.pk/puac/download/Semester_Rules.pdf)

**Examiner misconduct:** [The News: fraudulent examiner case](https://thenews.com.pk/print/1298694-fraudulent-examiner-case-highlights-oversight-issues-in-boards) · [Dawn: 400+ Rawalpindi examiners](https://www.dawn.com/news/amp/1872208) · [Tribune: corruption plagues exam results](https://tribune.com.pk/story/2435879/entertainment) · [Tribune: marks-rigged scandal](https://tribune.com.pk/story/2599873/marks-rigged-scandal-hits-over-2500-candidates) · [ARY: Rs5,000 per paper cheating scandal](https://arynews.tv/karachi-matric-exams-hit-by-cheating-scandal-rs5000-per-paper) · [Friday Times: grading in higher education](https://thefridaytimes.com/13-Jul-2022/poor-marks-for-the-grading-system-in-higher-education-institutions) · [Friday Times: board system (opinion)](https://www.thefridaytimes.com/23-Oct-2025/rot-within-pakistan-s-board-examination-system-produces-broken-futures)
