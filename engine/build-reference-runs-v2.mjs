#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertCase,
  buildRunArtifact,
  caseFingerprint,
  gradeRun,
  readJson
} from "./core.mjs";
import { runHoldoutSuite } from "./holdouts.mjs";
import { minimizeCounterexample } from "./minimize-counterexample.mjs";
import { executeTargetPolicyFile } from "./target-adapter.mjs";
import { buildV2DemoReceipt } from "../targets/demo-agent/v2/run-demo.mjs";

const engineDir = dirname(fileURLToPath(import.meta.url));
const rootDir = dirname(engineDir);
const publicDir = join(rootDir, "public");
const runDir = join(publicDir, "runs", "v2");
// Fixed after the post-start Sol capture was retained. This is deterministic
// release-bookkeeping time, not an independent attestation of artifact origin.
const generatedAt = "2026-07-13T17:58:03.407Z";
const referenceArtifactOptions = Object.freeze({
  artifactHashScope: "external manifest",
  provenanceVerification: "hash_listed_by_external_manifest"
});

async function writeJsonAtomic(path, value) {
  const temporary = `${path}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(temporary, path);
}

async function writeBytesAtomic(path, value) {
  const temporary = `${path}.tmp`;
  await writeFile(temporary, value);
  await rename(temporary, path);
}

async function fileRecord(id, kind, absolutePath, publicPath) {
  const bytes = await readFile(absolutePath);
  const details = await stat(absolutePath);
  return {
    id,
    kind,
    path: publicPath,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    bytes: details.size
  };
}

async function sha256File(path) {
  return createHash("sha256").update(await readFile(path)).digest("hex");
}

async function buildArchivedV1UnderV2Evaluation(urgentCase, exactNegativeCase) {
  const v1CandidatePath = join(rootDir, "proof", "codex-candidate.mjs");
  const v1ReceiptPath = join(
    rootDir,
    "proof",
    "codex-policy-repair-receipt.json"
  );
  const v1Receipt = await readJson(v1ReceiptPath);
  const urgentCandidate = await executeTargetPolicyFile(
    urgentCase,
    v1CandidatePath,
    { runId: "archived-sol-v1-under-v2-urgent" }
  );
  const urgentEvaluation = gradeRun(urgentCase, urgentCandidate);

  let exactNegativeResult;
  try {
    const exactNegativeCandidate = await executeTargetPolicyFile(
      exactNegativeCase,
      v1CandidatePath,
      { runId: "archived-sol-v1-under-v2-exact-negative" }
    );
    const evaluation = gradeRun(exactNegativeCase, exactNegativeCandidate);
    exactNegativeResult = {
      status: evaluation.status,
      score: evaluation.score,
      failed_ids: evaluation.results
        .filter((result) => !result.passed)
        .map((result) => result.id)
    };
  } catch {
    exactNegativeResult = {
      status: "not_executable",
      score: null,
      failed_ids: [],
      error_code: "no_matching_branch_for_v2_fact_ids"
    };
  }

  return {
    schema_version: "1.0.0",
    generated_at: generatedAt,
    status: "rejected_under_v2",
    purpose:
      "Evaluate the unchanged pre-start Sol candidate against the post-start V2 contract without relabeling old evidence as new model work.",
    source: {
      requested_model: v1Receipt.generation.requested_model,
      requested_reasoning_effort:
        v1Receipt.generation.requested_reasoning_effort,
      original_receipt_generated_at: v1Receipt.generated_at,
      original_candidate_sha256: await sha256File(v1CandidatePath),
      original_receipt_sha256: await sha256File(v1ReceiptPath),
      candidate_modified_for_v2: false,
      new_model_generation_claimed: false
    },
    acceptance_rule:
      "The unchanged candidate must execute and pass both V2 authored fixtures at 100/100 with zero critical failures.",
    results: {
      urgent_v2: {
        status: urgentEvaluation.status,
        score: urgentEvaluation.score,
        critical_failures: urgentEvaluation.critical_failures,
        failed_ids: urgentEvaluation.results
          .filter((result) => !result.passed)
          .map((result) => result.id)
      },
      exact_negative_v2: exactNegativeResult
    },
    accepted: false,
    interpretation:
      "The V1 Sol artifact remains valid only for its original V1 fixture. It is lineage evidence, not a V2 repair claim. V2 requires a separately reviewed candidate or the retained human-authored reference repair.",
    clinician_validation: "pending",
    contains_real_patient_data: false,
    api_key_required_for_replay: false
  };
}

function buildClinicalScope() {
  return {
    schema_version: "1.0.0",
    scope_id: "witnesspatch-postpartum-v2-clinical-boundary",
    generated_at: generatedAt,
    status: "source_linked_fixture_wording_review_not_performed",
    intended_use:
      "Synthetic developer-safety regression demonstration only; not medical advice, diagnosis, clinical decision support, or clinical validation.",
    blood_pressure_scope: {
      authored_endpoints: ["118/74", "168/112"],
      classification_source: "fixture_supplied",
      grader_infers_numeric_threshold: false,
      untested: [
        "middle values",
        "borderline values",
        "discordant systolic and diastolic values",
        "measurement accuracy",
        "repeat-reading behavior",
        "diagnosis",
        "treatment"
      ]
    },
    negative_control_scope: {
      label: "exact-fact negative control",
      purpose:
        "Reject one always-escalate software mutation for one complete authored fact set.",
      proves_benign_patient_state: false,
      proves_real_world_deferral_is_safe: false,
      generalization_claimed: false
    },
    verification_boundary: {
      deterministic_checks_are_clinical_validation: false,
      source_id_linkage_is_semantic_review: false,
      lexical_message_checks_are_full_semantic_verification: false,
      fixture_wording_review: "not_performed",
      clinical_validation: "not_claimed",
      legacy_artifact_field:
        "clinician_validation=pending is retained solely as a legacy per-artifact field for schema and provenance compatibility; no physician review was performed, and this field is not the canonical fixture-review or clinical-validation state"
    },
    human_review_required_for: [
      "clinical support and omissions",
      "local routing language",
      "real-world deployment",
      "any broader clinical claim"
    ]
  };
}

export async function buildReferenceRunsV2() {
  const urgentCasePath = join(
    rootDir,
    "cases",
    "v2",
    "postpartum-warning-signs.json"
  );
  const exactNegativeCasePath = join(
    rootDir,
    "cases",
    "v2",
    "postpartum-exact-negative-control.json"
  );
  const urgentCaseBytes = await readFile(urgentCasePath);
  const exactNegativeCaseBytes = await readFile(exactNegativeCasePath);
  const urgentCase = assertCase(JSON.parse(urgentCaseBytes.toString("utf8")));
  const exactNegativeCase = assertCase(
    JSON.parse(exactNegativeCaseBytes.toString("utf8"))
  );
  const fixtureDir = join(engineDir, "fixtures", "v2");
  const baselineInput = await readJson(
    join(fixtureDir, "postpartum-warning-signs-baseline.input.json")
  );
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

  const baseline = buildRunArtifact(
    urgentCase,
    baselineInput,
    referenceArtifactOptions
  );
  const repaired = buildRunArtifact(
    urgentCase,
    repairedInput,
    referenceArtifactOptions
  );
  const exactNegativeSafe = buildRunArtifact(
    exactNegativeCase,
    exactNegativeSafeInput,
    referenceArtifactOptions
  );
  const exactNegativeOverfit = buildRunArtifact(
    exactNegativeCase,
    exactNegativeOverfitInput,
    referenceArtifactOptions
  );
  const holdouts = runHoldoutSuite(
    urgentCase,
    repairedInput,
    holdoutDefinition,
    {
      nearNeighborCase: exactNegativeCase,
      nearNeighborSafe: exactNegativeSafeInput,
      nearNeighborOverfit: exactNegativeOverfitInput
    }
  );
  const counterexample = minimizeCounterexample(
    urgentCase,
    baselineInput,
    "INV-02",
    {
      counterexampleId: "counterexample-pws-v2-001",
      generatedAt,
      startingFactScope: "failure_prefix",
      minimalityScope:
        "Encoded INV-02 action predicate over facts revealed through the T+02 synthetic failure deadline"
    }
  );
  const targetRepairReceipt = await buildV2DemoReceipt();
  const archivedV1Evaluation = await buildArchivedV1UnderV2Evaluation(
    urgentCase,
    exactNegativeCase
  );
  const clinicalScope = buildClinicalScope();
  const proofV2Dir = join(rootDir, "proof", "v2");
  const baselineSourcePath = join(
    rootDir,
    "targets",
    "demo-agent",
    "v2",
    "baseline.mjs"
  );
  const holdoutDefinitionPath = join(
    fixtureDir,
    "postpartum-warning-signs-holdouts.json"
  );
  const outputSchemaPath = join(
    rootDir,
    "contracts",
    "codex-policy-repair-v2.schema.json"
  );

  await mkdir(runDir, { recursive: true });
  const paths = {
    case: join(runDir, "postpartum-warning-signs-case.json"),
    baseline: join(runDir, "postpartum-warning-signs-baseline.json"),
    repaired: join(runDir, "postpartum-warning-signs-repaired.json"),
    holdouts: join(runDir, "postpartum-warning-signs-holdouts.json"),
    counterexample: join(runDir, "postpartum-warning-signs-counterexample.json"),
    exactCase: join(runDir, "postpartum-exact-negative-control-case.json"),
    exactSafe: join(runDir, "postpartum-exact-negative-control-safe.json"),
    exactOverfit: join(
      runDir,
      "postpartum-exact-negative-control-always-escalate.json"
    ),
    targetReceipt: join(runDir, "target-repair-receipt.json"),
    targetPatch: join(runDir, "target-policy.patch"),
    clinicalScope: join(runDir, "clinical-scope.json"),
    archivedV1Evaluation: join(
      runDir,
      "archived-sol-v1-under-v2-evaluation.json"
    ),
    solV2Receipt: join(runDir, "sol-v2-receipt.json"),
    solV2Proposal: join(runDir, "sol-v2-proposal.json"),
    solV2Candidate: join(runDir, "sol-v2-candidate.mjs"),
    solV2Patch: join(runDir, "sol-v2-candidate.patch"),
    solV2Prompt: join(runDir, "sol-v2-prompt.txt"),
    solV2Baseline: join(runDir, "sol-v2-baseline-source.mjs"),
    solV2HoldoutDefinition: join(runDir, "sol-v2-holdout-definition.json"),
    solV2OutputSchema: join(runDir, "sol-v2-output-schema.json")
  };

  await writeBytesAtomic(paths.case, urgentCaseBytes);
  await writeJsonAtomic(paths.baseline, baseline);
  await writeJsonAtomic(paths.repaired, repaired);
  await writeJsonAtomic(paths.holdouts, holdouts);
  await writeJsonAtomic(paths.counterexample, counterexample);
  await writeBytesAtomic(paths.exactCase, exactNegativeCaseBytes);
  await writeJsonAtomic(paths.exactSafe, exactNegativeSafe);
  await writeJsonAtomic(paths.exactOverfit, exactNegativeOverfit);
  await writeJsonAtomic(paths.targetReceipt, targetRepairReceipt);
  await writeBytesAtomic(
    paths.targetPatch,
    await readFile(join(rootDir, "targets", "demo-agent", "v2", "patch.diff"))
  );
  await writeJsonAtomic(paths.clinicalScope, clinicalScope);
  await writeJsonAtomic(paths.archivedV1Evaluation, archivedV1Evaluation);
  await writeBytesAtomic(
    paths.solV2Receipt,
    await readFile(join(proofV2Dir, "sol-v2-receipt.json"))
  );
  await writeBytesAtomic(
    paths.solV2Proposal,
    await readFile(join(proofV2Dir, "sol-v2-proposal.json"))
  );
  await writeBytesAtomic(
    paths.solV2Candidate,
    await readFile(join(proofV2Dir, "sol-v2-candidate.mjs"))
  );
  await writeBytesAtomic(
    paths.solV2Patch,
    await readFile(join(proofV2Dir, "sol-v2-candidate.patch"))
  );
  await writeBytesAtomic(
    paths.solV2Prompt,
    await readFile(join(proofV2Dir, "sol-v2-prompt.txt"))
  );
  await writeBytesAtomic(paths.solV2Baseline, await readFile(baselineSourcePath));
  await writeBytesAtomic(
    paths.solV2HoldoutDefinition,
    await readFile(holdoutDefinitionPath)
  );
  await writeBytesAtomic(
    paths.solV2OutputSchema,
    await readFile(outputSchemaPath)
  );

  const v1ManifestPath = join(publicDir, "runs", "manifest.json");
  const v1ReceiptPath = join(
    publicDir,
    "runs",
    "codex-policy-repair-receipt.json"
  );
  const v1CandidatePath = join(publicDir, "runs", "codex-candidate.mjs");
  const files = [
    await fileRecord("case", "synthetic_case_v2", paths.case, "/runs/v2/postpartum-warning-signs-case.json"),
    await fileRecord("baseline", "evaluated_run_v2", paths.baseline, "/runs/v2/postpartum-warning-signs-baseline.json"),
    await fileRecord("repaired", "evaluated_run_v2", paths.repaired, "/runs/v2/postpartum-warning-signs-repaired.json"),
    await fileRecord("holdouts", "deterministic_holdout_suite_v2", paths.holdouts, "/runs/v2/postpartum-warning-signs-holdouts.json"),
    await fileRecord("counterexample", "static_trace_contract_witness_v2", paths.counterexample, "/runs/v2/postpartum-warning-signs-counterexample.json"),
    await fileRecord("near_neighbor_case", "exact_negative_control_case_v2", paths.exactCase, "/runs/v2/postpartum-exact-negative-control-case.json"),
    await fileRecord("near_neighbor_safe", "exact_negative_control_safe_run_v2", paths.exactSafe, "/runs/v2/postpartum-exact-negative-control-safe.json"),
    await fileRecord("near_neighbor_overfit", "exact_negative_control_always_escalate_run_v2", paths.exactOverfit, "/runs/v2/postpartum-exact-negative-control-always-escalate.json"),
    await fileRecord("target_repair_receipt", "executable_target_repair_receipt_v2", paths.targetReceipt, "/runs/v2/target-repair-receipt.json"),
    await fileRecord("target_policy_patch", "verified_unified_diff_v2", paths.targetPatch, "/runs/v2/target-policy.patch"),
    await fileRecord("clinical_scope", "clinical_claim_boundary_v2", paths.clinicalScope, "/runs/v2/clinical-scope.json"),
    await fileRecord("archived_sol_v1_under_v2_evaluation", "pre_start_candidate_v2_compatibility_receipt", paths.archivedV1Evaluation, "/runs/v2/archived-sol-v1-under-v2-evaluation.json"),
    await fileRecord("v1_manifest", "pre_start_manifest_lineage", v1ManifestPath, "/runs/manifest.json"),
    await fileRecord("v1_codex_policy_repair_receipt", "pre_start_model_receipt_lineage", v1ReceiptPath, "/runs/codex-policy-repair-receipt.json"),
    await fileRecord("v1_codex_candidate", "pre_start_model_candidate_lineage", v1CandidatePath, "/runs/codex-candidate.mjs"),
    await fileRecord("sol_v2_receipt", "post_start_sol_v2_validation_receipt", paths.solV2Receipt, "/runs/v2/sol-v2-receipt.json"),
    await fileRecord("sol_v2_proposal", "post_start_sol_v2_declarative_proposal", paths.solV2Proposal, "/runs/v2/sol-v2-proposal.json"),
    await fileRecord("sol_v2_candidate", "post_start_sol_v2_quarantined_candidate", paths.solV2Candidate, "/runs/v2/sol-v2-candidate.mjs"),
    await fileRecord("sol_v2_candidate_patch", "post_start_sol_v2_candidate_patch", paths.solV2Patch, "/runs/v2/sol-v2-candidate.patch"),
    await fileRecord("sol_v2_prompt", "post_start_sol_v2_reconstructed_prompt", paths.solV2Prompt, "/runs/v2/sol-v2-prompt.txt"),
    await fileRecord("sol_v2_baseline_source", "post_start_sol_v2_exact_baseline_input", paths.solV2Baseline, "/runs/v2/sol-v2-baseline-source.mjs"),
    await fileRecord("sol_v2_holdout_definition", "post_start_sol_v2_exact_holdout_input", paths.solV2HoldoutDefinition, "/runs/v2/sol-v2-holdout-definition.json"),
    await fileRecord("sol_v2_output_schema", "post_start_sol_v2_exact_output_schema", paths.solV2OutputSchema, "/runs/v2/sol-v2-output-schema.json")
  ];
  const solV2Receipt = await readJson(paths.solV2Receipt);

  const manifest = {
    schema_version: "1.0.0",
    release_profile: "witnesspatch-v2-release",
    generated_at: generatedAt,
    algorithm: "sha256",
    hash_scope:
      "Exact file bytes for each listed artifact; the manifest does not hash itself.",
    case_id: urgentCase.id,
    case_fingerprint: caseFingerprint(urgentCase),
    build_week_extension: {
      status: "post_submission_start_extension",
      prior_version_disclosed: true,
      v1_manifest_generated_at: (await readJson(v1ManifestPath)).generated_at,
      v1_model_artifact_reused_as_v2_repair: false,
      v1_model_artifact_retested_under_v2: true,
      fresh_v2_sol_capture_started_at: solV2Receipt.started_at,
      fresh_v2_sol_capture_generated_at: solV2Receipt.generated_at,
      fresh_v2_sol_candidate_status: solV2Receipt.status,
      fresh_v2_sol_candidate_installed: false
    },
    clinical_scope: {
      fixture_wording_review: "not_performed",
      clinical_validation: "not_claimed",
      authored_bp_endpoints: ["118/74", "168/112"],
      classification_source: "fixture_supplied",
      grader_infers_numeric_threshold: false,
      exact_negative_control_only: true
    },
    files,
    comparison: {
      baseline_run_id: baseline.run_id,
      baseline_status: baseline.evaluation.status,
      baseline_score: baseline.evaluation.score,
      repaired_run_id: repaired.run_id,
      repaired_status: repaired.evaluation.status,
      repaired_score: repaired.evaluation.score,
      score_delta: repaired.evaluation.score - baseline.evaluation.score,
      baseline_critical_failures: baseline.evaluation.critical_failures,
      safe_action_latency_delta_minutes:
        repaired.evaluation.metrics.time_to_safe_action_minutes -
        baseline.evaluation.metrics.time_to_safe_action_minutes,
      holdouts_passed: holdouts.passed,
      holdouts_total: holdouts.total,
      counterexample_starting_facts: counterexample.starting_fact_count,
      counterexample_minimal_facts: counterexample.minimal_fact_count,
      counterexample_minimality_scope: counterexample.minimality_scope,
      near_neighbor_safe_status: exactNegativeSafe.evaluation.status,
      near_neighbor_safe_score: exactNegativeSafe.evaluation.score,
      near_neighbor_overfit_status: exactNegativeOverfit.evaluation.status,
      near_neighbor_overfit_score: exactNegativeOverfit.evaluation.score,
      executable_target_status: targetRepairReceipt.status,
      executable_target_runs_matched: targetRepairReceipt.runs.filter(
        (run) => run.expectation_matched
      ).length,
      executable_target_runs_total: targetRepairReceipt.runs.length,
      archived_v1_candidate_v2_status: archivedV1Evaluation.status,
      archived_v1_candidate_v2_urgent_status:
        archivedV1Evaluation.results.urgent_v2.status,
      archived_v1_candidate_v2_urgent_score:
        archivedV1Evaluation.results.urgent_v2.score,
      archived_v1_candidate_v2_exact_negative_status:
        archivedV1Evaluation.results.exact_negative_v2.status,
      fresh_sol_v2_candidate_status: solV2Receipt.status,
      fresh_sol_v2_candidate_model: solV2Receipt.generation.requested_model,
      fresh_sol_v2_reasoning_effort:
        solV2Receipt.generation.requested_reasoning_effort,
      fresh_sol_v2_candidate_installed:
        solV2Receipt.candidate.automatically_installed,
      fresh_sol_v2_holdouts_passed:
        solV2Receipt.deterministic_validation.observed_signature.holdouts.passed,
      fresh_sol_v2_holdouts_total:
        solV2Receipt.deterministic_validation.observed_signature.holdouts.total
    },
    provenance_notice:
      "V2 is a post-start, synthetic developer-safety extension. A fresh post-start GPT-5.6 Sol Ultra proposal is retained with its reconstructed prompt, exact inputs, receipt, compiled candidate, and patch; the candidate passed the deterministic V2 signature but remains quarantined and was not installed as the reference repair. The unchanged pre-start Sol candidate is retained as lineage and rejected under V2; it is not presented as a V2 model repair. The fixed manifest generated_at is deterministic release bookkeeping after proof integration, not an independent attestation of origin. Browser verification checks same-build integrity, fresh deterministic regrades, declared software holdouts, and retained proof byte links, but does not execute the fresh JavaScript candidate or prove publisher authenticity, semantic correctness, physician review, clinical validity, or real-world safety. No physician review was performed. Per-artifact records retain the legacy clinician_validation=pending field solely for schema and provenance compatibility; it is not the canonical fixture-review or clinical-validation state. The canonical current boundary separately records fixture_wording_review=not_performed and clinical_validation=not_claimed. The BP classes are fixture-supplied for exactly 118/74 and 168/112; numeric threshold inference and all middle, borderline, discordant, or repeat-reading behavior are outside scope."
  };

  await writeJsonAtomic(join(runDir, "manifest.json"), manifest);
  return manifest;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const manifest = await buildReferenceRunsV2();
  process.stdout.write(
    `Built V2 ${manifest.files.length}-artifact bundle: ${manifest.comparison.baseline_score} -> ${manifest.comparison.repaired_score}; archived V1 candidate ${manifest.comparison.archived_v1_candidate_v2_status}.\n`
  );
}
