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
import { buildWorkflowOperationalEvidence } from "./workflow-operational-evidence.mjs";
import { buildDemoReceipt } from "../targets/demo-agent/run-demo.mjs";

const engineDir = dirname(fileURLToPath(import.meta.url));
const rootDir = dirname(engineDir);
const runDir = join(rootDir, "public", "runs");
const casePath = join(rootDir, "cases", "postpartum-warning-signs.json");
const nearNeighborCasePath = join(
  rootDir,
  "cases",
  "postpartum-normal-bp-near-neighbor.json"
);
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

export async function buildReferenceRuns() {
  const caseData = assertCase(await readJson(casePath));
  const baselineInput = await readJson(
    join(engineDir, "fixtures", "postpartum-warning-signs-baseline.input.json")
  );
  const repairedInput = await readJson(
    join(engineDir, "fixtures", "postpartum-warning-signs-repaired.input.json")
  );
  const holdoutDefinition = await readJson(
    join(engineDir, "fixtures", "postpartum-warning-signs-holdouts.json")
  );
  const nearNeighborCase = assertCase(await readJson(nearNeighborCasePath));
  const nearNeighborSafeInput = await readJson(
    join(engineDir, "fixtures", "postpartum-normal-bp-safe.input.json")
  );
  const nearNeighborOverfitInput = await readJson(
    join(engineDir, "fixtures", "postpartum-normal-bp-overfit.input.json")
  );
  const baseline = buildRunArtifact(
    caseData,
    baselineInput,
    referenceArtifactOptions
  );
  const repaired = buildRunArtifact(
    caseData,
    repairedInput,
    referenceArtifactOptions
  );
  const nearNeighborSafe = buildRunArtifact(
    nearNeighborCase,
    nearNeighborSafeInput,
    referenceArtifactOptions
  );
  const nearNeighborOverfit = buildRunArtifact(
    nearNeighborCase,
    nearNeighborOverfitInput,
    referenceArtifactOptions
  );
  const holdouts = runHoldoutSuite(caseData, repairedInput, holdoutDefinition, {
    nearNeighborCase,
    nearNeighborSafe: nearNeighborSafeInput,
    nearNeighborOverfit: nearNeighborOverfitInput
  });
  const counterexample = minimizeCounterexample(caseData, baselineInput);
  const targetRepairReceipt = await buildDemoReceipt();
  const codexRepairReceiptSourcePath = join(
    rootDir,
    "proof",
    "codex-policy-repair-receipt.json"
  );
  const codexRepairReceipt = await readJson(codexRepairReceiptSourcePath);
  const codexProposalSourcePath = join(rootDir, "proof", "codex-proposal.json");
  const codexCandidateSourcePath = join(rootDir, "proof", "codex-candidate.mjs");
  const codexCandidatePatchSourcePath = join(
    rootDir,
    "proof",
    "codex-candidate.patch"
  );
  const codexUrgentCandidate = await executeTargetPolicyFile(
    caseData,
    codexCandidateSourcePath,
    { runId: "captured-codex-repair-urgent" }
  );
  const codexBenignCandidate = await executeTargetPolicyFile(
    nearNeighborCase,
    codexCandidateSourcePath,
    { runId: "captured-codex-repair-benign" }
  );
  const codexUrgentEvaluation = gradeRun(caseData, codexUrgentCandidate);
  const codexBenignEvaluation = gradeRun(
    nearNeighborCase,
    codexBenignCandidate
  );
  const codexCandidateHoldouts = runHoldoutSuite(
    caseData,
    codexUrgentCandidate,
    holdoutDefinition,
    {
      nearNeighborCase,
      nearNeighborSafe: codexBenignCandidate,
      nearNeighborOverfit: nearNeighborOverfitInput
    }
  );
  const workflowOperationalEvidence = buildWorkflowOperationalEvidence({
    repairReceipt: codexRepairReceipt,
    holdoutsPassed: codexCandidateHoldouts.passed,
    holdoutsTotal: codexCandidateHoldouts.total
  });

  await mkdir(runDir, { recursive: true });
  const publicCasePath = join(runDir, "postpartum-warning-signs-case.json");
  const baselinePath = join(runDir, "postpartum-warning-signs-baseline.json");
  const repairedPath = join(runDir, "postpartum-warning-signs-repaired.json");
  const holdoutsPath = join(runDir, "postpartum-warning-signs-holdouts.json");
  const counterexamplePath = join(
    runDir,
    "postpartum-warning-signs-counterexample.json"
  );
  const publicNearNeighborCasePath = join(
    runDir,
    "postpartum-normal-bp-near-neighbor-case.json"
  );
  const nearNeighborSafePath = join(
    runDir,
    "postpartum-normal-bp-near-neighbor-safe.json"
  );
  const nearNeighborOverfitPath = join(
    runDir,
    "postpartum-normal-bp-near-neighbor-overfit.json"
  );
  const targetRepairReceiptPath = join(runDir, "target-repair-receipt.json");
  const codexRepairReceiptPath = join(
    runDir,
    "codex-policy-repair-receipt.json"
  );
  const codexProposalPath = join(runDir, "codex-proposal.json");
  const codexCandidatePath = join(runDir, "codex-candidate.mjs");
  const codexCandidatePatchPath = join(runDir, "codex-candidate.patch");
  const codexCandidateHoldoutsPath = join(
    runDir,
    "codex-candidate-holdouts.json"
  );
  const workflowOperationalEvidencePath = join(
    runDir,
    "workflow-operational-evidence.json"
  );
  const targetPolicyPatchPath = join(runDir, "target-policy.patch");
  const targetPolicyPatchSource = join(
    rootDir,
    "targets",
    "demo-agent",
    "patch.diff"
  );

  await writeJsonAtomic(publicCasePath, caseData);
  await writeJsonAtomic(baselinePath, baseline);
  await writeJsonAtomic(repairedPath, repaired);
  await writeJsonAtomic(holdoutsPath, holdouts);
  await writeJsonAtomic(counterexamplePath, counterexample);
  await writeJsonAtomic(publicNearNeighborCasePath, nearNeighborCase);
  await writeJsonAtomic(nearNeighborSafePath, nearNeighborSafe);
  await writeJsonAtomic(nearNeighborOverfitPath, nearNeighborOverfit);
  await writeJsonAtomic(targetRepairReceiptPath, targetRepairReceipt);
  await writeBytesAtomic(
    codexRepairReceiptPath,
    await readFile(codexRepairReceiptSourcePath)
  );
  await writeBytesAtomic(codexProposalPath, await readFile(codexProposalSourcePath));
  await writeBytesAtomic(
    codexCandidatePath,
    await readFile(codexCandidateSourcePath)
  );
  await writeBytesAtomic(
    codexCandidatePatchPath,
    await readFile(codexCandidatePatchSourcePath)
  );
  await writeJsonAtomic(codexCandidateHoldoutsPath, codexCandidateHoldouts);
  await writeJsonAtomic(
    workflowOperationalEvidencePath,
    workflowOperationalEvidence
  );
  await writeBytesAtomic(
    targetPolicyPatchPath,
    await readFile(targetPolicyPatchSource)
  );

  const files = [
    await fileRecord(
      "case",
      "synthetic_case",
      publicCasePath,
      "/runs/postpartum-warning-signs-case.json"
    ),
    await fileRecord(
      "baseline",
      "evaluated_run",
      baselinePath,
      "/runs/postpartum-warning-signs-baseline.json"
    ),
    await fileRecord(
      "repaired",
      "evaluated_run",
      repairedPath,
      "/runs/postpartum-warning-signs-repaired.json"
    ),
    await fileRecord(
      "holdouts",
      "deterministic_holdout_suite",
      holdoutsPath,
      "/runs/postpartum-warning-signs-holdouts.json"
    ),
    await fileRecord(
      "counterexample",
      "oracle_minimized_counterexample",
      counterexamplePath,
      "/runs/postpartum-warning-signs-counterexample.json"
    ),
    await fileRecord(
      "near_neighbor_case",
      "synthetic_near_neighbor_case",
      publicNearNeighborCasePath,
      "/runs/postpartum-normal-bp-near-neighbor-case.json"
    ),
    await fileRecord(
      "near_neighbor_safe",
      "evaluated_run",
      nearNeighborSafePath,
      "/runs/postpartum-normal-bp-near-neighbor-safe.json"
    ),
    await fileRecord(
      "near_neighbor_overfit",
      "evaluated_run",
      nearNeighborOverfitPath,
      "/runs/postpartum-normal-bp-near-neighbor-overfit.json"
    ),
    await fileRecord(
      "codex_policy_repair_receipt",
      "captured_codex_policy_repair_receipt",
      codexRepairReceiptPath,
      "/runs/codex-policy-repair-receipt.json"
    ),
    await fileRecord(
      "codex_proposal",
      "captured_codex_declarative_proposal",
      codexProposalPath,
      "/runs/codex-proposal.json"
    ),
    await fileRecord(
      "codex_candidate",
      "compiled_codex_policy_candidate",
      codexCandidatePath,
      "/runs/codex-candidate.mjs"
    ),
    await fileRecord(
      "codex_candidate_patch",
      "captured_codex_candidate_diff",
      codexCandidatePatchPath,
      "/runs/codex-candidate.patch"
    ),
    await fileRecord(
      "codex_candidate_holdouts",
      "post_capture_excluded_holdout_suite",
      codexCandidateHoldoutsPath,
      "/runs/codex-candidate-holdouts.json"
    ),
    await fileRecord(
      "workflow_operational_evidence",
      "bounded_single_run_operational_observation",
      workflowOperationalEvidencePath,
      "/runs/workflow-operational-evidence.json"
    ),
    await fileRecord(
      "target_repair_receipt",
      "executable_target_repair_receipt",
      targetRepairReceiptPath,
      "/runs/target-repair-receipt.json"
    ),
    await fileRecord(
      "target_policy_patch",
      "verified_unified_diff",
      targetPolicyPatchPath,
      "/runs/target-policy.patch"
    )
  ];
  const manifest = {
    schema_version: "1.0.0",
    generated_at: "2026-07-13T07:15:00.000Z",
    algorithm: "sha256",
    hash_scope: "Exact UTF-8 file bytes for each listed artifact; the manifest does not hash itself.",
    case_id: caseData.id,
    case_fingerprint: caseFingerprint(caseData),
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
      holdouts_passed: holdouts.passed,
      holdouts_total: holdouts.total,
      counterexample_starting_facts: counterexample.starting_fact_count,
      counterexample_minimal_facts: counterexample.minimal_fact_count,
      counterexample_minimality_scope: counterexample.minimality_scope,
      near_neighbor_safe_status: nearNeighborSafe.evaluation.status,
      near_neighbor_safe_score: nearNeighborSafe.evaluation.score,
      near_neighbor_overfit_status: nearNeighborOverfit.evaluation.status,
      near_neighbor_overfit_score: nearNeighborOverfit.evaluation.score,
      executable_target_status: targetRepairReceipt.status,
      executable_target_runs_matched: targetRepairReceipt.runs.filter(
        (run) => run.expectation_matched
      ).length,
      executable_target_runs_total: targetRepairReceipt.runs.length,
      captured_codex_repair_status: codexRepairReceipt.status,
      captured_codex_repair_model:
        codexRepairReceipt.generation.requested_model,
      captured_codex_repair_effort:
        codexRepairReceipt.generation.requested_reasoning_effort,
      captured_codex_repair_api_key_required:
        codexRepairReceipt.generation.api_key_required,
      captured_codex_repair_candidate_installed:
        codexRepairReceipt.candidate.automatically_installed,
      captured_codex_repair_urgent_score:
        codexUrgentEvaluation.score,
      captured_codex_repair_benign_score:
        codexBenignEvaluation.score,
      captured_codex_repair_urgent_status: codexUrgentEvaluation.status,
      captured_codex_repair_benign_status: codexBenignEvaluation.status,
      captured_codex_repair_holdouts_passed: codexCandidateHoldouts.passed,
      captured_codex_repair_holdouts_total: codexCandidateHoldouts.total,
      observed_authored_fixture_to_validated_candidate_ms:
        workflowOperationalEvidence.observation.observed_wall_clock_ms,
      observed_workflow_sample_size:
        workflowOperationalEvidence.observation.sample_size,
      safe_action_latency_delta_minutes:
        repaired.evaluation.metrics.time_to_safe_action_minutes -
        baseline.evaluation.metrics.time_to_safe_action_minutes
    },
    provenance_notice: "All artifacts are synthetic developer-safety fixtures. The captured Sol Ultra candidate is separate from the retained reference policy and was not automatically installed. The definitions for 13 holdout checks were excluded from the isolated repair invocation and executed afterward by deterministic code; this is software holdout evidence, not clinical validation. The 113.770-second value is one system-wall-clock observation from authored fixtures to a validated candidate, with preexisting authentication and post-capture holdout execution outside the interval and cache state unknown; it is not a benchmark, time-saved claim, or incident-to-regression measurement. Physician validation is pending. No artifact is clinical advice or a captured patient record. Source linkage validates declared IDs only. Message/action and future-fact text checks use case-locked lexical markers; they do not prove semantic consistency or detect unlisted paraphrases. Semantic and clinical support require human review."
  };

  await writeJsonAtomic(join(runDir, "manifest.json"), manifest);
  return manifest;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const manifest = await buildReferenceRuns();
  process.stdout.write(
    `Built ${manifest.files.length} hashed artifacts: ${manifest.comparison.baseline_score} -> ${manifest.comparison.repaired_score}.\n`
  );
}
