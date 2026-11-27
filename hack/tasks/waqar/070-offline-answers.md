---
status: done
tier: must
review: yes
---
# Keep answering offline, sync when back

## Goal
When the network drops, Ayesha keeps answering; answers are kept on the phone and sent when the connection returns, and she can see exactly what is saved. The outage moment of the demo (step 5) and the heart of innovation challenge 5.3.

## What to build
- A small client queue in `src/features/delivery/`: each change gets a rising `client_seq` and goes into IndexedDB (or localStorage) keyed by attempt and question before it is sent. Sent items leave the queue only after the server confirms. Retries with backoff.
- Answers typed offline are sent with `saved_offline = true`. The server's rules from task 050 still decide: later than the deadline means refused.
- Status bar, one line, `aria-live="polite"`: "All answers saved", "Saving…", "Offline: 3 answers kept on this phone", "Back online, sending 3 answers…". Never a raw error.
- Heartbeat every 15 seconds to `/api/attempts/[attemptId]/heartbeat`; the server sets `last_seen_at`. When a heartbeat arrives after a gap over 30 seconds, the server writes an `offline` incident with the gap in seconds.
- Online state comes from whether requests succeed, not only from `navigator.onLine`.
- The queue for an attempt is cleared after submit, so a shared phone keeps nothing.

## Edge cases judges try
DevTools → Offline, answer three questions, reload while still offline: the page shows what is kept on the phone (if the shell is cached) or a plain offline message; back online, everything syncs. Change one answer offline twice: only the last value wins on the server.

## Done when
Start Waves Practice Quiz, turn the network off in DevTools, answer three questions: "Offline: 3 answers kept on this phone". Turn it on: "All answers saved" within five seconds; the database has those answers with `saved_offline = true` and one `offline` incident.

## Owns
`src/features/delivery/`, `src/app/api/attempts/`.

## Stand-ins
None.
