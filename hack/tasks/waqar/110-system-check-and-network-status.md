---
status: done
tier: should
review: no
---
# Pre-exam system check and honest network status

## Goal
Before starting, Ayesha checks her connection and browser; during the exam the status line says how fresh her last save is. Covers secondary feature 4.1 and the research's Lahore School lesson (browsers and time zones broke submissions).

## What to build
- On `/exams/[examId]`: "Check my device" runs three quick checks with plain results: the server answers (and how fast), the device clock vs server time (shown, but it never matters), and local storage works for offline answers. A slow result says "Your connection is slow. Answers will still be kept on this phone."
- In the workspace bar: "Last saved 4 s ago", the number of queued answers, and connection quality from heartbeat round-trip time (good, slow, offline).

## Done when
Open Waves Practice Quiz → "Check my device": three green lines and the measured response time. DevTools network throttling "Slow 3G" in the workspace: the bar says "Slow connection" and saves still land.

## Owns
`src/features/delivery/`, `src/app/(app)/exams/`.

## Stand-ins
None.
