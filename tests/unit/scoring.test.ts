import { test } from "node:test";
import assert from "node:assert/strict";
import { scoreObjective, type ScoringSnapshot } from "../../src/features/authoring/scoring.ts";

const single: ScoringSnapshot = { kind: "single", marks: 3, multiple_rule: "partial", answer_key: ["c"] };
const partial: ScoringSnapshot = { kind: "multiple", marks: 4, multiple_rule: "partial", answer_key: ["a", "c", "d"] };
const strict: ScoringSnapshot = { ...partial, multiple_rule: "all_or_nothing" };

test("single: full marks or nothing", () => {
  assert.equal(scoreObjective(single, { choices: ["c"] }), 3);
  assert.equal(scoreObjective(single, { choices: ["b"] }), 0);
  assert.equal(scoreObjective(single, null), 0);
});

test("multiple partial: (right − wrong) / keyed × marks, never below zero", () => {
  assert.equal(scoreObjective(partial, { choices: ["a", "c", "d"] }), 4);
  assert.equal(scoreObjective(partial, { choices: ["a", "c"] }), 2.67);
  assert.equal(scoreObjective(partial, { choices: ["a", "b"] }), 0);
  assert.equal(scoreObjective(partial, { choices: ["b", "e"] }), 0);
});

test("multiple all-or-nothing", () => {
  assert.equal(scoreObjective(strict, { choices: ["a", "c", "d"] }), 4);
  assert.equal(scoreObjective(strict, { choices: ["a", "c"] }), 0);
});

test("key fixes override the snapshot key", () => {
  const change = { decision: "change_key" as const, old_key: ["c"], new_key: ["b"] };
  assert.equal(scoreObjective(single, { choices: ["b"] }, change), 3);
  assert.equal(scoreObjective(single, { choices: ["c"] }, change), 0);
  const both = { decision: "accept_both" as const, old_key: ["c"], new_key: ["b"] };
  assert.equal(scoreObjective(single, { choices: ["b"] }, both), 3);
  assert.equal(scoreObjective(single, { choices: ["c"] }, both), 3);
  assert.equal(scoreObjective(single, { choices: ["a"] }, { decision: "full_marks", old_key: ["c"], new_key: null }), 3);
  assert.equal(scoreObjective(single, { choices: ["c"] }, { decision: "drop", old_key: ["c"], new_key: null }), 0);
});

test("key doctor flags a key the top scorers reject", async () => {
  const { runKeyDoctor } = await import("../../src/features/authoring/key-doctor.ts");
  const question = { question_id: "q7", position: 7, options: ["a", "b", "c", "d"].map((id) => ({ id, text: id })), answer_key: ["c"] };
  const attempts = Array.from({ length: 30 }, (_, index) => ({
    total: 30 - index,
    choices: new Map([["q7", [index < 15 ? "b" : "c"]]]),
  }));
  const [flag] = runKeyDoctor([question], attempts);
  assert.equal(flag?.kind, "wrong_key");
  assert.equal(flag?.summary, "Q7: 100% of the top scorers chose B, the key says C.");
});
