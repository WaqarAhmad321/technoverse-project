12:42 shared: all tables from hack/architecture.md, plus access (requireMember, can, myCandidateIds), exam-rules, paper, audit, codes and exam-types in src/lib
12:42 decided: exam data is scoped by institution_id, not user_id; user_id is only the creator, for cleanup
12:58 shared: seeded world, 4 demo logins (DEMO_EMAIL +examiner/+candidate/+admin/+platform), sign-up asks examiner or candidate, nav items carry an audience
13:12 shared: shadcn base classes now follow hack/design.md (pill buttons/tabs, rounded inputs, flat cards); use PageHeader from @/components/page-header
13:50 decided: the exam workspace renders only in the browser (it reads answers queued on the phone); saves go through /api/attempts/[id]/answers with client_seq, higher wins
13:50 shared: memberOrNull() in src/lib/access.ts for route handlers; smoke fixture `world` gives an examiner page plus that institution's Ayesha on candidatePage, accounts made once per worker
13:50 note: the smoke test now takes about 2 minutes, mostly account setup against the remote database
14:18 shared: smoke waits raised (expect 12s, test 90s) in playwright.config.ts: every save is several round trips to the remote database
14:40 decided: result PDF is built on the server with pdf-lib and qrcode; standard fonts, so non-Latin characters are dropped from the PDF
15:00 shared: .high-contrast class in globals.css (candidate display setting); /api/time returns server time
15:20 decided: time back after an outage trusts the phone's count of answers typed offline; capped at 10% of the exam (exams.settings.credit_cap_pct), over 5 min needs the examiner's approval on the monitor
15:30 fix: audit hashes use key-sorted JSON (jsonb reorders keys); sign-up wait in the smoke fixture is 45s
15:40 shared: smoke fixture `account` is now one seeded examiner per worker (signed in per test); the database was timing out under per-test seeding. Ran reset-demo to clear leftovers
15:50 shared: roles controller, invigilator, observer in src/lib/access.ts; can(member, "results.approve", exam) is true for a controller who did not create the exam (for umar/160); "audit.view" for admin, controller, observer
15:40 shared: smoke fixture `freshAccount` gives a test its own seeded institution; the key-check test uses it because other tests change the shared Quiz 1
15:58 shared: scripts/local-db up|down runs a local Supabase for the check (needs Docker access); scripts/check uses it when local-db.vars exists. Migrations then also need scripts/db push against the cloud
16:48 shared: app frame is now a collapsible rounded sidebar (src/components/app-sidebar.tsx) with icons from src/components/nav-icons.tsx (add your href there); dark theme by default with a light toggle; StatTile and .lift hover in shared components
16:45 shared: product standard added to .claude/rules/ui-design.md (back links, Pagination, tooltips, Select, toasts via useActionToast, calm motion, nav icons); umar: please apply it to the authoring screens
