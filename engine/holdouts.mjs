import { gradeRun } from "./core.mjs";
import { runHoldoutSuiteKernel } from "./holdout-kernel.mjs";

export function runHoldoutSuite(caseData, baseCandidate, suite, paired = {}) {
  return runHoldoutSuiteKernel(caseData, baseCandidate, suite, paired, gradeRun);
}
