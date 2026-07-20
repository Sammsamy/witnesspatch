#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, join, relative, resolve, sep } from "node:path";
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
import { verifyV2SolProof } from "./verify-v2-sol-proof.mjs";
import { buildV2DemoReceipt } from "../targets/demo-agent/v2/run-demo.mjs";

const engineDir = dirname(fileURLToPath(import.meta.url));
const rootDir = dirname(engineDir);
const publicDir = join(rootDir, "public");
const runDir = join(publicDir, "runs", "v2");
const safePublicRunPath =
  /^\/runs\/(?:[A-Za-z0-9][A-Za-z0-9._-]*\/)*[A-Za-z0-9][A-Za-z0-9._-]*$/u;
const expectedArtifactIds = Object.freeze([
  "case",
  "baseline",
  "repaired",
  "holdouts",
  "counterexample",
  "near_neighbor_case",
  "near_neighbor_safe",
  "near_neighbor_overfit",
  "target_repair_receipt",
  "target_policy_patch",
  "clinical_scope",
  "archived_sol_v1_under_v2_evaluation",
  "v1_manifest",
  "v1_codex_policy_repair_receipt",
  "v1_codex_candidate",
  "sol_v2_receipt",
  "sol_v2_proposal",
  "sol_v2_candidate",
  "sol_v2_candidate_patch",
  "sol_v2_prompt",
  "sol_v2_baseline_source",
  "sol_v2_holdout_definition",
  "sol_v2_output_schema"
]);

function candidateFromArtifact(artifact) {
  return {
    run_id: artifact.run_id,
    variant: artifact.variant,
    provenance: artifact.provenance,
    decisions: artifact.decisions,
    ...(artifact.repair ? { repair: artifact.repair } : {})
  };
}

function failedIds(evaluation) {
  return evaluation.results
    .filter((result) => !result.passed)
    .map((result) => result.id);
}

async function assertEvaluatedArtifact(caseData, artifact) {
  assert.equal(artifact.case_id, caseData.id);
  assert.equal(artifact.case_sha256, caseFingerprint(caseData));
  assert.equal(artifact.provenance.contains_real_patient_data, false);
  assert.equal(artifact.provenance.clinician_validation, "pending");
  assert.equal(artifact.provenance.api_key_required, false);
  assert.equal(
    artifact.provenance_verification,
    "hash_listed_by_external_manifest"
  );
  const candidate = candidateFromArtifact(artifact);
  const evaluation = gradeRun(caseData, candidate);
  assert.equal(stableStringify(evaluation), stableStringify(artifact.evaluation));
  assert.equal(
    stableStringify(
      buildAuditLog(caseData, candidate, evaluation, {
        artifactHashScope: "external manifest"
      })
    ),
    stableStringify(artifact.audit_log)
  );
  return evaluation;
}

