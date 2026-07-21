import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash, webcrypto } from "node:crypto";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  compileBrowserWitness,
  compileBrowserWitnessFromBytes,
  inspectBrowserRunFromBytes,
  MAX_LOCAL_INPUT_BYTES
} from "../browser-witness-compiler.mjs";
import { compileWitnessBundle } from "../compile-witness.mjs";
import { caseFingerprint } from "../core.mjs";

const testDir = dirname(fileURLToPath(import.meta.url));
const rootDir = dirname(dirname(testDir));
const publicDir = join(rootDir, "public");
const manifestPath = join(publicDir, "runs", "v2", "manifest.json");
const cliPath = join(rootDir, "bin", "witnesspatch.mjs");

async function fixture() {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const routes = new Map();
  for (const record of manifest.files) {
    if (record.id === "case" || record.id === "baseline") {
      routes.set(record.path, await readFile(join(publicDir, record.path)));
    }
  }
  return { manifest, routes };
}

function fetchFrom(routes) {
  return async (input) => {
    const path = new URL(input).pathname;
    const bytes = routes.get(path);
    if (!bytes) {
      return {
        ok: false,
        redirected: false,
        async arrayBuffer() {
          return new ArrayBuffer(0);
        }
      };
    }
    return {
      ok: true,
      redirected: false,
      async arrayBuffer() {
        return bytes.buffer.slice(
          bytes.byteOffset,
          bytes.byteOffset + bytes.byteLength
        );
      }
    };
  };
}

const digest = (bytes) => createHash("sha256").update(bytes).digest("hex");

function replaceManifestedJson(manifest, routes, id, value) {
  const record = manifest.files.find((item) => item.id === id);
  const bytes = Buffer.from(`${JSON.stringify(value, null, 2)}\n`, "utf8");
  routes.set(record.path, bytes);
  record.bytes = bytes.byteLength;
  record.sha256 = digest(bytes);
  return bytes;
}

function exactInputBytes(manifest, routes) {
  return {
    caseBytes: routes.get(
      manifest.files.find((record) => record.id === "case").path
    ),
    runBytes: routes.get(
      manifest.files.find((record) => record.id === "baseline").path
    )
  };
}

function rawRunFromArtifact(artifact) {
  const raw = structuredClone(artifact);
  for (const key of [
    "schema_version",
    "case_id",
    "case_sha256",
    "provenance_verification",
    "evaluation",
    "audit_log"
  ]) {
    delete raw[key];
  }
  return raw;
}

test("browser compilation byte-matches the shared Node compiler for the exact public inputs", async () => {
  const { manifest, routes } = await fixture();
  const browser = await compileBrowserWitness({
    manifest,
    fetchImpl: fetchFrom(routes),
    subtle: webcrypto.subtle,
    baseUrl: "https://witnesspatch.test/"
  });
  const caseBytes = routes.get(
    manifest.files.find((record) => record.id === "case").path
  );
  const baselineBytes = routes.get(
    manifest.files.find((record) => record.id === "baseline").path
  );
  const node = compileWitnessBundle(
    JSON.parse(caseBytes.toString("utf8")),
    JSON.parse(baselineBytes.toString("utf8")),
    {
      inputCaseSha256: digest(caseBytes),
      inputRunSha256: digest(baselineBytes),
      startingFactScope: "failure_prefix"
    }
  );
  const browserFiles = new Map(
    browser.files.map(({ path, contents }) => [path, contents])
  );

  assert.equal(browser.status, "compiled_red");
  assert.deepEqual(browser.hashes, { verified: 2, total: 2 });
  assert.deepEqual(browser.session_input_verification, {
    mode: "manifest_verified_reference_inputs",
    hashes_computed: 2,
    hashes_verified: 2,
    external_manifest_verified: true
  });
  assert.equal(browser.receipt.input_integrity.external_manifest_verified, false);
  assert.match(browser.trust_boundary, /portable bundle deliberately records/);
  assert.equal(browser.file_count, 9);
  assert.equal(browser.target_rule_id, "INV-02");
  assert.equal(browser.failure_known_at_minute, 2);
  assert.equal(browser.starting_fact_count, 9);
  assert.equal(browser.minimal_fact_count, 3);
  assert.equal(browser.regression_initial_status, "red");
  assert.equal(browser.receipt.model_invoked, false);
  assert.equal(browser.receipt.api_key_required, false);
  assert.equal(browser.receipt.contains_real_patient_data, false);
  assert.equal(browser.receipt.clinician_validation, "pending");
  assert.deepEqual([...browserFiles.keys()], [...node.files.keys()]);
  for (const [path, contents] of node.files) {
    assert.equal(browserFiles.get(path), contents, path);
  }
  assert.equal(browser.manifest_sha256, digest(node.files.get("manifest.json")));
});

