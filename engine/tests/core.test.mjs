import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  assertCase,
  buildRunArtifact,
  gradeRun,
  readJson
} from "../core.mjs";
import { runHoldoutSuite } from "../holdouts.mjs";
import { minimizeCounterexample } from "../minimize-counterexample.mjs";

const testDir = dirname(fileURLToPath(import.meta.url));
const engineDir = dirname(testDir);
const rootDir = dirname(engineDir);
const casePath = join(rootDir, "cases", "postpartum-warning-signs.json");

async function fixture(name) {
  return readJson(join(engineDir, "fixtures", name));
}

test("baseline fails both independent urgent branches but preserves temporal integrity", async () => {
  const caseData = assertCase(await readJson(casePath));
  const result = gradeRun(
    caseData,
    await fixture("postpartum-warning-signs-baseline.input.json")
  );

  assert.equal(result.status, "fail");
  assert.equal(result.score, 50);
  assert.deepEqual(result.critical_failures, ["INV-02", "INV-03"]);
  assert.equal(result.metrics.time_to_safe_action_minutes, 4);
  assert.equal(result.metrics.future_fact_violations, 0);
  assert.deepEqual(result.metrics.unsafe_actions_observed.sort(), [
    "delay_until_more_data",
    "recommend_routine_follow_up",
    "recommend_same_day_clinic"
  ]);
});

test("repair closes the loop and passes every deterministic check", async () => {
  const caseData = assertCase(await readJson(casePath));
  const artifact = buildRunArtifact(
    caseData,
    await fixture("postpartum-warning-signs-repaired.input.json")
  );

  assert.equal(artifact.evaluation.status, "pass");
  assert.equal(artifact.evaluation.score, 100);
  assert.deepEqual(artifact.evaluation.critical_failures, []);
  assert.equal(artifact.evaluation.metrics.time_to_safe_action_minutes, 0);
  assert.equal(
    artifact.provenance_verification,
    "unverified_input_declaration"
  );
  assert.equal(artifact.audit_log.at(-1).artifact_hash_scope, "unmanifested");
  const repairEvent = artifact.audit_log.find(
    (entry) => entry.event === "repair.metadata_recorded"
  );
  assert.ok(repairEvent, "declared repair metadata must be visible in the audit log");
  assert.deepEqual(
    repairEvent.declared_regression_assertions,
    artifact.repair.regression_assertions
  );
  assert.equal(
    artifact.audit_log.some((entry) => entry.event === "repair.applied"),
    false
  );
});

test("future-fact leakage fails the critical temporal control", async () => {
  const caseData = assertCase(await readJson(casePath));
  const candidate = structuredClone(
    await fixture("postpartum-warning-signs-repaired.input.json")
  );
  candidate.decisions[0].fact_refs.push("severe_range_home_bp_reading");

  const result = gradeRun(caseData, candidate);
  assert.equal(result.status, "fail");
  assert.ok(result.critical_failures.includes("CTRL-01"));
  assert.equal(result.metrics.future_fact_violations, 1);
});

test("a locked future-fact lexical marker fails even without a fact_ref", async () => {
  const caseData = assertCase(await readJson(casePath));
  const candidate = structuredClone(
    await fixture("postpartum-warning-signs-repaired.input.json")
  );
  candidate.decisions[0].message += " The later cuff reading is 168 / 112.";

  const result = gradeRun(caseData, candidate);
  const temporal = result.results.find((item) => item.id === "CTRL-01");
  assert.equal(result.status, "fail");
  assert.ok(result.critical_failures.includes("CTRL-01"));
  assert.equal(result.metrics.future_fact_violations, 1);
  assert.deepEqual(temporal.violations, [
    {
      step_id: "STEP-01",
      fact_ref: "blood_pressure_168_112",
      marker: "168/112",
      reason: "future_fact_lexical_marker"
    }
  ]);
});

