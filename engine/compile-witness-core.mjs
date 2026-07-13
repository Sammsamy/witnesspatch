import { minimizeCounterexample } from "./minimize-counterexample.mjs";

const JSON_INDENT = 2;

function requireValue(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

export class NoCompilableFailureError extends Error {
  constructor(message) {
    super(message);
    this.name = "NoCompilableFailureError";
    this.exitCode = 1;
  }
}

export function jsonWitnessFile(value) {
  return `${JSON.stringify(value, null, JSON_INDENT)}\n`;
}

export function normalizeWitnessRunInput(runInput) {
  return {
    run_id: runInput.run_id,
    variant: runInput.variant,
    provenance: runInput.provenance,
    decisions: runInput.decisions,
    ...(runInput.repair ? { repair: runInput.repair } : {})
  };
}

export function selectFailedActionInvariant(
  caseData,
  evaluation,
  targetRuleId
) {
  const ruleOrder = new Map(
    caseData.rules.map((rule, index) => [rule.id, index])
  );
  const failedActionInvariants = evaluation.results
    .filter((result) => result.kind === "action_invariant" && !result.passed)
    .sort(
      (left, right) =>
        left.deadline_minute - right.deadline_minute ||
        Number(right.critical) - Number(left.critical) ||
        ruleOrder.get(left.id) - ruleOrder.get(right.id)
    );

  requireValue(
    failedActionInvariants.length > 0,
    "compile requires at least one failed action invariant; control-only failures are not yet supported."
  );

  if (targetRuleId) {
    const selected = failedActionInvariants.find(
      (result) => result.id === targetRuleId
    );
    requireValue(
      selected,
      `--rule ${targetRuleId} must name a failed action invariant in this run.`
    );
    return selected;
  }

  return (
    failedActionInvariants.find((result) => result.critical) ??
    failedActionInvariants[0]
  );
}

export function buildRegressionTestSource() {
  return `import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { access, readFile } from "node:fs/promises";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

async function isReadable(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

const bundleDir = dirname(fileURLToPath(import.meta.url));
const contract = JSON.parse(
  await readFile(join(bundleDir, "regression.json"), "utf8")
);
const candidatePath = process.env.WITNESSPATCH_CANDIDATE
  ? resolve(process.env.WITNESSPATCH_CANDIDATE)
  : join(bundleDir, contract.candidate_file);
const repositoryCli = resolve(process.cwd(), "bin", "witnesspatch.mjs");
const configuredCli = process.env.WITNESSPATCH_CLI
  ?? ((await isReadable(repositoryCli)) ? repositoryCli : "witnesspatch");
const cliIsPath =
  isAbsolute(configuredCli)
  || configuredCli.includes("/")
  || configuredCli.includes("\\\\");
const command = cliIsPath ? process.execPath : configuredCli;
const args = cliIsPath
  ? [configuredCli, "evaluate", "--case", join(bundleDir, contract.case_file), "--candidate", candidatePath]
  : ["evaluate", "--case", join(bundleDir, contract.case_file), "--candidate", candidatePath];

test(contract.title, () => {
  const result = spawnSync(command, args, { encoding: "utf8" });
  assert.equal(
    result.error,
    undefined,
    "WitnessPatch CLI was not found. Run from the repository root, install witnesspatch on PATH, or set WITNESSPATCH_CLI to bin/witnesspatch.mjs."
  );
  assert.ok(
    result.status === 0 || result.status === 1,
    result.stderr || "WitnessPatch evaluation did not return a valid verdict."
  );
  const artifact = JSON.parse(result.stdout);
  const target = artifact.evaluation.results.find(
    (item) => item.id === contract.target_rule_id
  );
  assert.equal(
    target?.passed,
    true,
    contract.failure_message
  );
  assert.equal(
    artifact.evaluation.status,
    contract.expected_repaired_status,
    "The compiled contract regression should pass after repair."
  );
});
`;
}

export function buildWitnessBundleBase({
  caseData,
  normalizedRun,
  evaluatedRun,
  identityHash,
  targetRuleId,
  startingFactScope,
  inputCaseSha256 = null,
  inputRunSha256 = null,
  validateStaticWitness = (value) => value
}) {
  requireValue(
    /^[a-f0-9]{16}$/u.test(identityHash),
    "compile identity hash must contain exactly 16 lowercase hexadecimal characters."
  );
  if (evaluatedRun.evaluation.status !== "fail") {
    throw new NoCompilableFailureError(
      "compile found no failing verdict; use evaluate for passing runs."
    );
  }

  const target = selectFailedActionInvariant(
    caseData,
    evaluatedRun.evaluation,
    targetRuleId
  );
  const bundleId = `witness-bundle-${identityHash}`;
  const sourceTimestamp = evaluatedRun.provenance.generated_at;
  const prefixSteps = caseData.timeline.filter(
    (step) => step.at_minute <= target.deadline_minute
  );
  const prefixStepIds = new Set(prefixSteps.map((step) => step.id));
  const prefixDecisions = evaluatedRun.decisions.filter((decision) =>
    prefixStepIds.has(decision.step_id)
  );
  const selectionPolicy = targetRuleId
    ? "explicit_failed_action_invariant"
    : target.critical
      ? "earliest_critical_failed_action_invariant"
      : "earliest_failed_action_invariant";
  const earlierFailedActionInvariants = evaluatedRun.evaluation.results
    .filter(
      (result) =>
        result.kind === "action_invariant" &&
        !result.passed &&
        result.deadline_minute < target.deadline_minute
    )
    .map((result) => ({
      id: result.id,
      critical: result.critical,
      failure_known_at_minute: result.deadline_minute
    }));
  const coincidentCriticalFailures = evaluatedRun.evaluation.results
    .filter(
      (result) =>
        result.kind === "action_invariant" &&
        !result.passed &&
        result.critical &&
        result.id !== target.id &&
        result.deadline_minute === target.deadline_minute
    )
    .map((result) => result.id);
  const failingPrefix = {
    schema_version: "1.0.0",
    kind: `${selectionPolicy}_prefix`,
    selection_policy: selectionPolicy,
    bundle_id: bundleId,
    case_id: caseData.id,
    case_sha256: evaluatedRun.case_sha256,
    source_run_id: evaluatedRun.run_id,
    target_rule_id: target.id,
    target_rule_title: target.title,
    triggered_at_minute: target.triggered_at_minute,
    failure_known_at_minute: target.deadline_minute,
    timeline_steps: prefixSteps,
    decisions: prefixDecisions,
    failure: {
      missing_actions: target.missing_actions,
      forbidden_actions_observed: target.forbidden_actions_observed
    },
    earlier_failed_action_invariants: earlierFailedActionInvariants,
    coincident_critical_failures: coincidentCriticalFailures,
    interpretation:
      "This is the earliest prefix at which the selected encoded action invariant is known to fail under the recorded trace. Earlier action-invariant failures and coincident critical failures are listed explicitly. It is a synthetic software witness, not a clinical judgment."
  };

  const minimized = minimizeCounterexample(caseData, normalizedRun, target.id, {
    ...(startingFactScope ? { startingFactScope } : {})
  });
  const compiledProvenance = { ...minimized.provenance };
  delete compiledProvenance.starting_fact_scope;
  const staticWitness = validateStaticWitness({
    ...minimized,
    counterexample_id: `static-witness-${identityHash}`,
    generated_at: sourceTimestamp,
    minimality_label: "contract-cardinality-minimal-static-trace",
    minimality_scope: `Encoded ${target.id} action predicate over this recorded synthetic trace`,
    selection_policy: selectionPolicy,
    target_rerun: false,
    target_adapter_invoked: false,
    semantic_correctness_claimed: false,
    counterfactual_target_behavior_claimed: false,
    provenance: {
      ...compiledProvenance,
      generation_mode: "deterministic_static_trace_delta_debugging",
      interpretation:
        "The recorded decisions are held fixed while synthetic fact identifiers are reduced. The target is not re-executed for each subset. This proves cardinality minimality only for the selected encoded contract over this static trace; it is not clinical minimality or behavioral target-in-loop minimization."
    },
    verification: {
      ...minimized.verification,
      target_reexecuted_per_subset: false
    }
  });

  const regression = {
    schema_version: "1.0.0",
    kind: "compiled_contract_regression",
    regression_id: `regression-${identityHash}`,
    bundle_id: bundleId,
    title: `${target.id}: ${target.title}`,
    case_file: "case.json",
    candidate_file: "run.json",
    target_rule_id: target.id,
    expected_repaired_status: "pass",
    initial_status: "red",
    initial_score: evaluatedRun.evaluation.score,
    initial_critical_failures: evaluatedRun.evaluation.critical_failures,
    failure_message: `Encoded contract ${target.id} still fails for this candidate.`,
    run:
      "From the WitnessPatch repository root, run: node --test regression.test.mjs. The test auto-detects ./bin/witnesspatch.mjs, then falls back to witnesspatch on PATH; WITNESSPATCH_CLI overrides both. Set WITNESSPATCH_CANDIDATE to test a repaired JSON run.",
    limitations: [
      "This regression asserts the declared deterministic software contract only.",
      "Source semantics and clinical appropriateness still require qualified human review."
    ]
  };
  const receipt = {
    schema_version: "1.0.0",
    kind: "deterministic_witness_compilation_receipt",
    bundle_id: bundleId,
    source_run_timestamp: sourceTimestamp,
    case_id: caseData.id,
    case_sha256: evaluatedRun.case_sha256,
    source_run_id: evaluatedRun.run_id,
    selected_rule_id: target.id,
    selected_rule_reason: targetRuleId
      ? "explicit --rule selection"
      : "earliest failed critical action invariant",
    failure_known_at_minute: target.deadline_minute,
    starting_fact_count: staticWitness.starting_fact_count,
    minimal_fact_count: staticWitness.minimal_fact_count,
    regression_initial_status: "red",
    api_key_required: false,
    model_invoked: false,
    input_case_sha256: inputCaseSha256,
    input_run_sha256: inputRunSha256,
    contains_real_patient_data: false,
    clinician_validation: "pending",
    manifest_file: "manifest.json"
  };

  const files = new Map([
    ["case.json", jsonWitnessFile(caseData)],
    ["run.json", jsonWitnessFile(normalizedRun)],
    ["evaluated-run.json", jsonWitnessFile(evaluatedRun)],
    ["failing-prefix.json", jsonWitnessFile(failingPrefix)],
    ["static-witness.json", jsonWitnessFile(staticWitness)],
    ["regression.json", jsonWitnessFile(regression)],
    ["regression.test.mjs", buildRegressionTestSource()],
    ["receipt.json", jsonWitnessFile(receipt)]
  ]);

  return {
    bundleId,
    targetRuleId: target.id,
    evaluatedRun,
    staticWitness,
    regression,
    files,
    receipt
  };
}

export function buildWitnessBundleManifest({
  bundle,
  records,
  validateManifest = (value) => value
}) {
  const manifest = validateManifest({
    schema_version: "1.0.0",
    kind: "witness_bundle_manifest",
    bundle_id: bundle.bundleId,
    case_id: bundle.evaluatedRun.case_id,
    source_run_id: bundle.evaluatedRun.run_id,
    target_rule_id: bundle.targetRuleId,
    files: [...records].sort((left, right) =>
      left.path.localeCompare(right.path)
    ),
    verification:
      "Every listed SHA-256 digest covers the exact UTF-8 bytes in this bundle. The manifest does not list itself."
  });
  const files = new Map(bundle.files);
  files.set("manifest.json", jsonWitnessFile(manifest));
  return { ...bundle, files, manifest };
}