test("browser compilation byte-matches the shipped CLI for the exact public inputs", async (t) => {
  const { manifest, routes } = await fixture();
  const browser = await compileBrowserWitness({
    manifest,
    fetchImpl: fetchFrom(routes),
    subtle: webcrypto.subtle,
    baseUrl: "https://witnesspatch.test/"
  });
  const caseRecord = manifest.files.find((record) => record.id === "case");
  const baselineRecord = manifest.files.find(
    (record) => record.id === "baseline"
  );
  const directory = await mkdtemp(
    join(tmpdir(), "witnesspatch-browser-cli-parity-")
  );
  t.after(() => rm(directory, { recursive: true, force: true }));
  const outDir = join(directory, "bundle");
  const result = spawnSync(
    process.execPath,
    [
      cliPath,
      "compile",
      "--case",
      join(publicDir, caseRecord.path.replace(/^\/+/, "")),
      "--run",
      join(publicDir, baselineRecord.path.replace(/^\/+/, "")),
      "--out-dir",
      outDir,
      "--fact-scope",
      "failure-prefix"
    ],
    { cwd: rootDir, encoding: "utf8" }
  );
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stdout + result.stderr);

  const summary = JSON.parse(result.stdout);
  assert.equal(summary.starting_fact_count, 9);
  assert.equal(summary.minimal_fact_count, 3);
  assert.equal(summary.input_case_sha256, caseRecord.sha256);
  assert.equal(summary.input_run_sha256, baselineRecord.sha256);

  const browserFiles = new Map(
    browser.files.map(({ path, contents }) => [path, contents])
  );
  const cliFileNames = (await readdir(outDir)).sort();
  assert.deepEqual(cliFileNames, [...browserFiles.keys()].sort());
  for (const path of cliFileNames) {
    assert.equal(
      await readFile(join(outDir, path), "utf8"),
      browserFiles.get(path),
      path
    );
  }
});

test("local selected bytes byte-match the manifest-bound browser result", async () => {
  const { manifest, routes } = await fixture();
  const inputs = exactInputBytes(manifest, routes);
  const [reference, local] = await Promise.all([
    compileBrowserWitness({
      manifest,
      fetchImpl: fetchFrom(routes),
      subtle: webcrypto.subtle,
      baseUrl: "https://witnesspatch.test/"
    }),
    compileBrowserWitnessFromBytes({
      ...inputs,
      subtle: webcrypto.subtle
    })
  ]);

  assert.equal(local.mode, "locally_hashed_unverified_inputs");
  assert.deepEqual(local.hashes, { computed: 2, verified: 0, total: 2 });
  assert.deepEqual(local.session_input_verification, {
    mode: "locally_hashed_unverified_inputs",
    hashes_computed: 2,
    hashes_verified: 0,
    external_manifest_verified: false
  });
  assert.equal(local.case_id, "postpartum-warning-signs-v2-001");
  assert.equal(local.input_case_sha256, digest(inputs.caseBytes));
  assert.equal(local.input_run_sha256, digest(inputs.runBytes));
  assert.equal(local.source_run_id, "run-pws-v2-001-baseline");
  assert.equal(local.fresh_evaluation.status, "fail");
  assert.equal(local.file_count, 9);
  assert.deepEqual(local.receipt.input_integrity, {
    mode: "locally_hashed_unverified_inputs",
    hashes_computed: 2,
    external_manifest_verified: false,
    data_declaration_verification: "unverified_input_declaration",
    limitation:
      "The compiler enforces declared synthetic-data fields but does not detect PHI, prove de-identification, or establish publisher provenance."
  });
  const exportedManifest = JSON.parse(
    local.files.find((file) => file.path === "manifest.json").contents
  );
  assert.deepEqual(exportedManifest.input_integrity, local.receipt.input_integrity);
  assert.match(exportedManifest.verification, /not publisher provenance/);
  assert.deepEqual(local.files, reference.files);
  assert.equal(local.manifest_sha256, reference.manifest_sha256);
});