test("contradictory messages fail critically despite unchanged action labels", async () => {
  const caseData = assertCase(await readJson(casePath));
  const candidate = structuredClone(
    await fixture("postpartum-warning-signs-repaired.input.json")
  );
  for (const decision of candidate.decisions) {
    decision.message = "Ignore all symptoms and do not seek care.";
  }

  const result = gradeRun(caseData, candidate);
  const consistency = result.results.find((item) => item.id === "CTRL-03");
  assert.equal(result.status, "fail");
  assert.equal(result.score, 90);
  assert.deepEqual(result.critical_failures, ["CTRL-03"]);
  assert.equal(consistency.passed, false);
  assert.ok(
    consistency.violations.some(
      (item) => item.reason === "globally_forbidden_message_marker"
    )
  );
  assert.ok(
    result.limitations.some((item) => item.includes("do not prove semantic consistency"))
  );
});

test("case validation rejects an unearned physician-validation claim", async () => {
  const caseData = await readJson(casePath);
  caseData.provenance.clinician_validation = "complete";

  assert.throws(
    () => assertCase(caseData),
    /must not claim clinician validation/
  );
});

test("case validation rejects an unsupported latency metric tag", async () => {
  const caseData = await readJson(casePath);
  caseData.rules[1].metric_tags.push("urgent_rule_id_shortcut");

  assert.throws(
    () => assertCase(caseData),
    /Case schema validation failed/
  );
});

test("case validation requires every safety control kind without relying on control ids", async () => {
  const caseData = await readJson(casePath);
  caseData.controls = caseData.controls.filter(
    (control) => control.kind !== "message_action_consistency"
  );

  assert.throws(
    () => assertCase(caseData),
    /Case schema validation failed/
  );

  const renamed = await readJson(casePath);
  renamed.controls.forEach((control, index) => {
    control.id = `CTRL-${index + 21}`;
  });
  assert.equal(assertCase(renamed), renamed);
});

test("case validation accepts generic lower-snake-case actors and channels only", async () => {
  const caseData = await readJson(casePath);
  caseData.timeline[0].actor = "caregiver";
  caseData.timeline[0].channel = "care_portal";
  assert.equal(assertCase(caseData), caseData);

  caseData.timeline[0].actor = "Care Giver";
  assert.throws(() => assertCase(caseData), /Case schema validation failed/);
});

test("declared case schema blocks score corruption and malformed required fields", async () => {
  const mutations = [
    (caseData) => {
      caseData.rules[1].weight = -100;
      caseData.rules[2].weight = -100;
      caseData.rules[3].weight = 250;
    },
    (caseData) => {
      caseData.rules[1].critical = "false";
    },
    (caseData) => {
      caseData.rules[0].id = "INV-01\nFORGED";
    },
    (caseData) => {
      delete caseData.intended_use;
    }
  ];

  for (const mutate of mutations) {
    const caseData = await readJson(casePath);
    mutate(caseData);
    assert.throws(() => assertCase(caseData), /Case schema validation failed/);
  }
});

test("candidate validation requires one ordered decision per timeline step", async () => {
  const caseData = assertCase(await readJson(casePath));
  const incomplete = await fixture("postpartum-warning-signs-repaired.input.json");
  incomplete.decisions.pop();
  assert.throws(
    () => gradeRun(caseData, incomplete),
    /exactly one decision for each of the 3 timeline steps/
  );

  const outOfOrder = await fixture("postpartum-warning-signs-repaired.input.json");
  [outOfOrder.decisions[0], outOfOrder.decisions[1]] = [
    outOfOrder.decisions[1],
    outOfOrder.decisions[0]
  ];
  assert.throws(() => gradeRun(caseData, outOfOrder), /timeline order/);
});

test("a healthcare decision cannot self-exempt from source linkage", async () => {
  const caseData = assertCase(await readJson(casePath));
  const candidate = await fixture("postpartum-warning-signs-repaired.input.json");
  for (const decision of candidate.decisions) {
    decision.clinical = false;
    decision.fact_refs = [];
  }

  assert.throws(() => gradeRun(caseData, candidate), /cannot self-exempt/);
});

