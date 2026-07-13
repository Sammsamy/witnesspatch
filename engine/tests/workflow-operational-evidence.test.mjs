import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  WORKFLOW_OPERATIONAL_EVIDENCE_CLAIM_BOUNDARY,
  WORKFLOW_OPERATIONAL_EVIDENCE_NOT_MEASURED,
  assertWorkflowOperationalEvidence,
  buildWorkflowOperationalEvidence
} from "../workflow-operational-evidence.mjs";

const testDir = dirname(fileURLToPath(import.meta.url));
const engineDir = dirname(testDir);
const rootDir = dirname(engineDir);

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function proofReceipt() {
  return readJson(join(rootDir, "proof", "codex-policy-repair-receipt.json"));
}

function clone(value) {
  return structuredClone(value);
}

test("derives the exact bounded observation from the retained proof receipt", async () => {
  const receipt = await proofReceipt();
  const evidence = buildWorkflowOperationalEvidence({
    repairReceipt: receipt,
    holdoutsPassed: 13,
    holdoutsTotal: 13
  });

  assert.equal(
    evidence.observation.label,
    "One observed authored-fixture-to-validated-candidate wall-clock run"
  );
  assert.equal(evidence.observation.sample_size, 1);
  assert.equal(evidence.observation.started_at, "2026-07-13T07:11:04.066Z");
  assert.equal(
    evidence.observation.validated_candidate_at,
    "2026-07-13T07:12:57.836Z"
  );
  assert.equal(evidence.observation.observed_wall_clock_ms, 113_770);
  assert.deepEqual(evidence.observation.clock, {
    source: "system_wall_clock",
    monotonic: false,
    derivation: "validated_candidate_at minus started_at"
  });
  assert.deepEqual(evidence.observation.authentication, {
    state_at_start: "preexisting_chatgpt_session",
    included_in_observed_interval: false
  });
  assert.equal(evidence.observation.cache_state, "unknown");
  assert.deepEqual(evidence.candidate_outcomes, {
    urgent: receipt.deterministic_validation.candidate_urgent,
    benign: receipt.deterministic_validation.candidate_benign
  });
  assert.deepEqual(evidence.holdouts, {
    passed: 13,
    total: 13,
    all_passed: true,
    included_in_observed_interval: false
  });
  assert.deepEqual(
    evidence.not_measured,
    WORKFLOW_OPERATIONAL_EVIDENCE_NOT_MEASURED
  );
  assert.equal(
    evidence.claim_boundary,
    WORKFLOW_OPERATIONAL_EVIDENCE_CLAIM_BOUNDARY
  );
  assert.equal(assertWorkflowOperationalEvidence(evidence), evidence);
});

test("the builder is deterministic and the schema carries the same fixed boundaries", async () => {
  const receipt = await proofReceipt();
  const inputs = {
    repairReceipt: receipt,
    holdoutsPassed: 13,
    holdoutsTotal: 13
  };
  const first = buildWorkflowOperationalEvidence(inputs);
  const second = buildWorkflowOperationalEvidence(inputs);
  const schema = await readJson(
    join(rootDir, "contracts", "workflow-operational-evidence.schema.json")
  );

  assert.deepEqual(first, second);
  assert.equal(
    schema.properties.observation.properties.label.const,
    first.observation.label
  );
  assert.deepEqual(schema.properties.not_measured.const, first.not_measured);
  assert.equal(
    schema.properties.claim_boundary.const,
    first.claim_boundary
  );
  assert.equal(
    schema.properties.observation.properties.clock.properties.monotonic.const,
    false
  );
});

test("rejects invalid, noncanonical, and reversed receipt timestamps", async () => {
  const receipt = await proofReceipt();

  for (const invalidTimestamp of [
    "2026-02-30T07:11:04.066Z",
    "2026-07-13T07:11:04Z",
    "2026-07-13T07:11:04.066+00:00",
    "not-a-time"
  ]) {
    const invalid = clone(receipt);
    invalid.started_at = invalidTimestamp;
    assert.throws(
      () =>
        buildWorkflowOperationalEvidence({
          repairReceipt: invalid,
          holdoutsPassed: 13,
          holdoutsTotal: 13
        }),
      /timestamp/
    );
  }

  const reversed = clone(receipt);
  reversed.generated_at = "2026-07-13T07:11:04.065Z";
  assert.throws(
    () =>
      buildWorkflowOperationalEvidence({
        repairReceipt: reversed,
        holdoutsPassed: 13,
        holdoutsTotal: 13
      }),
    /must not precede/
  );
});

