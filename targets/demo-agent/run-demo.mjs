import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { assertCase, gradeRun, readJson } from "../../engine/core.mjs";
import { executeTargetPolicyFile } from "../../engine/target-adapter.mjs";

const targetDir = dirname(fileURLToPath(import.meta.url));
const rootDir = dirname(dirname(targetDir));

const runs = [
  {
    label: "before / urgent",
    caseFile: "postpartum-warning-signs.json",
    policyFile: "baseline.mjs",
    expected: "fail"
  },
  {
    label: "after / urgent",
    caseFile: "postpartum-warning-signs.json",
    policyFile: "repaired.mjs",
    expected: "pass"
  },
  {
    label: "after / benign twin",
    caseFile: "postpartum-normal-bp-near-neighbor.json",
    policyFile: "repaired.mjs",
    expected: "pass"
  },
  {
    label: "overfit mutant / benign twin",
    caseFile: "postpartum-normal-bp-near-neighbor.json",
    policyFile: "always-escalate.mjs",
    expected: "fail"
  }
];

export async function buildDemoReceipt() {
  const receipt = [];

  for (const run of runs) {
    const caseData = assertCase(
      await readJson(join(rootDir, "cases", run.caseFile))
    );
    const candidate = await executeTargetPolicyFile(
      caseData,
      join(targetDir, run.policyFile)
    );
    const evaluation = gradeRun(caseData, candidate);
    receipt.push({
      label: run.label,
      case_id: caseData.id,
      target_policy_id: candidate.provenance.target_policy_id,
      expected: run.expected,
      observed: evaluation.status,
      expectation_matched: evaluation.status === run.expected,
      score: evaluation.score,
      critical_failures: evaluation.critical_failures
    });
  }

  const passed = receipt.every((run) => run.expectation_matched);
  return {
    schema_version: "1.0.0",
    generated_at: "2026-07-13T06:30:00.000Z",
    slice: "executable-target-repair",
    status: passed ? "pass" : "fail",
    policy_diff: "targets/demo-agent/patch.diff",
    contains_real_patient_data: false,
    clinician_validation: "pending",
    limitation:
      "Source-ID linkage is mechanical; semantic support and clinical validity require human review.",
    runs: receipt
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await buildDemoReceipt();
  console.log(JSON.stringify(result, null, 2));
  if (result.status !== "pass") {
    process.exitCode = 1;
  }
}
