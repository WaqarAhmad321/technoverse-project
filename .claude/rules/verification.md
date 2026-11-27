# Verification: proof, at hackathon speed

A feature that was never run does not exist. A demo that breaks in front of the judges costs more than a missing feature.

## Every task
- Each task file has a "Done when" line. Do exactly that, for real, before marking the task done: click through it in a real browser, or call it over real HTTP against the running app.
- Evidence is the command and its result line. "It should work" is not evidence. If you could not check something, say so in the report.
- Before marking done, re-read your own diff once and try the four things that break demos: empty input, a second click on the same button, a slow or failing outside service, and a phone-width screen.

## The smoke test
- The smoke test is the demo story from `hack/requirements.md`, walked start to finish in a real browser. `scripts/check` runs it before every landing.
- When you finish a must-have that is a step of the demo story, extend the smoke test to cover that step in the same change.
- When a bug appears on the demo path, add the step that would have caught it, then fix the bug.
- Keep the whole check under about 90 seconds. It runs dozens of times today.

## Fix the code, not the test
- Never weaken an assertion, hard-code an expected value, or skip a step to get the check green.
- If the smoke test is wrong because the demo story changed, change the story in `hack/requirements.md` first, then the test.

## What not to test today
- No unit tests for glue code. Write one only for pure logic the demo depends on: a score, a price, a parser.
- No coverage targets, no test for every role, no fuzzing.

## Demo safety
- Every outside service on the demo path (an AI model, a map, a payment, an email) has a fallback listed in `hack/verification.md`: a cached answer, a recorded response or a plain message with a retry. The judge never sees a blank screen, a spinner that never ends or a raw error.
- The check never calls a paid or rate-limited service. In the check, outside services are replaced by recorded answers behind the demo-mode switch.
- The demo data can be reset to a known state with one command, written in `hack/demo.md`.
