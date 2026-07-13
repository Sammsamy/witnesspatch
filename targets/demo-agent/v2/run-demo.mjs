import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { assertCase, gradeRun, readJson } from "../../../engine/core.mjs";
import { executeTargetPolicyFile } from "../../../engine/target-adapter.mjs";

const targetDir = dirname(fileURLToPath(import.meta.url));
const rootDir = dirname(dirname(dirname(targetDir)));
const v2ReferenceCreatedAt = "2026-07-13T17:22:00.000Z";

const runs = [
  {
    label: "before / urgent V2",
    caseFile: "postpartum-warning-signs.json",
    policyFile: "baseline.mjs",
    expected: {
      status: "fail",
      score: 50,
      failed_ids: ["INV-01", "INV-02", "INV-03"]
    }
  },
  {
    label: "after / urgent V2",
    caseFile: "postpartum-warning-signs.json",
    policyFile: "repaired.mjs",
    expected: { status: "pass", score: 100, failed_ids: [] }
  },
  {
    label: "after / exact-fact negative control",
    caseFile: "postpartum-exact-negative-control.json",
    policyFile: "repaired.mjs",
    expected: { status: "pass", score: 100, failed_ids: [] }
  },
  {
    label: "overfit mutant / exact-fact negative control",
    caseFile: "postpartum-exact-negative-control.json",
    policyFile: "always-escalate.mjs",
    expected: { status: "fail", score: 25, failed_ids: ["INV-01"] }
  }
];

export async function buildV2DemoReceipt() {
  const receipt = [];

  for (const run of runs) {
    const caseData = assertCase(
      await readJson(join(rootDir, "cases", "v2", run.caseFile))
    );
    const candidate = await executeTargetPolicyFile(
      caseData,
      join(targetDir, run.policyFile),
      { generatedAt: v2ReferenceCreatedAt }
    );
    const evaluation = gradeRun(caseData, candidate);
    const observedFailedIds = evaluation.results
      .filter((result) => !result.passed)
      .map((result) => result.id);
    const expectationMatched =
      evaluation.status === run.expected.status &&
      evaluation.score === run.expected.score &&
      JSON.stringify([...observedFailedIds].sort()) ===
        JSON.stringify([...run.expected.failed_ids].sort());
    receipt.push({
      label: run.label,
      case_id: caseData.id,
      target_policy_id: candidate.provenance.target_policy_id,
      expected: run.expected,
      observed: evaluation.status,
      observed_score: evaluation.score,
      observed_failed_ids: observedFailedIds,
      expectation_matched: expectationMatched,
      score: evaluation.score,
      critical_failures: evaluation.critical_failures
    });
  }

  const passed = receipt.every((run) => run.expectation_matched);
  return {
    schema_version: "1.0.0",
    generated_at: v2ReferenceCreatedAt,
    timestamp_semantics:
      "Fixed V2 reference-artifact creation time; deterministic replays do not claim the current wall-clock time.",
    slice: "executable-target-repair-v2",
    status: passed ? "pass" : "fail",
    policy_diff: "targets/demo-agent/v2/patch.diff",
    contains_real_patient_data: false,
    clinician_validation: "pending",
    limitation:
      "BP scope limitation: only two authored endpoint fixtures are tested (118/74 and 168/112). The grader consumes fixture-supplied classifications; it does not infer numeric thresholds. No middle, borderline, discordant, or repeat-reading behavior is tested. Source-ID linkage is mechanical; semantic support and clinical validity require human review.",
    runs: receipt
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await buildV2DemoReceipt();
  console.log(JSON.stringify(result, null, 2));
  if (result.status !== "pass") {
    process.exitCode = 1;
  }
}