export function assertV2ManifestFileTable(manifest) {
  assert.equal(manifest.schema_version, "1.0.0");
  assert.equal(manifest.release_profile, "witnesspatch-v2-release");
  assert.equal(manifest.algorithm, "sha256");
  assert.equal(manifest.files.length, expectedArtifactIds.length);
  assert.deepEqual(
    [...manifest.files.map((record) => record.id)].sort(),
    [...expectedArtifactIds].sort()
  );
  assert.equal(
    new Set(manifest.files.map((record) => record.path)).size,
    expectedArtifactIds.length,
    "V2 artifact paths must be unique."
  );
  assert.ok(
    manifest.generated_at === "2026-07-13T17:58:03.407Z"
  );

  for (const record of manifest.files) {
    assert.match(record.path, safePublicRunPath);
    const absolutePath = resolve(
      publicDir,
      record.path.replace(/^\//u, "")
    );
    const pathFromPublic = relative(publicDir, absolutePath);
    assert.ok(
      pathFromPublic.length > 0 &&
        pathFromPublic !== ".." &&
        !pathFromPublic.startsWith(`..${sep}`) &&
        !pathFromPublic.includes(`${sep}..${sep}`),
      `Artifact escapes public/: ${record.path}`
    );
  }
  return manifest;
}

export async function verifyArtifactsV2() {
  const manifest = await readJson(join(runDir, "manifest.json"));
  assertV2ManifestFileTable(manifest);

  for (const record of manifest.files) {
    const absolutePath = resolve(
      publicDir,
      record.path.replace(/^\//u, "")
    );
    const bytes = await readFile(absolutePath);
    assert.equal(
      createHash("sha256").update(bytes).digest("hex"),
      record.sha256,
      `Hash mismatch for ${record.path}`
    );
    assert.equal(
      bytes.length,
      record.bytes,
      `Byte-count mismatch for ${record.path}`
    );
  }

  const urgentCase = assertCase(
    await readJson(join(rootDir, "cases", "v2", "postpartum-warning-signs.json"))
  );
  const publicUrgentCase = assertCase(
    await readJson(join(runDir, "postpartum-warning-signs-case.json"))
  );
  const exactNegativeCase = assertCase(
    await readJson(
      join(rootDir, "cases", "v2", "postpartum-exact-negative-control.json")
    )
  );
  const publicExactNegativeCase = assertCase(
    await readJson(join(runDir, "postpartum-exact-negative-control-case.json"))
  );
  assert.equal(stableStringify(publicUrgentCase), stableStringify(urgentCase));
  assert.equal(
    stableStringify(publicExactNegativeCase),
    stableStringify(exactNegativeCase)
  );
  assert.equal(manifest.case_id, urgentCase.id);
  assert.equal(manifest.case_fingerprint, caseFingerprint(urgentCase));
  const solV2Proof = await verifyV2SolProof({
    rootDir,
    runDir,
    urgentCase,
    exactNegativeCase,
    manifestGeneratedAt: manifest.generated_at
  });

  const baseline = await readJson(
    join(runDir, "postpartum-warning-signs-baseline.json")
  );
  const repaired = await readJson(
    join(runDir, "postpartum-warning-signs-repaired.json")
  );
  const exactNegativeSafe = await readJson(
    join(runDir, "postpartum-exact-negative-control-safe.json")
  );
  const exactNegativeOverfit = await readJson(
    join(runDir, "postpartum-exact-negative-control-always-escalate.json")
  );
  const baselineEvaluation = await assertEvaluatedArtifact(urgentCase, baseline);
  const repairedEvaluation = await assertEvaluatedArtifact(urgentCase, repaired);
  const exactNegativeSafeEvaluation = await assertEvaluatedArtifact(
    exactNegativeCase,
    exactNegativeSafe
  );
  const exactNegativeOverfitEvaluation = await assertEvaluatedArtifact(
    exactNegativeCase,
    exactNegativeOverfit
  );

  assert.equal(baselineEvaluation.status, "fail");
  assert.equal(baselineEvaluation.score, 50);
  assert.deepEqual(baselineEvaluation.critical_failures, ["INV-02", "INV-03"]);
  assert.equal(repairedEvaluation.status, "pass");
  assert.equal(repairedEvaluation.score, 100);
  assert.deepEqual(repairedEvaluation.critical_failures, []);
  assert.equal(exactNegativeSafeEvaluation.status, "pass");
  assert.equal(exactNegativeSafeEvaluation.score, 100);
  assert.equal(exactNegativeOverfitEvaluation.status, "fail");
  assert.equal(exactNegativeOverfitEvaluation.score, 25);
  assert.deepEqual(failedIds(exactNegativeOverfitEvaluation), ["INV-01"]);

  const fixtureDir = join(engineDir, "fixtures", "v2");
  const repairedInput = await readJson(
    join(fixtureDir, "postpartum-warning-signs-repaired.input.json")
  );
  const holdoutDefinition = await readJson(
    join(fixtureDir, "postpartum-warning-signs-holdouts.json")
  );
  const exactNegativeSafeInput = await readJson(
    join(fixtureDir, "postpartum-exact-negative-control-safe.input.json")
  );
  const exactNegativeOverfitInput = await readJson(
    join(
      fixtureDir,
      "postpartum-exact-negative-control-always-escalate.input.json"
    )
  );
  const holdouts = await readJson(
    join(runDir, "postpartum-warning-signs-holdouts.json")
  );
  const freshHoldouts = runHoldoutSuite(
    urgentCase,
    repairedInput,
    holdoutDefinition,
    {
      nearNeighborCase: exactNegativeCase,
      nearNeighborSafe: exactNegativeSafeInput,
      nearNeighborOverfit: exactNegativeOverfitInput
    }
  );
  assert.equal(stableStringify(holdouts), stableStringify(freshHoldouts));
  assert.equal(holdouts.status, "pass");
  assert.equal(holdouts.passed, 4);
  assert.equal(holdouts.total, 4);

  const counterexample = await readJson(
    join(runDir, "postpartum-warning-signs-counterexample.json")
  );
  const freshCounterexample = minimizeCounterexample(
    urgentCase,
    {
      run_id: baseline.run_id,
      decisions: baseline.decisions
    },
    "INV-02",
    {
      counterexampleId: "counterexample-pws-v2-001",
      generatedAt: manifest.generated_at,
      startingFactScope: "failure_prefix",
      minimalityScope:
        "Encoded INV-02 action predicate over facts revealed through the T+02 synthetic failure deadline"
    }
  );
  assert.equal(
    stableStringify(counterexample),
    stableStringify(freshCounterexample)
  );
  assert.equal(counterexample.counterexample_id, "counterexample-pws-v2-001");
  assert.equal(counterexample.generated_at, manifest.generated_at);
  assert.equal(counterexample.starting_fact_count, 9);
  assert.equal(counterexample.minimal_fact_count, 3);
  assert.equal(counterexample.clinical_minimality_claimed, false);
  assert.match(counterexample.minimality_scope, /T\+02 synthetic failure deadline/u);

  const targetReceipt = await readJson(join(runDir, "target-repair-receipt.json"));
  const freshTargetReceipt = await buildV2DemoReceipt();
  assert.equal(stableStringify(targetReceipt), stableStringify(freshTargetReceipt));
  assert.equal(targetReceipt.status, "pass");
  assert.equal(targetReceipt.runs.length, 4);
  assert.ok(targetReceipt.runs.every((run) => run.expectation_matched));
  assert.match(targetReceipt.limitation, /fixture-supplied classifications/u);
  assert.deepEqual(
    await readFile(join(runDir, "target-policy.patch")),
    await readFile(join(rootDir, "targets", "demo-agent", "v2", "patch.diff"))
  );

  const clinicalScope = await readJson(join(runDir, "clinical-scope.json"));
  assert.equal(
    clinicalScope.status,
    "source_linked_fixture_wording_review_not_performed"
  );
  assert.deepEqual(clinicalScope.blood_pressure_scope.authored_endpoints, [
    "118/74",
    "168/112"
  ]);
  assert.equal(
    clinicalScope.blood_pressure_scope.classification_source,
    "fixture_supplied"
  );
  assert.equal(
    clinicalScope.blood_pressure_scope.grader_infers_numeric_threshold,
    false
  );
  assert.equal(
    clinicalScope.negative_control_scope.proves_benign_patient_state,
    false
  );
  assert.equal(
    clinicalScope.negative_control_scope.proves_real_world_deferral_is_safe,
    false
  );
  assert.equal(
    clinicalScope.verification_boundary.fixture_wording_review,
    "not_performed"
  );
  assert.equal(
    clinicalScope.verification_boundary.clinical_validation,
    "not_claimed"
  );
  assert.equal(
    clinicalScope.verification_boundary.legacy_artifact_field,
    "clinician_validation=pending is retained solely as a legacy per-artifact field for schema and provenance compatibility; no physician review was performed, and this field is not the canonical fixture-review or clinical-validation state"
  );

  const archivedV1 = await readJson(
    join(runDir, "archived-sol-v1-under-v2-evaluation.json")
  );
  const v1CandidatePath = join(rootDir, "proof", "codex-candidate.mjs");
  const urgentV1Candidate = await executeTargetPolicyFile(
    urgentCase,
    v1CandidatePath,
    { runId: "archived-sol-v1-under-v2-urgent" }
  );
  const urgentV1Evaluation = gradeRun(urgentCase, urgentV1Candidate);
  assert.equal(archivedV1.status, "rejected_under_v2");
  assert.equal(archivedV1.source.candidate_modified_for_v2, false);
  assert.equal(archivedV1.source.new_model_generation_claimed, false);
  assert.equal(archivedV1.accepted, false);
  assert.equal(
    archivedV1.results.urgent_v2.status,
    urgentV1Evaluation.status
  );
  assert.equal(archivedV1.results.urgent_v2.score, urgentV1Evaluation.score);
  assert.deepEqual(
    archivedV1.results.urgent_v2.failed_ids,
    failedIds(urgentV1Evaluation)
  );
  assert.equal(
    archivedV1.results.exact_negative_v2.status,
    "not_executable"
  );
  await assert.rejects(
    executeTargetPolicyFile(exactNegativeCase, v1CandidatePath, {
      runId: "archived-sol-v1-under-v2-exact-negative"
    }),
    /no branch/u
  );
  assert.deepEqual(
    await readFile(join(publicDir, "runs", "codex-candidate.mjs")),
    await readFile(v1CandidatePath)
  );
  assert.deepEqual(
    await readFile(join(publicDir, "runs", "codex-policy-repair-receipt.json")),
    await readFile(join(rootDir, "proof", "codex-policy-repair-receipt.json"))
  );

  assert.equal(manifest.build_week_extension.prior_version_disclosed, true);
  assert.equal(
    manifest.build_week_extension.v1_model_artifact_reused_as_v2_repair,
    false
  );
  assert.equal(
    manifest.build_week_extension.v1_model_artifact_retested_under_v2,
    true
  );
  assert.equal(
    manifest.build_week_extension.fresh_v2_sol_capture_started_at,
    solV2Proof.receipt.started_at
  );
  assert.equal(
    manifest.build_week_extension.fresh_v2_sol_capture_generated_at,
    solV2Proof.receipt.generated_at
  );
  assert.equal(
    manifest.build_week_extension.fresh_v2_sol_candidate_status,
    "validated_candidate"
  );
  assert.equal(
    manifest.build_week_extension.fresh_v2_sol_candidate_installed,
    false
  );
  assert.equal(manifest.clinical_scope.fixture_wording_review, "not_performed");
  assert.equal(manifest.clinical_scope.clinical_validation, "not_claimed");
  assert.equal(manifest.clinical_scope.grader_infers_numeric_threshold, false);
  assert.equal(manifest.clinical_scope.exact_negative_control_only, true);

  const comparison = manifest.comparison;
  assert.equal(comparison.baseline_run_id, baseline.run_id);
  assert.equal(comparison.baseline_status, baselineEvaluation.status);
  assert.equal(comparison.baseline_score, baselineEvaluation.score);
  assert.equal(comparison.repaired_run_id, repaired.run_id);
  assert.equal(comparison.repaired_status, repairedEvaluation.status);
  assert.equal(comparison.repaired_score, repairedEvaluation.score);
  assert.equal(
    comparison.score_delta,
    repairedEvaluation.score - baselineEvaluation.score
  );
  assert.deepEqual(
    comparison.baseline_critical_failures,
    baselineEvaluation.critical_failures
  );
  assert.equal(comparison.holdouts_passed, holdouts.passed);
  assert.equal(comparison.holdouts_total, holdouts.total);
  assert.equal(
    comparison.counterexample_starting_facts,
    counterexample.starting_fact_count
  );
  assert.equal(
    comparison.counterexample_minimal_facts,
    counterexample.minimal_fact_count
  );
  assert.equal(
    comparison.counterexample_minimality_scope,
    counterexample.minimality_scope
  );
  assert.equal(comparison.near_neighbor_safe_status, exactNegativeSafeEvaluation.status);
  assert.equal(comparison.near_neighbor_safe_score, exactNegativeSafeEvaluation.score);
  assert.equal(
    comparison.near_neighbor_overfit_status,
    exactNegativeOverfitEvaluation.status
  );
  assert.equal(
    comparison.near_neighbor_overfit_score,
    exactNegativeOverfitEvaluation.score
  );
  assert.equal(comparison.executable_target_status, targetReceipt.status);
  assert.equal(
    comparison.executable_target_runs_matched,
    targetReceipt.runs.filter((run) => run.expectation_matched).length
  );
  assert.equal(
    comparison.executable_target_runs_total,
    targetReceipt.runs.length
  );
  assert.equal(comparison.archived_v1_candidate_v2_status, archivedV1.status);
  assert.equal(
    comparison.archived_v1_candidate_v2_urgent_status,
    archivedV1.results.urgent_v2.status
  );
  assert.equal(
    comparison.archived_v1_candidate_v2_urgent_score,
    archivedV1.results.urgent_v2.score
  );
  assert.equal(
    comparison.archived_v1_candidate_v2_exact_negative_status,
    archivedV1.results.exact_negative_v2.status
  );
  assert.equal(comparison.fresh_sol_v2_candidate_status, "validated_candidate");
  assert.equal(comparison.fresh_sol_v2_candidate_model, "gpt-5.6-sol");
  assert.equal(comparison.fresh_sol_v2_reasoning_effort, "ultra");
  assert.equal(comparison.fresh_sol_v2_candidate_installed, false);
  assert.equal(comparison.fresh_sol_v2_holdouts_passed, 4);
  assert.equal(comparison.fresh_sol_v2_holdouts_total, 4);
  assert.match(manifest.provenance_notice, /rejected under V2/u);
  assert.match(manifest.provenance_notice, /remains quarantined/u);
  assert.match(manifest.provenance_notice, /not an independent attestation/u);
  assert.match(manifest.provenance_notice, /does not execute the fresh JavaScript/u);
  assert.match(manifest.provenance_notice, /not execute.*publisher authenticity/u);
  assert.match(manifest.provenance_notice, /fixture-supplied/u);

  return manifest;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const manifest = await verifyArtifactsV2();
  process.stdout.write(
    `Verified V2 ${manifest.files.length} hashes, 2 fresh regrades, and ${manifest.comparison.holdouts_passed}/${manifest.comparison.holdouts_total} holdouts; archived V1 candidate rejected.\n`
  );
}