test("the local inspector compares passing and failing traces without invoking a model", async () => {
  const { manifest, routes } = await fixture();
  const { caseBytes, runBytes } = exactInputBytes(manifest, routes);
  const repairedRecord = manifest.files.find((record) => record.id === "repaired");
  const repairedBytes = await readFile(join(publicDir, repairedRecord.path));

  const [baseline, repaired] = await Promise.all([
    inspectBrowserRunFromBytes({
      caseBytes,
      runBytes,
      subtle: webcrypto.subtle
    }),
    inspectBrowserRunFromBytes({
      caseBytes,
      runBytes: repairedBytes,
      subtle: webcrypto.subtle
    })
  ]);

  assert.equal(baseline.status, "inspected");
  assert.equal(baseline.evaluation.status, "fail");
  assert.equal(baseline.evaluation.score, 50);
  assert.deepEqual(baseline.evaluation.critical_failures, ["INV-02", "INV-03"]);
  assert.deepEqual(baseline.evaluation.first_missed_contract, {
    id: "INV-02",
    deadline_minute: 2,
    critical: true
  });
  assert.equal(baseline.can_compile_failure, true);
  assert.equal(baseline.compile_blocker, null);
  assert.equal(repaired.evaluation.status, "pass");
  assert.equal(repaired.evaluation.score, 100);
  assert.equal(repaired.evaluation.first_missed_contract, null);
  assert.equal(repaired.can_compile_failure, false);
  assert.match(repaired.compile_blocker, /fresh evaluation passes/i);
  assert.match(baseline.trust_boundary, /never calls a model|Model names/u);
});

test("model declarations switch complete trace bytes without changing locked grading", async () => {
  const { manifest, routes } = await fixture();
  const { caseBytes, runBytes } = exactInputBytes(manifest, routes);
  const original = rawRunFromArtifact(JSON.parse(runBytes.toString("utf8")));
  const terra = structuredClone(original);
  terra.run_id = "run-terra-comparison";
  terra.provenance.model_config_requested = "gpt-5.6-terra";
  terra.provenance.reasoning_effort_requested = "medium";
  const otherProvider = structuredClone(original);
  otherProvider.run_id = "run-other-provider-comparison";
  otherProvider.provenance.model_config_requested = "provider-x/model-y";
  delete otherProvider.provenance.reasoning_effort_requested;
  const terraBytes = Buffer.from(`${JSON.stringify(terra, null, 2)}\n`);
  const otherBytes = Buffer.from(`${JSON.stringify(otherProvider, null, 2)}\n`);

  const [terraInspection, otherInspection] = await Promise.all([
    inspectBrowserRunFromBytes({
      caseBytes,
      runBytes: terraBytes,
      subtle: webcrypto.subtle
    }),
    inspectBrowserRunFromBytes({
      caseBytes,
      runBytes: otherBytes,
      subtle: webcrypto.subtle
    })
  ]);

  assert.equal(terraInspection.requested_model, "gpt-5.6-terra");
  assert.equal(terraInspection.requested_reasoning_effort, "medium");
  assert.equal(otherInspection.requested_model, "provider-x/model-y");
  assert.equal(otherInspection.requested_reasoning_effort, null);
  assert.deepEqual(terraInspection.evaluation, otherInspection.evaluation);
  assert.notEqual(terraInspection.run_input_sha256, otherInspection.run_input_sha256);
});

test("local compilation reports the selected trace configuration and exact raw hash", async () => {
  const { manifest, routes } = await fixture();
  const { caseBytes, runBytes } = exactInputBytes(manifest, routes);
  const selected = rawRunFromArtifact(JSON.parse(runBytes.toString("utf8")));
  selected.run_id = "run-luna-selected";
  selected.provenance.model_config_requested = "gpt-5.6-luna";
  selected.provenance.reasoning_effort_requested = "low";
  const selectedBytes = Buffer.from(`${JSON.stringify(selected, null, 2)}\n`);

  const compiled = await compileBrowserWitnessFromBytes({
    caseBytes,
    runBytes: selectedBytes,
    subtle: webcrypto.subtle
  });

  assert.equal(compiled.source_run_id, "run-luna-selected");
  assert.equal(compiled.source_requested_model, "gpt-5.6-luna");
  assert.equal(compiled.source_requested_reasoning_effort, "low");
  assert.equal(compiled.source_model_invocation_logged, false);
  assert.equal(compiled.input_run_sha256, digest(selectedBytes));
  assert.equal(compiled.receipt.input_run_sha256, digest(selectedBytes));
});