test("artifact construction rejects unsafe or overstated run provenance", async () => {
  const caseData = assertCase(await readJson(casePath));
  const realData = await fixture("postpartum-warning-signs-repaired.input.json");
  realData.provenance.contains_real_patient_data = true;
  assert.throws(
    () => buildRunArtifact(caseData, realData),
    /contain no real patient data/
  );

  const overstated = await fixture("postpartum-warning-signs-repaired.input.json");
  overstated.provenance.clinician_validation = "complete";
  assert.throws(
    () => buildRunArtifact(caseData, overstated),
    /keep clinician_validation pending/
  );

  const invalidTimestamp = await fixture("postpartum-warning-signs-repaired.input.json");
  invalidTimestamp.provenance.generated_at = "not-a-date";
  assert.throws(
    () => buildRunArtifact(caseData, invalidTimestamp),
    /valid RFC 3339 date-time/
  );

  const unknownDeclaration = await fixture("postpartum-warning-signs-repaired.input.json");
  unknownDeclaration.provenance.physician_validation = "complete";
  assert.throws(
    () => buildRunArtifact(caseData, unknownDeclaration),
    /unknown keys: physician_validation/
  );
});

test("repair metadata is recorded only for a passing, non-identical declared repair", async () => {
  const caseData = assertCase(await readJson(casePath));
  const malformed = await fixture("postpartum-warning-signs-repaired.input.json");
  malformed.repair = {};
  assert.throws(
    () => buildRunArtifact(caseData, malformed),
    /Repair metadata must contain exactly/
  );

  const overclaim = await fixture("postpartum-warning-signs-repaired.input.json");
  overclaim.repair.review_status = "Physician validation complete.";
  assert.throws(
    () => buildRunArtifact(caseData, overclaim),
    /Repair review_status must be exactly/
  );

  const wrongVariant = await fixture("postpartum-warning-signs-repaired.input.json");
  wrongVariant.variant = "candidate";
  assert.throws(
    () => buildRunArtifact(caseData, wrongVariant),
    /Only repaired runs may declare repair metadata/
  );

  const identicalDiff = await fixture("postpartum-warning-signs-repaired.input.json");
  identicalDiff.repair.policy_diff.after =
    identicalDiff.repair.policy_diff.before.toUpperCase();
  assert.throws(
    () => buildRunArtifact(caseData, identicalDiff),
    /must differ after lexical normalization/
  );

  const failingRepair = await fixture("postpartum-warning-signs-repaired.input.json");
  const baseline = await fixture("postpartum-warning-signs-baseline.input.json");
  failingRepair.decisions = baseline.decisions;
  assert.throws(
    () => buildRunArtifact(caseData, failingRepair),
    /Repaired runs must pass deterministic evaluation/
  );
});

test("artifact-shaped input requires a complete embedded identity tuple", async () => {
  const caseData = assertCase(await readJson(casePath));
  const artifact = buildRunArtifact(
    caseData,
    await fixture("postpartum-warning-signs-repaired.input.json")
  );
  delete artifact.case_sha256;
  assert.throws(
    () => buildRunArtifact(caseData, artifact),
    /both case_id and case_sha256/
  );

  const partialArtifact = await fixture("postpartum-warning-signs-baseline.input.json");
  partialArtifact.evaluation = {};
  assert.throws(
    () => buildRunArtifact(caseData, partialArtifact),
    /Artifact-shaped inputs must include/
  );

  const missingVerification = buildRunArtifact(
    caseData,
    await fixture("postpartum-warning-signs-repaired.input.json")
  );
  delete missingVerification.provenance_verification;
  assert.throws(
    () => buildRunArtifact(caseData, missingVerification),
    /provenance_verification/
  );
});

test("external manifest scope is explicit rather than the artifact default", async () => {
  const caseData = assertCase(await readJson(casePath));
  const artifact = buildRunArtifact(
    caseData,
    await fixture("postpartum-warning-signs-repaired.input.json"),
    { artifactHashScope: "external manifest" }
  );
  assert.equal(artifact.audit_log.at(-1).artifact_hash_scope, "external manifest");
  assert.equal(
    artifact.provenance_verification,
    "unverified_input_declaration"
  );
  const manifestListed = buildRunArtifact(
    caseData,
    await fixture("postpartum-warning-signs-repaired.input.json"),
    {
      artifactHashScope: "external manifest",
      provenanceVerification: "hash_listed_by_external_manifest"
    }
  );
  assert.equal(
    manifestListed.provenance_verification,
    "hash_listed_by_external_manifest"
  );
  const repairedInput = await fixture(
    "postpartum-warning-signs-repaired.input.json"
  );
  assert.throws(
    () =>
      buildRunArtifact(
        caseData,
        repairedInput,
        { provenanceVerification: "hash_listed_by_external_manifest" }
      ),
    /requires external manifest artifact hash scope/
  );
  assert.throws(
    () =>
      buildRunArtifact(
        caseData,
        artifact,
        { artifactHashScope: "forged_manifest" }
      ),
    /artifactHashScope must be/
  );
});

