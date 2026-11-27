import { test } from "node:test";
import assert from "node:assert/strict";
import { buildPaper, pickVersion } from "../../src/lib/paper.ts";
import type { Question, QuestionVariant } from "../../src/lib/exam-types.ts";

function variant(key: string, status: QuestionVariant["status"], sourceVersion = 1): QuestionVariant {
  return {
    key,
    body: `Variant ${key}`,
    options: [{ id: "a", text: "x" }, { id: "b", text: "y" }],
    answer_key: ["b"],
    status,
    source_version: sourceVersion,
    solves: [["b"], ["b"]],
  };
}

const question: Question = {
  id: "7f1c2a9e-0000-4000-8000-000000000001",
  user_id: "u",
  institution_id: "i",
  created_at: "2026-11-27T00:00:00Z",
  topic: "Kinematics",
  difficulty: "medium",
  kind: "single",
  body: "Original",
  options: [{ id: "a", text: "x" }, { id: "b", text: "y" }],
  answer_key: ["a"],
  marks: 3,
  multiple_rule: "partial",
  rubric: null,
  version: 1,
  variants: [variant("v1", "approved"), variant("v2", "approved"), variant("v3", "proposed"), variant("v4", "approved", 0)],
};

const SEEDS = Array.from({ length: 200 }, (_, index) => index + 1);

test("the same seed always gives the same version", () => {
  for (const seed of SEEDS) assert.deepEqual(pickVersion(question, seed), pickVersion(question, seed));
});

test("only approved versions for the current wording reach a paper, alongside the original", () => {
  const picked = new Set(SEEDS.map((seed) => pickVersion(question, seed).variant_key));
  assert.deepEqual([...picked].sort(), [null, "v1", "v2"].sort());
});

test("a version carries its own key into the snapshot", () => {
  const row = buildPaper({ shuffle_questions: false, shuffle_options: false }, [{ position: 1, question }], SEEDS.find((seed) => pickVersion(question, seed).variant_key === "v1") ?? 0)[0];
  assert.equal(row?.variant_key, "v1");
  assert.equal(row?.body, "Variant v1");
  assert.deepEqual(row?.answer_key, ["b"]);
});

test("a question with no versions always gives the original", () => {
  const plain = { ...question, variants: [] };
  for (const seed of SEEDS) assert.equal(pickVersion(plain, seed).variant_key, null);
});