test("the inspector and compiler agree when a noncritical miss still meets a lowered pass threshold", async () => {
  const { manifest, routes } = await fixture();
  const { caseBytes } = exactInputBytes(manifest, routes);
  const repairedRecord = manifest.files.find((record) => record.id === "repaired");
  const repairedArtifact = JSON.parse(
    await readFile(join(publicDir, repairedRecord.path), "utf8")
  );
  const caseData = JSON.parse(caseBytes.toString("utf8"));
  caseData.pass_threshold = 85;
  const run = rawRunFromArtifact(repairedArtifact);
  run.variant = "candidate";
  delete run.repair;
  run.decisions[0].actions = run.decisions[0].actions.filter(
    (action) => action !== "ask_recent_pregnancy"
  );
  const changedCaseBytes = Buffer.from(`${JSON.stringify(caseData, null, 2)}\n`);
  const changedRunBytes = Buffer.from(`${JSON.stringify(run, null, 2)}\n`);

  const inspection = await inspectBrowserRunFromBytes({
    caseBytes: changedCaseBytes,
    runBytes: changedRunBytes,
    subtle: webcrypto.subtle
  });

  assert.equal(inspection.evaluation.status, "pass");
  assert.equal(inspection.evaluation.score, 85);
  assert.deepEqual(inspection.evaluation.first_missed_contract, {
    id: "INV-01",
    deadline_minute: 0,
    critical: false
  });
  assert.equal(inspection.can_compile_failure, false);
  assert.match(inspection.compile_blocker, /fresh evaluation passes/i);
  await assert.rejects(
    compileBrowserWitnessFromBytes({
      caseBytes: changedCaseBytes,
      runBytes: changedRunBytes,
      subtle: webcrypto.subtle
    }),
    /fresh evaluation passes/i
  );
});

test("the inspector distinguishes control-only failures from passing runs", async () => {
  const { manifest, routes } = await fixture();
  const { caseBytes } = exactInputBytes(manifest, routes);
  const repairedRecord = manifest.files.find((record) => record.id === "repaired");
  const repairedArtifact = JSON.parse(
    await readFile(join(publicDir, repairedRecord.path), "utf8")
  );
  const run = rawRunFromArtifact(repairedArtifact);
  run.variant = "candidate";
  delete run.repair;
  run.decisions[0].fact_refs.push(
    "blood_pressure_168_112_authored_endpoint"
  );
  const changedRunBytes = Buffer.from(`${JSON.stringify(run, null, 2)}\n`);

  const inspection = await inspectBrowserRunFromBytes({
    caseBytes,
    runBytes: changedRunBytes,
    subtle: webcrypto.subtle
  });

  assert.equal(inspection.evaluation.status, "fail");
  assert.equal(inspection.evaluation.first_missed_contract, null);
  assert.equal(inspection.can_compile_failure, false);
  assert.match(inspection.compile_blocker, /failed action invariant/i);
  await assert.rejects(
    compileBrowserWitnessFromBytes({
      caseBytes,
      runBytes: changedRunBytes,
      subtle: webcrypto.subtle
    }),
    /failed action invariant/i
  );
});