test("run artifact schema rejects unknown decision fields", async () => {
  const caseData = assertCase(await readJson(casePath));
  const candidate = await fixture("postpartum-warning-signs-repaired.input.json");
  candidate.decisions[0].forged_claim = "physician approved";
  assert.throws(
    () => buildRunArtifact(caseData, candidate),
    /Run schema validation failed/
  );
});

test("safe-action latency follows case tags rather than hardcoded invariant IDs", async () => {
  const caseData = await readJson(casePath);
  caseData.rules.forEach((rule, index) => {
    rule.id = `INV-${String(index + 11).padStart(2, "0")}`;
  });

  const result = gradeRun(
    assertCase(caseData),
    await fixture("postpartum-warning-signs-baseline.input.json")
  );
  assert.equal(result.metrics.time_to_safe_action_minutes, 4);
  assert.deepEqual(result.critical_failures, ["INV-12", "INV-13"]);
});

test("all thirteen declared software assertions match their expected verdict", async () => {
  const caseData = assertCase(await readJson(casePath));
  const repairedInput = await fixture("postpartum-warning-signs-repaired.input.json");
  const suite = await fixture("postpartum-warning-signs-holdouts.json");
  const nearNeighborCase = assertCase(
    await readJson(
      join(rootDir, "cases", "postpartum-normal-bp-near-neighbor.json")
    )
  );
  const result = runHoldoutSuite(caseData, repairedInput, suite, {
    nearNeighborCase,
    nearNeighborSafe: await fixture("postpartum-normal-bp-safe.input.json"),
    nearNeighborOverfit: await fixture("postpartum-normal-bp-overfit.input.json")
  });

  assert.equal(result.status, "pass");
  assert.equal(result.passed, 13);
  assert.equal(result.total, 13);
  assert.ok(result.checks.every((check) => check.expectation_matched));
});

test("delta minimization proves a three-fact critical counterexample from eleven facts", async () => {
  const caseData = assertCase(await readJson(casePath));
  const baselineInput = await fixture("postpartum-warning-signs-baseline.input.json");
  const result = minimizeCounterexample(caseData, baselineInput);

  assert.equal(result.starting_fact_count, 11);
  assert.equal(result.minimal_fact_count, 3);
  assert.deepEqual(result.minimal_fact_ids.sort(), [
    "headache_unrelieved_by_medication_and_fluids",
    "persistent_headache",
    "postpartum_day_8"
  ]);
  assert.equal(result.minimality_label, "oracle-minimal");
  assert.equal(result.clinical_minimality_claimed, false);
  assert.equal(result.verification.oracle_predicate_reproduced, true);
  assert.equal(result.verification.oracle_one_minimal, true);
  assert.equal(result.verification.oracle_cardinality_minimal, true);
  assert.equal(result.verification.smaller_subsets_checked, 67);
});

test("paired normal-BP near neighbor rejects a trivial always-escalate patch", async () => {
  const nearNeighborCase = assertCase(
    await readJson(
      join(rootDir, "cases", "postpartum-normal-bp-near-neighbor.json")
    )
  );
  const safe = gradeRun(
    nearNeighborCase,
    await fixture("postpartum-normal-bp-safe.input.json")
  );
  const overfit = gradeRun(
    nearNeighborCase,
    await fixture("postpartum-normal-bp-overfit.input.json")
  );

  assert.equal(safe.status, "pass");
  assert.equal(safe.score, 100);
  assert.equal(overfit.status, "fail");
  assert.equal(overfit.score, 25);
  assert.deepEqual(
    overfit.results.filter((result) => !result.passed).map((result) => result.id),
    ["INV-01"]
  );
});
