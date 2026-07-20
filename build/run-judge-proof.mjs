import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { buildV2DemoReceipt } from "../targets/demo-agent/v2/run-demo.mjs";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const expectedBundleFiles = Object.freeze([
  "case.json",
  "evaluated-run.json",
  "failing-prefix.json",
  "manifest.json",
  "receipt.json",
  "regression.json",
  "regression.test.mjs",
  "run.json",
  "static-witness.json"
]);

function requireValue(condition, message) {
  if (!condition) throw new Error(message);
}

function invoke(command, args, options) {
  const result = spawnSync(command, args, {
    ...options,
    encoding: "utf8",
    maxBuffer: 2 * 1024 * 1024,
    windowsHide: true
  });
  requireValue(result.error === undefined, "A judge-proof subprocess could not start.");
  return result;
}

function regressionEnvironment(rootDir, candidatePath = null) {
  const environment = { ...process.env };
  delete environment.WITNESSPATCH_CANDIDATE;
  delete environment.NODE_TEST_CONTEXT;
  delete environment.NODE_TEST_REPORTER;
  delete environment.NODE_TEST_REPORTER_DESTINATION;
  environment.WITNESSPATCH_CLI = resolve(rootDir, "bin", "witnesspatch.mjs");
  if (candidatePath) environment.WITNESSPATCH_CANDIDATE = candidatePath;
  return environment;
}

function runRegression(rootDir, bundleDir, candidatePath = null) {
  return invoke(
    process.execPath,
    [
      "--test",
      "--test-reporter=tap",
      resolve(bundleDir, "regression.test.mjs")
    ],
    {
      cwd: rootDir,
      env: regressionEnvironment(rootDir, candidatePath)
    }
  );
}

function assertRegression(result, expected, targetRuleId) {
  const output = `${result.stdout}\n${result.stderr}`;
  requireValue(
    !output.includes("WitnessPatch CLI was not found"),
    "The generated regression could not find the WitnessPatch CLI."
  );
  if (expected === "red") {
    requireValue(
      result.status === 1 && /# pass 0\b/u.test(output) && /# fail 1\b/u.test(output),
      "The compiled baseline regression did not fail red exactly once."
    );
    requireValue(
      output.includes(`Encoded contract ${targetRuleId} still fails for this candidate.`),
      "The red regression did not fail on its selected encoded contract."
    );
    return;
  }
  requireValue(
    result.status === 0 && /# pass 1\b/u.test(output) && /# fail 0\b/u.test(output),
    "The retained repair did not pass the same compiled regression exactly once."
  );
}

export async function runJudgeProof({ rootDir = projectRoot } = {}) {
  const temporaryRoot = await mkdtemp(join(tmpdir(), "witnesspatch-judge-proof-"));
  const bundleDir = join(temporaryRoot, "compiled-red-regression");
  try {
    const compile = invoke(
      process.execPath,
      [
        resolve(rootDir, "bin", "witnesspatch.mjs"),
        "compile",
        "--case",
        resolve(rootDir, "public", "runs", "v2", "postpartum-warning-signs-case.json"),
        "--run",
        resolve(rootDir, "public", "runs", "v2", "postpartum-warning-signs-baseline.json"),
        "--out-dir",
        bundleDir,
        "--fact-scope",
        "failure-prefix"
      ],
      { cwd: rootDir, env: regressionEnvironment(rootDir) }
    );
    requireValue(
      compile.status === 0,
      `The V2 reference failure could not compile (exit ${compile.status ?? "none"}).`
    );

    const bundleFiles = (await readdir(bundleDir)).sort();
    requireValue(
      JSON.stringify(bundleFiles) === JSON.stringify(expectedBundleFiles),
      "The compiler did not emit the exact nine-file witness bundle."
    );
    const [manifest, compilerReceipt] = await Promise.all([
      readFile(join(bundleDir, "manifest.json"), "utf8").then(JSON.parse),
      readFile(join(bundleDir, "receipt.json"), "utf8").then(JSON.parse)
    ]);
    requireValue(
      manifest?.kind === "witness_bundle_manifest" &&
        typeof manifest.bundle_id === "string" &&
        typeof manifest.target_rule_id === "string",
      "The compiled witness manifest is incomplete."
    );
    requireValue(
      compilerReceipt?.selected_rule_id === manifest.target_rule_id &&
        Number.isInteger(compilerReceipt.failure_known_at_minute),
      "The compiler receipt does not match its manifest."
    );

    const baseline = runRegression(rootDir, bundleDir);
    assertRegression(baseline, "red", manifest.target_rule_id);
    const repairedCandidate = resolve(
      rootDir,
      "engine",
      "fixtures",
      "v2",
      "postpartum-warning-signs-repaired.input.json"
    );
    const repaired = runRegression(rootDir, bundleDir, repairedCandidate);
    assertRegression(repaired, "green", manifest.target_rule_id);

    const v2Receipt = await buildV2DemoReceipt();
    requireValue(v2Receipt.status === "pass", "The V2 executable closure did not pass.");
    const mutation = v2Receipt.runs.find(
      (run) => run.target_policy_id === "demo-agent-v2-always-escalate-mutant"
    );
    requireValue(
      mutation?.expectation_matched === true &&
        mutation.observed === "fail" &&
        mutation.observed_score === 25,
      "The always-escalate mutation was not rejected by the exact-fact control."
    );

    return Object.freeze({
      bundle_id: manifest.bundle_id,
      bundle_files: bundleFiles.length,
      target_rule_id: manifest.target_rule_id,
      failure_known_at_minute: compilerReceipt.failure_known_at_minute,
      baseline_exit_code: baseline.status,
      repair_exit_code: repaired.status,
      mutation_policy_id: mutation.target_policy_id,
      mutation_status: mutation.observed,
      mutation_score: mutation.observed_score
    });
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}

export function formatJudgeProof(result) {
  const minute = String(result.failure_known_at_minute).padStart(2, "0");
  return [
    "WITNESSPATCH JUDGE PROOF PASS",
    `1 COMPILE  ${result.bundle_files}-file red regression · ${result.target_rule_id} · T+${minute}`,
    `2 RED      baseline failed the compiled regression as required · exit ${result.baseline_exit_code}`,
    `3 GREEN    retained repair passed that same regression · exit ${result.repair_exit_code}`,
    `4 MUTATION FAIL (expected) · always-escalate rejected · ${result.mutation_score}/100`,
    "BOUNDARY   synthetic software proof only · no clinical validation or runtime model call"
  ].join("\n");
}

async function main() {
  try {
    requireValue(process.argv.length === 2, "judge:proof takes no arguments.");
    const result = await runJudgeProof();
    process.stdout.write(`${formatJudgeProof(result)}\n`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown judge-proof error.";
    process.stderr.write(`WITNESSPATCH JUDGE PROOF FAIL: ${message}\n`);
    process.exitCode = 1;
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await main();
}