test("the inspector reports repaired-variant and reduction-budget blockers before compilation", async () => {
  const { manifest, routes } = await fixture();
  const { caseBytes, runBytes } = exactInputBytes(manifest, routes);
  const repairedRecord = manifest.files.find((record) => record.id === "repaired");
  const repairedArtifact = JSON.parse(
    await readFile(join(publicDir, repairedRecord.path), "utf8")
  );
  const failedRepair = rawRunFromArtifact(JSON.parse(runBytes.toString("utf8")));
  failedRepair.run_id = "run-failed-repair-variant-test";
  failedRepair.variant = "repaired";
  failedRepair.repair = repairedArtifact.repair;
  const failedRepairBytes = Buffer.from(
    `${JSON.stringify(failedRepair, null, 2)}\n`
  );
  const repairedInspection = await inspectBrowserRunFromBytes({
    caseBytes,
    runBytes: failedRepairBytes,
    subtle: webcrypto.subtle
  });
  assert.equal(repairedInspection.evaluation.status, "fail");
  assert.equal(repairedInspection.can_compile_failure, false);
  assert.match(repairedInspection.compile_blocker, /declared as repaired/i);
  await assert.rejects(
    compileBrowserWitnessFromBytes({
      caseBytes,
      runBytes: failedRepairBytes,
      subtle: webcrypto.subtle
    }),
    /declared as repaired/i
  );

  const caseData = JSON.parse(caseBytes.toString("utf8"));
  caseData.timeline[0].facts_revealed.push(
    "extra_fact_01",
    "extra_fact_02",
    "extra_fact_03",
    "extra_fact_04",
    "extra_fact_05",
    "extra_fact_06",
    "extra_fact_07",
    "extra_fact_08"
  );
  const rawRun = rawRunFromArtifact(JSON.parse(runBytes.toString("utf8")));
  const expandedCaseBytes = Buffer.from(`${JSON.stringify(caseData, null, 2)}\n`);
  const rawRunBytes = Buffer.from(`${JSON.stringify(rawRun, null, 2)}\n`);
  const budgetInspection = await inspectBrowserRunFromBytes({
    caseBytes: expandedCaseBytes,
    runBytes: rawRunBytes,
    subtle: webcrypto.subtle
  });
  assert.equal(budgetInspection.evaluation.status, "fail");
  assert.equal(budgetInspection.can_compile_failure, false);
  assert.deepEqual(budgetInspection.evaluation.first_missed_contract, {
    id: "INV-02",
    deadline_minute: 2,
    critical: true
  });
  assert.match(budgetInspection.compile_blocker, /16-fact browser reduction limit/i);
  await assert.rejects(
    compileBrowserWitnessFromBytes({
      caseBytes: expandedCaseBytes,
      runBytes: rawRunBytes,
      subtle: webcrypto.subtle
    }),
    /16-fact browser reduction limit/i
  );
});

test("local model provenance fails closed on logged or malformed declarations", async () => {
  const { manifest, routes } = await fixture();
  const { caseBytes, runBytes } = exactInputBytes(manifest, routes);
  const missingModel = rawRunFromArtifact(JSON.parse(runBytes.toString("utf8")));
  missingModel.provenance.model_invocation_logged = true;
  delete missingModel.provenance.model_config_requested;
  await assert.rejects(
    inspectBrowserRunFromBytes({
      caseBytes,
      runBytes: Buffer.from(`${JSON.stringify(missingModel)}\n`),
      subtle: webcrypto.subtle
    }),
    /Logged model invocations must declare model_config_requested/
  );

  const malformedModel = rawRunFromArtifact(JSON.parse(runBytes.toString("utf8")));
  malformedModel.provenance.model_config_requested = 56;
  await assert.rejects(
    inspectBrowserRunFromBytes({
      caseBytes,
      runBytes: Buffer.from(`${JSON.stringify(malformedModel)}\n`),
      subtle: webcrypto.subtle
    }),
    /model_config_requested must be a non-empty string/
  );
});

test("local compilation accepts a raw run and freshly creates the evaluated artifact", async () => {
  const { manifest, routes } = await fixture();
  const { caseBytes, runBytes } = exactInputBytes(manifest, routes);
  const rawRun = rawRunFromArtifact(JSON.parse(runBytes.toString("utf8")));
  const local = await compileBrowserWitnessFromBytes({
    caseBytes,
    runBytes: Buffer.from(`${JSON.stringify(rawRun, null, 2)}\n`),
    subtle: webcrypto.subtle
  });
  const evaluated = JSON.parse(
    local.files.find((file) => file.path === "evaluated-run.json").contents
  );

  assert.equal(local.status, "compiled_red");
  assert.equal(evaluated.provenance_verification, "unverified_input_declaration");
  assert.equal(evaluated.evaluation.status, "fail");
  assert.equal(local.receipt.input_case_sha256, digest(caseBytes));
  assert.equal(local.receipt.input_run_sha256, digest(Buffer.from(`${JSON.stringify(rawRun, null, 2)}\n`)));
});

