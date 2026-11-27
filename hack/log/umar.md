# umar
13:40 decided: authoring pages accept examiner or institution_admin; Pakistan time (UTC+5) helpers live in src/features/authoring/format.ts
14:16 shared: added accountCandidate fixture to tests/smoke/account.ts (account's paired Ayesha, signed in)
14:35 shared: pnpm test runs node --test on tests/unit/*.test.ts; tests/unit excluded from tsconfig
15:20 decided: key check flags 'likely wrong key' when top scorers prefer a wrong option over the key (seed gives B 50% vs C 38%)
15:35 decided: unmarked written answers do not block publishing results (count 0, marking later issues a new result version) so demo step 8 works after marking one
15:45 cut: question analytics skips written-question average marks