test("rejects every form of a nonpassing candidate summary", async () => {
  const receipt = await proofReceipt();
  const mutations = [
    (candidate) => {
      candidate.status = "fail";
    },
    (candidate) => {
      candidate.score = 99;
    },
    (candidate) => {
      candidate.critical_failures = ["INV-02"];
    },
    (candidate) => {
      candidate.future_fact_violations = 1;
    }
  ];

  for (const outcomeName of ["candidate_urgent", "candidate_benign"]) {
    for (const mutate of mutations) {
      const nonpassing = clone(receipt);
      mutate(nonpassing.deterministic_validation[outcomeName]);
      assert.throws(() =>
        buildWorkflowOperationalEvidence({
          repairReceipt: nonpassing,
          holdoutsPassed: 13,
          holdoutsTotal: 13
        })
      );
    }
  }

  const rejectedReceipt = clone(receipt);
  rejectedReceipt.status = "rejected_candidate";
  assert.throws(
    () =>
      buildWorkflowOperationalEvidence({
        repairReceipt: rejectedReceipt,
        holdoutsPassed: 13,
        holdoutsTotal: 13
      }),
    /validated candidate/
  );
});

test("rejects incomplete or invalid holdout summaries", async () => {
  const receipt = await proofReceipt();

  for (const [holdoutsPassed, holdoutsTotal] of [
    [12, 13],
    [0, 0],
    [-1, 13],
    [13.5, 13.5]
  ]) {
    assert.throws(() =>
      buildWorkflowOperationalEvidence({
        repairReceipt: receipt,
        holdoutsPassed,
        holdoutsTotal
      })
    );
  }
});

test("enforces timestamp arithmetic and claim boundaries on constructed artifacts", async () => {
  const receipt = await proofReceipt();
  const evidence = buildWorkflowOperationalEvidence({
    repairReceipt: receipt,
    holdoutsPassed: 13,
    holdoutsTotal: 13
  });

  const wrongDuration = clone(evidence);
  wrongDuration.observation.observed_wall_clock_ms += 1;
  assert.throws(
    () => assertWorkflowOperationalEvidence(wrongDuration),
    /timestamp difference/
  );

  const falseMonotonicClaim = clone(evidence);
  falseMonotonicClaim.observation.clock.monotonic = true;
  assert.throws(
    () => assertWorkflowOperationalEvidence(falseMonotonicClaim),
    /must not be labeled monotonic/
  );

  const narrowedNotMeasured = clone(evidence);
  narrowedNotMeasured.not_measured.pop();
  assert.throws(
    () => assertWorkflowOperationalEvidence(narrowedNotMeasured),
    /not_measured boundary/
  );

  const inflatedClaim = clone(evidence);
  inflatedClaim.claim_boundary = "A production latency benchmark.";
  assert.throws(
    () => assertWorkflowOperationalEvidence(inflatedClaim),
    /claim boundary/
  );

  const includedHoldoutTiming = clone(evidence);
  includedHoldoutTiming.holdouts.included_in_observed_interval = true;
  assert.throws(
    () => assertWorkflowOperationalEvidence(includedHoldoutTiming),
    /outside the observed interval/
  );
});

test("does not impose a workflow speed threshold", async () => {
  const receipt = await proofReceipt();
  receipt.generated_at = "2027-07-13T07:12:57.836Z";
  const evidence = buildWorkflowOperationalEvidence({
    repairReceipt: receipt,
    holdoutsPassed: 13,
    holdoutsTotal: 13
  });

  assert.ok(evidence.observation.observed_wall_clock_ms > 365 * 24 * 60 * 60 * 1000);
  assert.equal(assertWorkflowOperationalEvidence(evidence), evidence);
});