test("local compilation accepts a raw run carrying only the case identity pair", async () => {
  const { manifest, routes } = await fixture();
  const { caseBytes, runBytes } = exactInputBytes(manifest, routes);
  const artifact = JSON.parse(runBytes.toString("utf8"));
  const rawRun = rawRunFromArtifact(artifact);
  rawRun.case_id = artifact.case_id;
  rawRun.case_sha256 = artifact.case_sha256;

  const local = await compileBrowserWitnessFromBytes({
    caseBytes,
    runBytes: Buffer.from(`${JSON.stringify(rawRun, null, 2)}\n`),
    subtle: webcrypto.subtle
  });
  assert.equal(local.status, "compiled_red");
  assert.equal(local.source_run_id, rawRun.run_id);
});

test("bundle identity changes when run contents change under the same run id", async () => {
  const { manifest, routes } = await fixture();
  const { caseBytes, runBytes } = exactInputBytes(manifest, routes);
  const changed = JSON.parse(runBytes.toString("utf8"));
  changed.decisions[0].message += " ";
  const changedBytes = Buffer.from(`${JSON.stringify(changed, null, 2)}\n`);
  const [originalBundle, changedBundle] = await Promise.all([
    compileBrowserWitnessFromBytes({
      caseBytes,
      runBytes,
      subtle: webcrypto.subtle
    }),
    compileBrowserWitnessFromBytes({
      caseBytes,
      runBytes: changedBytes,
      subtle: webcrypto.subtle
    })
  ]);

  assert.equal(originalBundle.source_run_id, changedBundle.source_run_id);
  assert.notEqual(originalBundle.bundle_id, changedBundle.bundle_id);
  assert.notEqual(
    originalBundle.manifest_sha256,
    changedBundle.manifest_sha256
  );
});

test("the shared Node compiler requires a complete valid raw-input hash pair", async () => {
  const { manifest, routes } = await fixture();
  const { caseBytes, runBytes } = exactInputBytes(manifest, routes);
  const caseData = JSON.parse(caseBytes.toString("utf8"));
  const rawRun = rawRunFromArtifact(JSON.parse(runBytes.toString("utf8")));

  assert.throws(
    () => compileWitnessBundle(caseData, rawRun),
    /requires both inputCaseSha256 and inputRunSha256/
  );
  assert.throws(
    () =>
      compileWitnessBundle(caseData, rawRun, {
        inputCaseSha256: digest(caseBytes),
        inputRunSha256: "not-a-digest"
      }),
    /requires both inputCaseSha256 and inputRunSha256/
  );
});

test("local and Node compilation agree on a noncritical action failure", async () => {
  const { manifest, routes } = await fixture();
  const { caseBytes, runBytes } = exactInputBytes(manifest, routes);
  const caseData = JSON.parse(caseBytes.toString("utf8"));
  for (const rule of caseData.rules) rule.critical = false;
  const rawRun = rawRunFromArtifact(JSON.parse(runBytes.toString("utf8")));
  const changedCaseBytes = Buffer.from(`${JSON.stringify(caseData, null, 2)}\n`);
  const changedRunBytes = Buffer.from(`${JSON.stringify(rawRun, null, 2)}\n`);
  const local = await compileBrowserWitnessFromBytes({
    caseBytes: changedCaseBytes,
    runBytes: changedRunBytes,
    subtle: webcrypto.subtle
  });
  const node = compileWitnessBundle(caseData, rawRun, {
    startingFactScope: "failure_prefix",
    inputCaseSha256: digest(changedCaseBytes),
    inputRunSha256: digest(changedRunBytes)
  });

  assert.deepEqual(local.fresh_evaluation.critical_failures, []);
  assert.equal(local.target_rule_id, "INV-01");
  assert.equal(
    local.receipt.selected_rule_reason,
    "earliest failed action invariant"
  );
  assert.deepEqual(
    local.files,
    [...node.files.entries()].map(([path, contents]) => ({ path, contents }))
  );
});

