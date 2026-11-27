12:42 shared: all tables from hack/architecture.md, plus access (requireMember, can, myCandidateIds), exam-rules, paper, audit, codes and exam-types in src/lib
12:42 decided: exam data is scoped by institution_id, not user_id; user_id is only the creator, for cleanup
12:58 shared: seeded world, 4 demo logins (DEMO_EMAIL +examiner/+candidate/+admin/+platform), sign-up asks examiner or candidate, nav items carry an audience
