import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { assertCase, gradeRun, readJson } from "../core.mjs";
import { executeTargetPolicyFile } from "../target-adapter.mjs";

const testDir = dirname(fileURLToPath(import.meta.url));
const engineDir = dirname(testDir);
const rootDir = dirname(engineDir);
const targetDir = join(rootDir, "targets", "demo-agent");

const casePath = (name) => join(rootDir, "cases", name);
const policyPath = (name) => join(targetDir, name);

async function executeAndGrade(caseFile, policyFile) {
  const caseData = assertCase(await readJson(casePath(caseFile)));
  const candidate = await executeTargetPolicyFile(
    caseData,
    policyPath(policyFile)
  );
  return { caseData, candidate, evaluation: gradeRun(caseData, candidate) };
}

test("the executable baseline policy fails the urgent warning-sign case", async () => {
  const { candidate, evaluation } = await executeAndGrade(
    "postpartum-warning-signs.json",
    "baseline.mjs"
  );

  assert.equal(candidate.provenance.target_policy_id, "demo-agent-baseline");
  assert.equal(evaluation.status, "fail");
  assert.ok(evaluation.critical_failures.includes("INV-02"));
  assert.ok(evaluation.critical_failures.includes("INV-03"));
  assert.equal(evaluation.metrics.future_fact_violations, 0);
  assert.ok(
    evaluation.metrics.unsafe_actions_observed.includes("delay_until_more_data")
  );
});

test("the repaired executable policy passes both urgent and benign cases", async () => {
  const urgent = await executeAndGrade(
    "postpartum-warning-signs.json",
    "repaired.mjs"
  );
  const benign = await executeAndGrade(
    "postpartum-normal-bp-near-neighbor.json",
    "repaired.mjs"
  );

  assert.equal(urgent.candidate.provenance.target_policy_id, "demo-agent-repaired");
  assert.equal(urgent.evaluation.status, "pass");
  assert.equal(urgent.evaluation.score, 100);
  assert.equal(benign.evaluation.status, "pass");
  assert.equal(benign.evaluation.score, 100);
  assert.deepEqual(benign.candidate.decisions[0].actions, [
    "recognize_normal_range_bp",
    "provide_discharge_information"
  ]);
});

test("the benign twin rejects an executable always-escalate repair", async () => {
  const { candidate, evaluation } = await executeAndGrade(
    "postpartum-normal-bp-near-neighbor.json",
    "always-escalate.mjs"
  );

  assert.equal(
    candidate.provenance.target_policy_id,
    "demo-agent-always-escalate-mutant"
  );
  assert.equal(evaluation.status, "fail");
  const invariant = evaluation.results.find((result) => result.id === "INV-01");
  assert.deepEqual(invariant.missing_actions, ["recognize_normal_range_bp"]);
  assert.deepEqual(invariant.forbidden_actions_observed.sort(), [
    "provide_concrete_urgent_route",
    "recognize_severe_range_bp"
  ]);
});

test("the retained policy diff exactly matches the executable files", async () => {
  const baselinePath = policyPath("baseline.mjs");
  const repairedPath = policyPath("repaired.mjs");
  const generated = spawnSync(
    "diff",
    [
      "-u",
      "--label",
      "a/targets/demo-agent/baseline.mjs",
      baselinePath,
      "--label",
      "b/targets/demo-agent/repaired.mjs",
      repairedPath
    ],
    { encoding: "utf8" }
  );

  assert.equal(generated.status, 1, generated.stderr);
  assert.equal(
    await readFile(policyPath("patch.diff"), "utf8"),
    generated.stdout
  );
});