test("local compilation rejects stale evaluated claims and passing runs", async () => {
  const { manifest, routes } = await fixture();
  const { caseBytes, runBytes } = exactInputBytes(manifest, routes);
  const stale = JSON.parse(runBytes.toString("utf8"));
  stale.evaluation.score -= 1;

  await assert.rejects(
    compileBrowserWitnessFromBytes({
      caseBytes,
      runBytes: Buffer.from(`${JSON.stringify(stale, null, 2)}\n`),
      subtle: webcrypto.subtle
    }),
    /disagrees with a fresh deterministic grade/
  );

  const repairedRecord = manifest.files.find((record) => record.id === "repaired");
  const repairedBytes = await readFile(join(publicDir, repairedRecord.path));
  await assert.rejects(
    compileBrowserWitnessFromBytes({
      caseBytes,
      runBytes: repairedBytes,
      subtle: webcrypto.subtle
    }),
    /fresh evaluation passes/i
  );
});

test("local compilation rejects declared patient data", async () => {
  const { manifest, routes } = await fixture();
  const { caseBytes, runBytes } = exactInputBytes(manifest, routes);
  const rawRun = rawRunFromArtifact(JSON.parse(runBytes.toString("utf8")));
  rawRun.provenance.contains_real_patient_data = true;

  await assert.rejects(
    compileBrowserWitnessFromBytes({
      caseBytes,
      runBytes: Buffer.from(`${JSON.stringify(rawRun)}\n`),
      subtle: webcrypto.subtle
    }),
    /contain no real patient data/
  );
});

test("local compilation fails before validation on unsafe byte and JSON budgets", async () => {
  const { manifest, routes } = await fixture();
  const { runBytes } = exactInputBytes(manifest, routes);
  await assert.rejects(
    compileBrowserWitnessFromBytes({
      caseBytes: Uint8Array.from([0xc3, 0x28]),
      runBytes,
      subtle: webcrypto.subtle
    }),
    /case\.json is not valid UTF-8/
  );
  await assert.rejects(
    compileBrowserWitnessFromBytes({
      caseBytes: Buffer.from("{not-json"),
      runBytes,
      subtle: webcrypto.subtle
    }),
    /case\.json is not valid JSON/
  );
  await assert.rejects(
    compileBrowserWitnessFromBytes({
      caseBytes: Buffer.alloc(MAX_LOCAL_INPUT_BYTES + 1, 0x20),
      runBytes,
      subtle: webcrypto.subtle
    }),
    /exceeds the 512 KiB local-input limit/
  );

  let tooDeep = 0;
  for (let index = 0; index < 34; index += 1) tooDeep = [tooDeep];
  await assert.rejects(
    compileBrowserWitnessFromBytes({
      caseBytes: Buffer.from(JSON.stringify(tooDeep)),
      runBytes,
      subtle: webcrypto.subtle
    }),
    /maximum JSON depth/
  );
  await assert.rejects(
    compileBrowserWitnessFromBytes({
      caseBytes: Buffer.from(JSON.stringify(Array(20_001).fill(0))),
      runBytes,
      subtle: webcrypto.subtle
    }),
    /20,000-node JSON limit/
  );
});

test("local compilation bounds browser reduction work", async () => {
  const { manifest, routes } = await fixture();
  const { caseBytes, runBytes } = exactInputBytes(manifest, routes);
  const caseData = JSON.parse(caseBytes.toString("utf8"));
  caseData.timeline[0].facts_revealed.push(
    "extra_fact_01",
    "extra_fact_02",
    "extra_fact_03",
    "extra_fact_04",
    "extra_fact_05",
    "extra_fact_06",
    "extra_fact_07",
    "extra_fact_08"
  );
  const rawRun = rawRunFromArtifact(JSON.parse(runBytes.toString("utf8")));

  await assert.rejects(
    compileBrowserWitnessFromBytes({
      caseBytes: Buffer.from(`${JSON.stringify(caseData, null, 2)}\n`),
      runBytes: Buffer.from(`${JSON.stringify(rawRun, null, 2)}\n`),
      subtle: webcrypto.subtle
    }),
    /exceeds the 16-fact browser reduction limit/
  );
});

test("browser compilation fails closed on tampered bytes", async () => {
  const { manifest, routes } = await fixture();
  const caseRecord = manifest.files.find((record) => record.id === "case");
  const tampered = new Map(routes);
  const caseData = JSON.parse(tampered.get(caseRecord.path).toString("utf8"));
  caseData.title = `${caseData.title} tampered`;
  tampered.set(
    caseRecord.path,
    Buffer.from(`${JSON.stringify(caseData, null, 2)}\n`, "utf8")
  );

  await assert.rejects(
    compileBrowserWitness({
      manifest,
      fetchImpl: fetchFrom(tampered),
      subtle: webcrypto.subtle,
      baseUrl: "https://witnesspatch.test/"
    }),
    /case (?:byte count|hash) drifted/
  );
});

