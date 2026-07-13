#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertCase,
  buildAuditLog,
  caseFingerprint,
  gradeRun,
  readJson,
  stableStringify
} from "./core.mjs";
import { runHoldoutSuite } from "./holdouts.mjs";
import { minimizeCounterexample } from "./minimize-counterexample.mjs";
import { executeTargetPolicyFile } from "./target-adapter.mjs";
import {
  WORKFLOW_OPERATIONAL_EVIDENCE_NOT_MEASURED,
  assertWorkflowOperationalEvidence,
  buildWorkflowOperationalEvidence
} from "./workflow-operational-evidence.mjs";
import { buildDemoReceipt } from "../targets/demo-agent/run-demo.mjs";

const engineDir = dirname(fileURLToPath(import.meta.url));
const rootDir = dirname(engineDir);
const publicDir = join(rootDir, "public");
const runDir = join(publicDir, "runs");

export async function verifyArtifacts() {
  const manifest = await readJson(join(runDir, "manifest.json"));
  assert.equal(manifest.algorithm, "sha256");

  for (const record of manifest.files) {
    const absolutePath = join(publicDir, record.path.replace(/^\//, ""));
    const bytes = await readFile(absolutePath);
    const actualHash = createHash("sha256").update(bytes).digest("hex");
    assert.equal(actualHash, record.sha256, `Hash mismatch for ${record.path}`);
    assert.equal(bytes.length, record.bytes, `Byte-count mismatch for ${record.path}`);
  }

  const sourceCase = assertCase(
    await readJson(join(rootDir, "cases", "postpartum-warning-signs.json"))
  );
  const publicCase = assertCase(
    await readJson(join(runDir, "postpartum-warning-signs-case.json"))
  );
  assert.equal(stableStringify(publicCase), stableStringify(sourceCase));
  assert.equal(manifest.case_fingerprint, caseFingerprint(sourceCase));

  const artifacts = [
    await readJson(join(runDir, "postpartum-warning-signs-baseline.json")),
    await readJson(join(runDir, "postpartum-warning-signs-repaired.json"))
  ];

  for (const artifact of artifacts) {
    assert.equal(artifact.case_id, sourceCase.id);
    assert.equal(artifact.case_sha256, caseFingerprint(sourceCase));
    assert.equal(artifact.provenance.contains_real_patient_data, false);
    assert.equal(artifact.provenance.clinician_validation, "pending");
    assert.equal(artifact.provenance.api_key_required, false);
    assert.equal(
      artifact.provenance_verification,
      "hash_listed_by_external_manifest"
    );

    const candidate = {
      run_id: artifact.run_id,
      variant: artifact.variant,
      provenance: artifact.provenance,
      decisions: artifact.decisions,
      ...(artifact.repair ? { repair: artifact.repair } : {})
    };
    const freshEvaluation = gradeRun(sourceCase, candidate);
    assert.equal(
      stableStringify(freshEvaluation),
      stableStringify(artifact.evaluation),
      `Stored evaluation drifted for ${artifact.run_id}`
    );
    assert.equal(
      stableStringify(
        buildAuditLog(sourceCase, candidate, freshEvaluation, {
          artifactHashScope: "external manifest"
        })
      ),
      stableStringify(artifact.audit_log),
      `Stored audit log drifted for ${artifact.run_id}`
    );
    assert.equal(
      artifact.audit_log.at(-1).artifact_hash_scope,
      "external manifest"
    );
  }

  const [baseline, repaired] = artifacts;
  const holdoutArtifact = await readJson(
    join(runDir, "postpartum-warning-signs-holdouts.json")
  );
  const holdoutDefinition = await readJson(
    join(engineDir, "fixtures", "postpartum-warning-signs-holdouts.json")
  );
  const repairedInput = await readJson(
    join(engineDir, "fixtures", "postpartum-warning-signs-repaired.input.json")
  );
  const nearNeighborCase = assertCase(
    await readJson(join(rootDir, "cases", "postpartum-normal-bp-near-neighbor.json"))
  );
  const publicNearNeighborCase = assertCase(
    await readJson(join(runDir, "postpartum-normal-bp-near-neighbor-case.json"))
  );
  assert.equal(
    stableStringify(publicNearNeighborCase),
    stableStringify(nearNeighborCase)
  );
  const nearNeighborSafeInput = await readJson(
    join(engineDir, "fixtures", "postpartum-normal-bp-safe.input.json")
  );
  const nearNeighborOverfitInput = await readJson(
    join(engineDir, "fixtures", "postpartum-normal-bp-overfit.input.json")
  );
  const freshHoldouts = runHoldoutSuite(
    sourceCase,
    repairedInput,
    holdoutDefinition,
    {
      nearNeighborCase,
      nearNeighborSafe: nearNeighborSafeInput,
      nearNeighborOverfit: nearNeighborOverfitInput
    }
  );
  assert.equal(stableStringify(holdoutArtifact), stableStringify(freshHoldouts));
  const counterexampleArtifact = await readJson(
    join(runDir, "postpartum-warning-signs-counterexample.json")
  );
  const freshCounterexample = minimizeCounterexample(sourceCase, {
    run_id: baseline.run_id,
    decisions: baseline.decisions
  });
  assert.equal(
    stableStringify(counterexampleArtifact),
    stableStringify(freshCounterexample)
  );
  assert.equal(baseline.evaluation.status, "fail");
  assert.equal(baseline.evaluation.score, 50);
  assert.equal(baseline.evaluation.metrics.time_to_safe_action_minutes, 4);
  assert.deepEqual(baseline.evaluation.critical_failures, ["INV-02", "INV-03"]);
  assert.equal(repaired.evaluation.status, "pass");
  assert.equal(repaired.evaluation.score, 100);
  assert.equal(repaired.evaluation.engine, "witnesspatch-deterministic-v2");
  assert.equal(repaired.evaluation.metrics.time_to_safe_action_minutes, 0);
  assert.deepEqual(repaired.evaluation.critical_failures, []);
  assert.equal(manifest.comparison.score_delta, 50);
  assert.equal(manifest.comparison.safe_action_latency_delta_minutes, -4);
  assert.equal(holdoutArtifact.status, "pass");
  assert.equal(holdoutArtifact.passed, 13);
  assert.equal(holdoutArtifact.total, 13);
  assert.equal(manifest.comparison.holdouts_passed, 13);
  assert.equal(manifest.comparison.holdouts_total, 13);
  const contradictoryMessageCheck = holdoutArtifact.checks.find(
    (check) => check.id === "HOLD-13"
  );
  assert.equal(contradictoryMessageCheck.expectation_matched, true);
  assert.equal(contradictoryMessageCheck.actual.status, "fail");
  assert.equal(contradictoryMessageCheck.actual.score, 90);
  assert.deepEqual(contradictoryMessageCheck.actual.failed_ids, ["CTRL-03"]);
  const nearNeighborSafeArtifact = await readJson(
    join(runDir, "postpartum-normal-bp-near-neighbor-safe.json")
  );
  const nearNeighborOverfitArtifact = await readJson(
    join(runDir, "postpartum-normal-bp-near-neighbor-overfit.json")
  );
  for (const artifact of [nearNeighborSafeArtifact, nearNeighborOverfitArtifact]) {
    assert.equal(artifact.case_id, nearNeighborCase.id);
    assert.equal(artifact.case_sha256, caseFingerprint(nearNeighborCase));
    assert.equal(artifact.provenance.contains_real_patient_data, false);
    assert.equal(artifact.provenance.clinician_validation, "pending");
    assert.equal(artifact.provenance.api_key_required, false);
    const freshEvaluation = gradeRun(nearNeighborCase, {
      run_id: artifact.run_id,
      variant: artifact.variant,
      provenance: artifact.provenance,
      decisions: artifact.decisions
    });
    assert.equal(
      stableStringify(freshEvaluation),
      stableStringify(artifact.evaluation)
    );
  }
  assert.equal(nearNeighborSafeArtifact.evaluation.status, "pass");
  assert.equal(nearNeighborSafeArtifact.evaluation.score, 100);
  assert.equal(nearNeighborOverfitArtifact.evaluation.status, "fail");
  assert.equal(nearNeighborOverfitArtifact.evaluation.score, 25);
  assert.deepEqual(nearNeighborOverfitArtifact.evaluation.results
    .filter((result) => !result.passed)
    .map((result) => result.id), ["INV-01"]);
  assert.equal(counterexampleArtifact.starting_fact_count, 11);
  assert.equal(counterexampleArtifact.minimal_fact_count, 3);
  assert.deepEqual(counterexampleArtifact.minimal_fact_ids.sort(), [
    "headache_unrelieved_by_medication_and_fluids",
    "persistent_headache",
    "postpartum_day_8"
  ]);
  assert.equal(counterexampleArtifact.minimality_label, "oracle-minimal");
  assert.equal(counterexampleArtifact.clinical_minimality_claimed, false);
  assert.equal(counterexampleArtifact.verification.oracle_one_minimal, true);
  assert.equal(counterexampleArtifact.verification.oracle_cardinality_minimal, true);
  assert.equal(manifest.comparison.counterexample_starting_facts, 11);
  assert.equal(manifest.comparison.counterexample_minimal_facts, 3);
  assert.deepEqual(manifest.comparison.baseline_critical_failures, ["INV-02", "INV-03"]);
  assert.equal(manifest.comparison.near_neighbor_safe_status, "pass");
  assert.equal(manifest.comparison.near_neighbor_safe_score, 100);
  assert.equal(manifest.comparison.near_neighbor_overfit_status, "fail");
  assert.equal(manifest.comparison.near_neighbor_overfit_score, 25);
  assert.match(manifest.provenance_notice, /do not prove semantic consistency/);
  const targetRepairReceipt = await readJson(
    join(runDir, "target-repair-receipt.json")
  );
  const freshTargetRepairReceipt = await buildDemoReceipt();
  assert.equal(
    stableStringify(targetRepairReceipt),
    stableStringify(freshTargetRepairReceipt)
  );
  assert.equal(targetRepairReceipt.status, "pass");
  assert.equal(targetRepairReceipt.runs.length, 4);
  assert.ok(targetRepairReceipt.runs.every((run) => run.expectation_matched));
  const executableOverfit = targetRepairReceipt.runs.find(
    (run) => run.label === "overfit mutant / benign twin"
  );
  assert.equal(executableOverfit.score, 25);
  assert.deepEqual(executableOverfit.critical_failures, []);
  assert.deepEqual(
    await readFile(join(runDir, "target-policy.patch")),
    await readFile(join(rootDir, "targets", "demo-agent", "patch.diff"))
  );
  assert.equal(manifest.comparison.executable_target_status, "pass");
  assert.equal(manifest.comparison.executable_target_runs_matched, 4);
  assert.equal(manifest.comparison.executable_target_runs_total, 4);

  const codexRepairReceipt = await readJson(
    join(runDir, "codex-policy-repair-receipt.json")
  );
  assert.deepEqual(
    await readFile(join(runDir, "codex-policy-repair-receipt.json")),
    await readFile(join(rootDir, "proof", "codex-policy-repair-receipt.json"))
  );
  assert.equal(codexRepairReceipt.status, "validated_candidate");
  assert.equal(
    codexRepairReceipt.generation.mode,
    "local_codex_cli_chatgpt_subscription"
  );
  assert.equal(
    codexRepairReceipt.generation.auth_status,
    "Logged in using ChatGPT"
  );
  assert.equal(codexRepairReceipt.generation.api_key_required, false);
  assert.equal(codexRepairReceipt.generation.requested_model, "gpt-5.6-sol");
  assert.equal(codexRepairReceipt.generation.requested_reasoning_effort, "ultra");
  assert.equal(codexRepairReceipt.generation.ephemeral, true);
  assert.equal(codexRepairReceipt.generation.sandbox, "read-only");
  assert.equal(codexRepairReceipt.generation.isolated_working_directory, true);
  assert.equal(
    codexRepairReceipt.input_scope.checked_in_repaired_policy_supplied,
    false
  );
  assert.equal(codexRepairReceipt.candidate.automatically_installed, false);
  const codexProofFiles = [
    ["codex-proposal.json", "stored_proposal_sha256"],
    ["codex-candidate.mjs", "candidate_source_sha256"],
    ["codex-candidate.patch", "patch_sha256"]
  ];
  for (const [fileName, hashField] of codexProofFiles) {
    const publicBytes = await readFile(join(runDir, fileName));
    const proofBytes = await readFile(join(rootDir, "proof", fileName));
    assert.deepEqual(publicBytes, proofBytes);
    assert.equal(
      createHash("sha256").update(publicBytes).digest("hex"),
      codexRepairReceipt.candidate[hashField]
    );
  }
  const reproducedCodexUrgentCandidate = await executeTargetPolicyFile(
    sourceCase,
    join(runDir, "codex-candidate.mjs"),
    { runId: "captured-codex-repair-urgent" }
  );
  const reproducedCodexBenignCandidate = await executeTargetPolicyFile(
    nearNeighborCase,
    join(runDir, "codex-candidate.mjs"),
    { runId: "captured-codex-repair-benign" }
  );
  const reproducedCodexUrgent = gradeRun(
    sourceCase,
    reproducedCodexUrgentCandidate
  );
  const reproducedCodexBenign = gradeRun(
    nearNeighborCase,
    reproducedCodexBenignCandidate
  );
  for (const result of [reproducedCodexUrgent, reproducedCodexBenign]) {
    assert.equal(result.status, "pass");
    assert.equal(result.score, 100);
    assert.deepEqual(result.critical_failures, []);
    assert.equal(result.metrics.future_fact_violations, 0);
  }
  const codexCandidateHoldoutArtifact = await readJson(
    join(runDir, "codex-candidate-holdouts.json")
  );
  const freshCodexCandidateHoldouts = runHoldoutSuite(
    sourceCase,
    reproducedCodexUrgentCandidate,
    holdoutDefinition,
    {
      nearNeighborCase,
      nearNeighborSafe: reproducedCodexBenignCandidate,
      nearNeighborOverfit: nearNeighborOverfitInput
    }
  );
  assert.equal(
    stableStringify(codexCandidateHoldoutArtifact),
    stableStringify(freshCodexCandidateHoldouts)
  );
  assert.equal(codexCandidateHoldoutArtifact.status, "pass");
  assert.equal(codexCandidateHoldoutArtifact.passed, 13);
  assert.equal(codexCandidateHoldoutArtifact.total, 13);
  assert.ok(
    codexCandidateHoldoutArtifact.checks.every(
      (check) => check.expectation_matched
    )
  );
  for (const label of ["candidate_urgent", "candidate_benign"]) {
    const result = codexRepairReceipt.deterministic_validation[label];
    assert.equal(result.status, "pass");
    assert.equal(result.score, 100);
    assert.deepEqual(result.critical_failures, []);
    assert.equal(result.future_fact_violations, 0);
  }
  assert.equal(codexRepairReceipt.safety.contains_real_patient_data, false);
  assert.equal(codexRepairReceipt.safety.clinician_validation, "pending");
  assert.equal(codexRepairReceipt.safety.model_is_final_grader, false);
  assert.equal(manifest.comparison.captured_codex_repair_status, "validated_candidate");
  assert.equal(manifest.comparison.captured_codex_repair_model, "gpt-5.6-sol");
  assert.equal(manifest.comparison.captured_codex_repair_effort, "ultra");
  assert.equal(manifest.comparison.captured_codex_repair_api_key_required, false);
  assert.equal(manifest.comparison.captured_codex_repair_candidate_installed, false);
  assert.equal(manifest.comparison.captured_codex_repair_urgent_score, 100);
  assert.equal(manifest.comparison.captured_codex_repair_benign_score, 100);
  assert.equal(manifest.comparison.captured_codex_repair_urgent_status, "pass");
  assert.equal(manifest.comparison.captured_codex_repair_benign_status, "pass");
  assert.equal(manifest.comparison.captured_codex_repair_holdouts_passed, 13);
  assert.equal(manifest.comparison.captured_codex_repair_holdouts_total, 13);

  const workflowOperationalEvidence = assertWorkflowOperationalEvidence(
    await readJson(join(runDir, "workflow-operational-evidence.json"))
  );
  const freshWorkflowOperationalEvidence = buildWorkflowOperationalEvidence({
    repairReceipt: codexRepairReceipt,
    holdoutsPassed: codexCandidateHoldoutArtifact.passed,
    holdoutsTotal: codexCandidateHoldoutArtifact.total
  });
  assert.equal(
    stableStringify(workflowOperationalEvidence),
    stableStringify(freshWorkflowOperationalEvidence)
  );
  assert.equal(
    workflowOperationalEvidence.observation.observed_wall_clock_ms,
    113_770
  );
  assert.equal(workflowOperationalEvidence.observation.sample_size, 1);
  assert.equal(
    workflowOperationalEvidence.observation.authentication
      .included_in_observed_interval,
    false
  );
  assert.equal(workflowOperationalEvidence.observation.cache_state, "unknown");
  assert.equal(workflowOperationalEvidence.observation.clock.monotonic, false);
  assert.equal(
    workflowOperationalEvidence.holdouts.included_in_observed_interval,
    false
  );
  assert.deepEqual(
    workflowOperationalEvidence.not_measured,
    WORKFLOW_OPERATIONAL_EVIDENCE_NOT_MEASURED
  );
  assert.match(workflowOperationalEvidence.claim_boundary, /not a benchmark/);
  assert.match(
    workflowOperationalEvidence.claim_boundary,
    /clinical-safety evidence/
  );
  assert.equal(
    manifest.comparison.observed_authored_fixture_to_validated_candidate_ms,
    113_770
  );
  assert.equal(manifest.comparison.observed_workflow_sample_size, 1);
  assert.match(manifest.provenance_notice, /not a benchmark/);
  assert.match(manifest.provenance_notice, /incident-to-regression/);

  return {
    files_verified: manifest.files.length,
    baseline_score: baseline.evaluation.score,
    repaired_score: repaired.evaluation.score
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await verifyArtifacts();
  process.stdout.write(
    `Verified ${result.files_verified} hashes and deterministic re-grade: ${result.baseline_score} -> ${result.repaired_score}.\n`
  );
}