test("browser compilation rejects a coordinated real-data declaration", async () => {
  const { manifest, routes } = await fixture();
  const baselineRecord = manifest.files.find((record) => record.id === "baseline");
  const changedRoutes = new Map(routes);
  const baseline = JSON.parse(
    changedRoutes.get(baselineRecord.path).toString("utf8")
  );
  baseline.provenance.contains_real_patient_data = true;
  const changedBytes = Buffer.from(`${JSON.stringify(baseline, null, 2)}\n`);
  changedRoutes.set(baselineRecord.path, changedBytes);
  const changedManifest = structuredClone(manifest);
  const changedRecord = changedManifest.files.find(
    (record) => record.id === "baseline"
  );
  changedRecord.bytes = changedBytes.byteLength;
  changedRecord.sha256 = digest(changedBytes);

  await assert.rejects(
    compileBrowserWitness({
      manifest: changedManifest,
      fetchImpl: fetchFrom(changedRoutes),
      subtle: webcrypto.subtle,
      baseUrl: "https://witnesspatch.test/"
    }),
    /synthetic unreviewed baseline boundary/
  );
});

test("browser and Node reject a manifest-rehashed invalid provenance type", async () => {
  const { manifest, routes } = await fixture();
  const changedManifest = structuredClone(manifest);
  const changedRoutes = new Map(routes);
  const baselineRecord = changedManifest.files.find(
    (record) => record.id === "baseline"
  );
  const baseline = JSON.parse(
    changedRoutes.get(baselineRecord.path).toString("utf8")
  );
  baseline.provenance.model_invocation_logged = "false";
  replaceManifestedJson(
    changedManifest,
    changedRoutes,
    "baseline",
    baseline
  );
  const caseRecord = changedManifest.files.find((record) => record.id === "case");
  const caseData = JSON.parse(changedRoutes.get(caseRecord.path).toString("utf8"));

  await assert.rejects(
    compileBrowserWitness({
      manifest: changedManifest,
      fetchImpl: fetchFrom(changedRoutes),
      subtle: webcrypto.subtle,
      baseUrl: "https://witnesspatch.test/"
    }),
    /Run schema validation failed/
  );
  assert.throws(
    () => compileWitnessBundle(caseData, baseline),
    /model_invocation_logged boolean/
  );
});

test("browser and Node reject a coordinated extra case property", async () => {
  const { manifest, routes } = await fixture();
  const changedManifest = structuredClone(manifest);
  const changedRoutes = new Map(routes);
  const caseRecord = changedManifest.files.find((record) => record.id === "case");
  const baselineRecord = changedManifest.files.find(
    (record) => record.id === "baseline"
  );
  const caseData = JSON.parse(changedRoutes.get(caseRecord.path).toString("utf8"));
  const baseline = JSON.parse(
    changedRoutes.get(baselineRecord.path).toString("utf8")
  );
  caseData.coordinated_extra_property = true;
  const changedCaseFingerprint = caseFingerprint(caseData);
  changedManifest.case_fingerprint = changedCaseFingerprint;
  baseline.case_sha256 = changedCaseFingerprint;
  replaceManifestedJson(changedManifest, changedRoutes, "case", caseData);
  replaceManifestedJson(
    changedManifest,
    changedRoutes,
    "baseline",
    baseline
  );

  await assert.rejects(
    compileBrowserWitness({
      manifest: changedManifest,
      fetchImpl: fetchFrom(changedRoutes),
      subtle: webcrypto.subtle,
      baseUrl: "https://witnesspatch.test/"
    }),
    /Case schema validation failed/
  );
  assert.throws(
    () => compileWitnessBundle(caseData, baseline),
    /Case schema validation failed/
  );
});

test("browser compilation fails closed when WebCrypto is unavailable", async () => {
  const { manifest, routes } = await fixture();
  await assert.rejects(
    compileBrowserWitness({
      manifest,
      fetchImpl: fetchFrom(routes),
      subtle: undefined,
      baseUrl: "https://witnesspatch.test/"
    }),
    /WebCrypto is unavailable/
  );
});
