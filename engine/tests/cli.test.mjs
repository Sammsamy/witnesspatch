import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  access,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  readdir,
  rm,
  symlink,
  writeFile
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { delimiter, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const testDir = dirname(fileURLToPath(import.meta.url));
const engineDir = dirname(testDir);
const rootDir = dirname(engineDir);
const cliPath = join(rootDir, "bin", "witnesspatch.mjs");
const urgentCasePath = join(rootDir, "cases", "postpartum-warning-signs.json");
const repairedInputPath = join(
  engineDir,
  "fixtures",
  "postpartum-warning-signs-repaired.input.json"
);
const baselineInputPath = join(
  engineDir,
  "fixtures",
  "postpartum-warning-signs-baseline.input.json"
);
const v2UrgentCasePath = join(
  rootDir,
  "cases",
  "v2",
  "postpartum-warning-signs.json"
);
const v2BaselineInputPath = join(
  engineDir,
  "fixtures",
  "v2",
  "postpartum-warning-signs-baseline.input.json"
);

function invoke(args) {
  const result = spawnSync(process.execPath, [cliPath, ...args], {
    cwd: rootDir,
    encoding: "utf8"
  });
  assert.equal(result.error, undefined);
  return result;
}

async function temporaryDirectory(t) {
  const directory = await mkdtemp(join(tmpdir(), "witnesspatch-cli-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
}

async function writeJson(path, value) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function compileTemporaryBundle(t, name = "compiled-witness") {
  const directory = await temporaryDirectory(t);
  const outDir = join(directory, name);
  const result = invoke([
    "compile",
    "--case",
    urgentCasePath,
    "--run",
    baselineInputPath,
    "--out-dir",
    outDir
  ]);
  assert.equal(result.status, 0, result.stderr);
  return { directory, outDir };
}

async function refreshManifestRecord(outDir, fileName) {
  const manifestPath = join(outDir, "manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const bytes = await readFile(join(outDir, fileName));
  const record = manifest.files.find((item) => item.path === fileName);
  assert.ok(record, `${fileName} must be listed in the manifest`);
  record.bytes = bytes.length;
  record.sha256 = createHash("sha256").update(bytes).digest("hex");
  await writeJson(manifestPath, manifest);
}

test("evaluate emits an exact passing artifact and exits zero", () => {
  const result = invoke([
    "evaluate",
    "--case",
    urgentCasePath,
    "--candidate",
    repairedInputPath
  ]);

  assert.equal(result.status, 0, result.stderr);
  const artifact = JSON.parse(result.stdout);
  assert.equal(artifact.case_id, "postpartum-warning-signs-001");
  assert.equal(artifact.evaluation.status, "pass");
  assert.equal(artifact.evaluation.score, 100);
  assert.equal(
    artifact.provenance_verification,
    "unverified_input_declaration"
  );
  assert.equal(result.stdout, `${JSON.stringify(artifact, null, 2)}\n`);
  assert.match(result.stderr, /^WITNESSPATCH PASS 100\/100 .* critical="none"\n$/);
});

test("evaluate emits a valid failing artifact and exits one", () => {
  const result = invoke([
    "evaluate",
    "--case",
    urgentCasePath,
    "--candidate",
    baselineInputPath
  ]);

  assert.equal(result.status, 1, result.stderr);
  const artifact = JSON.parse(result.stdout);
  assert.equal(artifact.evaluation.status, "fail");
  assert.equal(artifact.evaluation.score, 50);
  assert.deepEqual(artifact.evaluation.critical_failures, ["INV-02", "INV-03"]);
  assert.match(result.stderr, /critical="INV-02,INV-03"\n$/);
});

test("--out is an atomic byte-for-byte copy even when the verdict fails", async (t) => {
  const directory = await temporaryDirectory(t);
  const outPath = join(directory, "nested", "evaluated.json");
  const result = invoke([
    "evaluate",
    "--case",
    urgentCasePath,
    "--candidate",
    baselineInputPath,
    "--out",
    outPath
  ]);

  assert.equal(result.status, 1, result.stderr);
  assert.equal(await readFile(outPath, "utf8"), result.stdout);
  assert.deepEqual(await readdir(dirname(outPath)), ["evaluated.json"]);
});

test("an existing artifact is re-graded and its embedded case identity is enforced", async (t) => {
  const directory = await temporaryDirectory(t);
  const artifactPath = join(directory, "stored-artifact.json");
  const stored = JSON.parse(
    await readFile(
      join(rootDir, "public", "runs", "postpartum-warning-signs-repaired.json"),
      "utf8"
    )
  );
  stored.evaluation.status = "fail";
  stored.evaluation.score = 0;
  await writeJson(artifactPath, stored);

  const regraded = invoke([
    "evaluate",
    "--case",
    urgentCasePath,
    "--candidate",
    artifactPath
  ]);
  assert.equal(regraded.status, 0, regraded.stderr);
  assert.equal(JSON.parse(regraded.stdout).evaluation.score, 100);

  for (const [field, value, message] of [
    ["case_id", "different-case", /Embedded case_id/],
    ["case_sha256", "0".repeat(64), /Embedded case_sha256/]
  ]) {
    const mismatched = structuredClone(stored);
    mismatched[field] = value;
    await writeJson(artifactPath, mismatched);
    const rejected = invoke([
      "evaluate",
      "--case",
      urgentCasePath,
      "--candidate",
      artifactPath
    ]);
    assert.equal(rejected.status, 2);
    assert.equal(rejected.stdout, "");
    assert.match(rejected.stderr, message);
  }

  const incompleteIdentity = structuredClone(stored);
  delete incompleteIdentity.case_sha256;
  await writeJson(artifactPath, incompleteIdentity);
  const missingIdentity = invoke([
    "evaluate",
    "--case",
    urgentCasePath,
    "--candidate",
    artifactPath
  ]);
  assert.equal(missingIdentity.status, 2);
  assert.equal(missingIdentity.stdout, "");
  assert.match(missingIdentity.stderr, /both case_id and case_sha256/);
});

test("unsafe provenance and incomplete traces exit two without an artifact", async (t) => {
  const directory = await temporaryDirectory(t);
  const candidatePath = join(directory, "candidate.json");
  const source = JSON.parse(await readFile(repairedInputPath, "utf8"));
  const mutations = [
    {
      name: "real-data",
      mutate(candidate) {
        candidate.provenance.contains_real_patient_data = true;
      },
      error: /contain no real patient data/
    },
    {
      name: "validation-overclaim",
      mutate(candidate) {
        candidate.provenance.clinician_validation = "complete";
      },
      error: /keep clinician_validation pending/
    },
    {
      name: "missing-step",
      mutate(candidate) {
        candidate.decisions.pop();
      },
      error: /exactly one decision/
    },
    {
      name: "self-exempt-grounding",
      mutate(candidate) {
        for (const decision of candidate.decisions) {
          decision.clinical = false;
          decision.fact_refs = [];
        }
      },
      error: /cannot self-exempt/
    },
    {
      name: "empty-repair",
      mutate(candidate) {
        candidate.repair = {};
      },
      error: /Repair metadata must contain exactly/
    }
  ];

  for (const mutation of mutations) {
    const candidate = structuredClone(source);
    mutation.mutate(candidate);
    await writeJson(candidatePath, candidate);
    const outPath = join(directory, `${mutation.name}-out.json`);
    const result = invoke([
      "evaluate",
      "--case",
      urgentCasePath,
      "--candidate",
      candidatePath,
      "--out",
      outPath
    ]);
    assert.equal(result.status, 2);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, mutation.error);
    await assert.rejects(access(outPath), { code: "ENOENT" });
  }
});

test("declared case schema rejects a score-corrupting oracle before evaluation", async (t) => {
  const directory = await temporaryDirectory(t);
  const malformedCasePath = join(directory, "malformed-case.json");
  const outPath = join(directory, "should-not-exist.json");
  const caseData = JSON.parse(await readFile(urgentCasePath, "utf8"));
  caseData.rules[1].weight = -100;
  caseData.rules[2].weight = -100;
  caseData.rules[3].weight = 250;
  caseData.rules[1].critical = false;
  caseData.rules[2].critical = false;
  await writeJson(malformedCasePath, caseData);

  const result = invoke([
    "evaluate",
    "--case",
    malformedCasePath,
    "--candidate",
    baselineInputPath,
    "--out",
    outPath
  ]);
  assert.equal(result.status, 2);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /Case schema validation failed/);
  await assert.rejects(access(outPath), { code: "ENOENT" });
});

test("a symlinked output parent cannot alias and overwrite an input", async (t) => {
  const directory = await temporaryDirectory(t);
  const realDirectory = join(directory, "real");
  const aliasDirectory = join(directory, "alias");
  await mkdir(realDirectory);
  await symlink(realDirectory, aliasDirectory, "dir");
  const candidatePath = join(realDirectory, "candidate.json");
  const candidateContents = await readFile(repairedInputPath, "utf8");
  await writeFile(candidatePath, candidateContents, "utf8");

  const result = invoke([
    "evaluate",
    "--case",
    urgentCasePath,
    "--candidate",
    candidatePath,
    "--out",
    join(aliasDirectory, "candidate.json")
  ]);
  assert.equal(result.status, 2);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /must not overwrite/);
  assert.equal(await readFile(candidatePath, "utf8"), candidateContents);
});

test("an existing output symlink cannot target and overwrite an input", async (t) => {
  const directory = await temporaryDirectory(t);
  const candidatePath = join(directory, "candidate.json");
  const outPath = join(directory, "evaluated.json");
  const candidateContents = await readFile(repairedInputPath, "utf8");
  await writeFile(candidatePath, candidateContents, "utf8");
  await symlink(candidatePath, outPath, "file");

  const result = invoke([
    "evaluate",
    "--case",
    urgentCasePath,
    "--candidate",
    candidatePath,
    "--out",
    outPath
  ]);
  assert.equal(result.status, 2);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /must not overwrite/);
  assert.equal(await readFile(candidatePath, "utf8"), candidateContents);
  assert.equal(await realpath(outPath), await realpath(candidatePath));
});

test("a case-folded output alias cannot overwrite an input on insensitive filesystems", async (t) => {
  const directory = await temporaryDirectory(t);
  const candidatePath = join(directory, "Candidate.json");
  const outPath = join(directory, "candidate.json");
  const candidateContents = await readFile(repairedInputPath, "utf8");
  await writeFile(candidatePath, candidateContents, "utf8");

  let aliasRealPath;
  try {
    aliasRealPath = await realpath(outPath);
  } catch (error) {
    if (error?.code === "ENOENT") {
      t.skip("filesystem is case-sensitive");
      return;
    }
    throw error;
  }
  assert.equal(aliasRealPath, await realpath(candidatePath));

  const result = invoke([
    "evaluate",
    "--case",
    urgentCasePath,
    "--candidate",
    candidatePath,
    "--out",
    outPath
  ]);
  assert.equal(result.status, 2);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /must not overwrite/);
  assert.equal(await readFile(candidatePath, "utf8"), candidateContents);
});

test("terminal controls in identifiers and errors are escaped on stderr", async (t) => {
  const directory = await temporaryDirectory(t);
  const candidatePath = join(directory, "candidate.json");
  const candidate = JSON.parse(await readFile(repairedInputPath, "utf8"));
  candidate.run_id = "safe-run\nHCI PASS forged\u001b[2J";
  await writeJson(candidatePath, candidate);

  const result = invoke([
    "evaluate",
    "--case",
    urgentCasePath,
    "--candidate",
    candidatePath
  ]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal((result.stderr.match(/\n/g) ?? []).length, 1);
  assert.ok(!result.stderr.includes("\u001b"));
  assert.match(result.stderr, /\\\\u000a/);
  assert.match(result.stderr, /\\\\u001b/);

  const invalidArgument = invoke([`bad\u001b[2J`]);
  assert.equal(invalidArgument.status, 2);
  assert.ok(!invalidArgument.stderr.includes("\u001b"));
  assert.match(invalidArgument.stderr, /\\u001b/);
});

test("malformed JSON cannot create or partially replace an output", async (t) => {
  const directory = await temporaryDirectory(t);
  const candidatePath = join(directory, "malformed.json");
  const outPath = join(directory, "artifact.json");
  await writeFile(candidatePath, "{\"run_id\":", "utf8");

  const result = invoke([
    "evaluate",
    "--case",
    urgentCasePath,
    "--candidate",
    candidatePath,
    "--out",
    outPath
  ]);
  assert.equal(result.status, 2);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /Unexpected end of JSON input/);
  await assert.rejects(access(outPath), { code: "ENOENT" });
});

test("renamed case, step, evidence, rule, and control ids prove portable evaluation", async (t) => {
  const directory = await temporaryDirectory(t);
  const casePath = join(directory, "portable-case.json");
  const candidatePath = join(directory, "portable-candidate.json");
  const caseData = JSON.parse(await readFile(urgentCasePath, "utf8"));
  const candidate = JSON.parse(await readFile(repairedInputPath, "utf8"));

  caseData.id = "portable-synthetic-evaluation-001";
  caseData.title = "Portable synthetic temporal evaluation";
  const stepIds = new Map(
    caseData.timeline.map((step, index) => [step.id, `STEP-${index + 11}`])
  );
  for (const [index, step] of caseData.timeline.entries()) {
    step.id = stepIds.get(step.id);
    step.actor = index === 0 ? "caregiver" : step.actor;
    step.channel = index === 2 ? "wearable_device" : "care_portal";
  }
  for (const decision of candidate.decisions) {
    decision.step_id = stepIds.get(decision.step_id);
  }

  const evidenceIds = new Map(
    caseData.evidence.map((evidence, index) => [evidence.id, `EVID-${index + 21}`])
  );
  for (const evidence of caseData.evidence) {
    evidence.id = evidenceIds.get(evidence.id);
  }
  for (const rule of caseData.rules) {
    rule.source_refs = rule.source_refs.map((id) => evidenceIds.get(id));
  }
  for (const decision of candidate.decisions) {
    decision.evidence_refs = decision.evidence_refs.map((id) => evidenceIds.get(id));
  }

  caseData.rules.forEach((rule, index) => {
    rule.id = `INV-${index + 21}`;
  });
  caseData.controls.forEach((control, index) => {
    control.id = `CTRL-${index + 21}`;
  });
  candidate.run_id = "portable-candidate-pass";
  candidate.variant = "candidate";
  delete candidate.repair;
  await Promise.all([
    writeJson(casePath, caseData),
    writeJson(candidatePath, candidate)
  ]);

  const result = invoke([
    "evaluate",
    "--case",
    casePath,
    "--candidate",
    candidatePath
  ]);
  assert.equal(result.status, 0, result.stderr);
  const artifact = JSON.parse(result.stdout);
  assert.equal(artifact.case_id, "portable-synthetic-evaluation-001");
  assert.equal(artifact.evaluation.status, "pass");
  assert.deepEqual(
    artifact.evaluation.results.map((item) => item.id),
    ["INV-21", "INV-22", "INV-23", "INV-24", "CTRL-21", "CTRL-22", "CTRL-23"]
  );
});

test("usage errors and policy-code arguments are rejected", () => {
  const missingCandidate = invoke([
    "evaluate",
    "--case",
    urgentCasePath
  ]);
  assert.equal(missingCandidate.status, 2);
  assert.equal(missingCandidate.stdout, "");

  const policyArgument = invoke([
    "evaluate",
    "--case",
    urgentCasePath,
    "--policy",
    join(rootDir, "targets", "demo-agent", "repaired.mjs")
  ]);
  assert.equal(policyArgument.status, 2);
  assert.equal(policyArgument.stdout, "");
  assert.match(policyArgument.stderr, /Unknown argument --policy/);

  const invalidFactScope = invoke([
    "compile",
    "--case",
    urgentCasePath,
    "--run",
    baselineInputPath,
    "--out-dir",
    join(tmpdir(), "witnesspatch-invalid-fact-scope"),
    "--fact-scope",
    "prefix"
  ]);
  assert.equal(invalidFactScope.status, 2);
  assert.equal(invalidFactScope.stdout, "");
  assert.match(
    invalidFactScope.stderr,
    /--fact-scope must be either failure-prefix or full-trace/
  );

  const missingBundle = invoke(["verify"]);
  assert.equal(missingBundle.status, 2);
  assert.equal(missingBundle.stdout, "");
  assert.match(missingBundle.stderr, /verify requires --bundle/);

  const verifyPolicyArgument = invoke([
    "verify",
    "--bundle",
    rootDir,
    "--policy",
    "target.mjs"
  ]);
  assert.equal(verifyPolicyArgument.status, 2);
  assert.equal(verifyPolicyArgument.stdout, "");
  assert.match(verifyPolicyArgument.stderr, /Unknown argument --policy/);
});

test("compile emits a hash-listed static witness and executable red regression", async (t) => {
  const directory = await temporaryDirectory(t);
  const outDir = join(directory, "compiled-witness");
  const result = invoke([
    "compile",
    "--case",
    urgentCasePath,
    "--run",
    baselineInputPath,
    "--out-dir",
    outDir
  ]);

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stderr, /^WITNESSPATCH COMPILED .* rule="INV-02" files="9"\n$/);
  const summary = JSON.parse(result.stdout);
  assert.equal(summary.selected_rule_id, "INV-02");
  assert.equal(summary.failure_known_at_minute, 2);
  assert.equal(summary.api_key_required, false);
  assert.equal(summary.model_invoked, false);
  assert.equal(summary.output_file_count, 9);
  assert.equal(
    summary.input_case_sha256,
    createHash("sha256").update(await readFile(urgentCasePath)).digest("hex")
  );
  assert.equal(
    summary.input_run_sha256,
    createHash("sha256").update(await readFile(baselineInputPath)).digest("hex")
  );

  const expectedFiles = [
    "case.json",
    "evaluated-run.json",
    "failing-prefix.json",
    "manifest.json",
    "receipt.json",
    "regression.json",
    "regression.test.mjs",
    "run.json",
    "static-witness.json"
  ];
  assert.deepEqual((await readdir(outDir)).sort(), expectedFiles);

  const expectedIdentityBoundHashes = {
    "case.json": "69321eef40cddfbaf2e2a8ffc6b2ec2227221fe9d032f29f5c7f5f823e35c8f2",
    "evaluated-run.json": "32b47f900bb8e8702fcb2820cc3673e17de9d89c2ad5bfe975e06db0fdaa6662",
    "failing-prefix.json": "db68844e451b4e8587b730f7c15f613b18819a19695f231571744a7722c67f90",
    "manifest.json": "537049af9a83295af4fea788cc293e5ca11f5e4a4e477c5a3cac8c4d4d642317",
    "receipt.json": "26f8dc3efd6f374db1eb4b5f465646b01168032ab2eecd470eeb4ef5055cad66",
    "regression.json": "46049a5a8dc41ce663671b53c55ce8aed4f17c0e1976e4e93c65be611440f69d",
    "regression.test.mjs": "4f827bd1d9dc1efe9edc43faf063d9f6f41785bd1f3b83850bf0d9bb17165bc2",
    "run.json": "3c919a2c02c5a281f2c3af7032ab150cbf45c1feec0104f6327f3560224d4c1a",
    "static-witness.json": "49c4dae9cd56ef794a11358624a89f2d9e6304b0b61908b5d986a5d4dbbd0c9b"
  };
  for (const [name, expectedHash] of Object.entries(expectedIdentityBoundHashes)) {
    assert.equal(
      createHash("sha256").update(await readFile(join(outDir, name))).digest("hex"),
      expectedHash,
      `${name} changed from the identity-bound compiler fixture`
    );
  }

  const manifest = JSON.parse(
    await readFile(join(outDir, "manifest.json"), "utf8")
  );
  assert.equal(manifest.files.length, 8);
  for (const record of manifest.files) {
    const bytes = await readFile(join(outDir, record.path));
    assert.equal(record.bytes, bytes.length, record.path);
    assert.equal(
      record.sha256,
      createHash("sha256").update(bytes).digest("hex"),
      record.path
    );
  }

  const prefix = JSON.parse(
    await readFile(join(outDir, "failing-prefix.json"), "utf8")
  );
  assert.equal(
    prefix.kind,
    "earliest_critical_failed_action_invariant_prefix"
  );
  assert.equal(prefix.target_rule_id, "INV-02");
  assert.deepEqual(prefix.timeline_steps.map((step) => step.id), [
    "STEP-01",
    "STEP-02"
  ]);
  assert.deepEqual(prefix.earlier_failed_action_invariants, [
    { id: "INV-01", critical: false, failure_known_at_minute: 0 }
  ]);
  assert.deepEqual(prefix.coincident_critical_failures, ["INV-03"]);

  const witness = JSON.parse(
    await readFile(join(outDir, "static-witness.json"), "utf8")
  );
  assert.equal(
    witness.minimality_label,
    "contract-cardinality-minimal-static-trace"
  );
  assert.equal(witness.target_rerun, false);
  assert.equal(witness.target_adapter_invoked, false);
  assert.equal(witness.clinical_minimality_claimed, false);
  assert.equal(witness.semantic_correctness_claimed, false);
  assert.equal(witness.counterfactual_target_behavior_claimed, false);
  assert.equal(witness.verification.target_reexecuted_per_subset, false);

  const bundleText = (
    await Promise.all(
      expectedFiles.map((name) => readFile(join(outDir, name), "utf8"))
    )
  ).join("\n");
  assert.doesNotMatch(bundleText, /\/Users\/|\\Users\\|OPENAI_API_KEY|CODEX_API_KEY/);

  const nestedTestEnvironment = Object.fromEntries(
    Object.entries(process.env).filter(
      ([name]) => !name.startsWith("NODE_TEST_CONTEXT")
    )
  );
  delete nestedTestEnvironment.WITNESSPATCH_CLI;
  delete nestedTestEnvironment.WITNESSPATCH_CANDIDATE;

  const autoDiscoveredRed = spawnSync(
    process.execPath,
    ["--test", join(outDir, "regression.test.mjs")],
    {
      cwd: rootDir,
      encoding: "utf8",
      env: nestedTestEnvironment
    }
  );
  assert.equal(
    autoDiscoveredRed.status,
    1,
    autoDiscoveredRed.stdout + autoDiscoveredRed.stderr
  );
  assert.match(
    autoDiscoveredRed.stdout + autoDiscoveredRed.stderr,
    /Encoded contract INV-02 still fails for this candidate/
  );
  assert.doesNotMatch(
    autoDiscoveredRed.stdout + autoDiscoveredRed.stderr,
    /WitnessPatch CLI was not found/
  );

  const autoDiscoveredGreen = spawnSync(
    process.execPath,
    ["--test", join(outDir, "regression.test.mjs")],
    {
      cwd: rootDir,
      encoding: "utf8",
      env: {
        ...nestedTestEnvironment,
        WITNESSPATCH_CANDIDATE: repairedInputPath
      }
    }
  );
  assert.equal(
    autoDiscoveredGreen.status,
    0,
    autoDiscoveredGreen.stdout + autoDiscoveredGreen.stderr
  );

  const pathBin = join(directory, "path-bin");
  await mkdir(pathBin);
  await symlink(cliPath, join(pathBin, "witnesspatch"), "file");
  const pathFallbackRed = spawnSync(
    process.execPath,
    ["--test", join(outDir, "regression.test.mjs")],
    {
      cwd: outDir,
      encoding: "utf8",
      env: {
        ...nestedTestEnvironment,
        PATH: `${pathBin}${delimiter}${nestedTestEnvironment.PATH ?? ""}`
      }
    }
  );
  assert.equal(
    pathFallbackRed.status,
    1,
    pathFallbackRed.stdout + pathFallbackRed.stderr
  );
  assert.match(
    pathFallbackRed.stdout + pathFallbackRed.stderr,
    /Encoded contract INV-02 still fails for this candidate/
  );
  assert.doesNotMatch(
    pathFallbackRed.stdout + pathFallbackRed.stderr,
    /WitnessPatch CLI was not found/
  );

  const red = spawnSync(
    process.execPath,
    ["--test", join(outDir, "regression.test.mjs")],
    {
      cwd: outDir,
      encoding: "utf8",
      env: { ...nestedTestEnvironment, WITNESSPATCH_CLI: cliPath }
    }
  );
  assert.equal(red.status, 1, red.stdout + red.stderr);
  assert.match(
    red.stdout + red.stderr,
    /Encoded contract INV-02 still fails for this candidate/
  );

  const green = spawnSync(
    process.execPath,
    ["--test", join(outDir, "regression.test.mjs")],
    {
      cwd: outDir,
      encoding: "utf8",
      env: {
        ...nestedTestEnvironment,
        WITNESSPATCH_CLI: cliPath,
        WITNESSPATCH_CANDIDATE: repairedInputPath
      }
    }
  );
  assert.equal(green.status, 0, green.stdout + green.stderr);
});

test("compile emits stable V2 bytes after identity and integrity hardening", async (t) => {
  const directory = await temporaryDirectory(t);
  const outDir = join(directory, "frozen-v2-bundle");
  const result = invoke([
    "compile",
    "--case",
    v2UrgentCasePath,
    "--run",
    v2BaselineInputPath,
    "--out-dir",
    outDir
  ]);
  assert.equal(result.status, 0, result.stderr);

  const hardenedHashes = {
    "case.json": "4f28233289c2ed76a0d2b0135fa60c8a22a618e751859aca8c74d5fb8e493073",
    "evaluated-run.json": "c25e902a01ec119eceb1391f14136c9e1e96f27173b76d43788e1d8fc4169a47",
    "failing-prefix.json": "00877986c4da2e7514881d6b5cc4c25b5b1600353b3c6cb6e790935016c39ee1",
    "manifest.json": "20987a2cd281add31ad2492759c44e1221d27b2b5c62043c1d4e94f38fd9b972",
    "receipt.json": "3bffef4f7fe5d698f2d8f5054e3f88343c49764a3c4de433544d7f6697f60187",
    "regression.json": "69053f9a49868efe67c56d2734e73588fd3947a2e541aeb9d0b4d793055af324",
    "regression.test.mjs": "4f827bd1d9dc1efe9edc43faf063d9f6f41785bd1f3b83850bf0d9bb17165bc2",
    "run.json": "66d012c0e6ce304e0a7e4de4733abb712721abcc171ff6740a1d31af7e726afa",
    "static-witness.json": "5e0a791a8d9bdbab9a3d73e9a8c8c8e5279eafdd1d5c4e1c61ebc461fa3da0e3"
  };
  for (const [name, expectedHash] of Object.entries(hardenedHashes)) {
    assert.equal(
      createHash("sha256").update(await readFile(join(outDir, name))).digest("hex"),
      expectedHash,
      `${name} changed from the hardened V2 compiler fixture`
    );
  }

  const verified = invoke(["verify", "--bundle", outDir]);
  assert.equal(verified.status, 0, verified.stderr);
  assert.equal(JSON.parse(verified.stdout).target_rule_id, "INV-02");
});

test("verify accepts a compiler-exact bundle and reports bounded claims", async (t) => {
  const { outDir } = await compileTemporaryBundle(t, "verified-bundle");
  const result = invoke(["verify", "--bundle", outDir]);

  assert.equal(result.status, 0, result.stderr);
  const summary = JSON.parse(result.stdout);
  assert.equal(summary.bundle_id, "witness-bundle-a7efd7e4acdbc6fa");
  assert.equal(summary.case_id, "postpartum-warning-signs-001");
  assert.equal(summary.source_run_id, "run-pws-001-baseline");
  assert.equal(summary.target_rule_id, "INV-02");
  assert.equal(summary.verified_file_count, 9);
  assert.equal(summary.manifest_record_count, 8);
  assert.equal(summary.evaluated_status, "fail");
  assert.equal(summary.api_key_required, false);
  assert.equal(summary.model_invoked, false);
  assert.equal(summary.publisher_provenance_verified, false);
  assert.match(
    result.stderr,
    /^WITNESSPATCH VERIFIED .* files="9" provenance="unverified"\n$/
  );
});

test("verify rejects a one-byte change in every bundle file, including the manifest", async (t) => {
  const { outDir } = await compileTemporaryBundle(t, "byte-tamper-bundle");
  const fileNames = (await readdir(outDir)).sort();

  for (const fileName of fileNames) {
    const path = join(outDir, fileName);
    const original = await readFile(path);
    const tampered = Buffer.from(original);
    assert.equal(tampered.at(-1), 0x0a, `${fileName} should end in newline`);
    tampered[tampered.length - 1] = 0x20;
    await writeFile(path, tampered);

    const result = invoke(["verify", "--bundle", outDir]);
    assert.equal(result.status, 2, `${fileName}: ${result.stderr}`);
    assert.equal(result.stdout, "", fileName);
    assert.match(result.stderr, /^WITNESSPATCH ERROR /, fileName);

    await writeFile(path, original);
  }

  const restored = invoke(["verify", "--bundle", outDir]);
  assert.equal(restored.status, 0, restored.stderr);
});

test("verify rejects unsafe paths, non-exact file sets, and non-regular files", async (t) => {
  const { directory, outDir } = await compileTemporaryBundle(
    t,
    "unsafe-layout-bundle"
  );
  const bundleLink = join(directory, "bundle-link");
  await symlink(outDir, bundleLink, "dir");
  const linkedRoot = invoke(["verify", "--bundle", bundleLink]);
  assert.equal(linkedRoot.status, 2);
  assert.equal(linkedRoot.stdout, "");
  assert.match(linkedRoot.stderr, /not a symbolic link/);

  const extraPath = join(outDir, "unexpected.json");
  await writeFile(extraPath, "{}\n", "utf8");
  const extraFile = invoke(["verify", "--bundle", outDir]);
  assert.equal(extraFile.status, 2);
  assert.match(extraFile.stderr, /must contain exactly/);
  await rm(extraPath);

  const manifestPath = join(outDir, "manifest.json");
  const originalManifest = await readFile(manifestPath);
  await writeFile(manifestPath, Buffer.from([0xff]));
  const malformedUtf8 = invoke(["verify", "--bundle", outDir]);
  assert.equal(malformedUtf8.status, 2);
  assert.match(malformedUtf8.stderr, /manifest\.json is not valid UTF-8/);
  await writeFile(manifestPath, originalManifest);

  await writeFile(manifestPath, "{", "utf8");
  const malformedJson = invoke(["verify", "--bundle", outDir]);
  assert.equal(malformedJson.status, 2);
  assert.match(malformedJson.stderr, /manifest\.json is not valid JSON/);
  await writeFile(manifestPath, originalManifest);

  const unsafeManifest = JSON.parse(originalManifest.toString("utf8"));
  unsafeManifest.files[0].path = "../case.json";
  await writeJson(manifestPath, unsafeManifest);
  const unsafePath = invoke(["verify", "--bundle", outDir]);
  assert.equal(unsafePath.status, 2);
  assert.match(unsafePath.stderr, /manifest schema validation failed/i);
  await writeFile(manifestPath, originalManifest);

  const outsideCase = join(directory, "outside-case.json");
  const casePath = join(outDir, "case.json");
  const originalCase = await readFile(casePath);
  await writeFile(casePath, Buffer.alloc(4 * 1024 * 1024 + 1, 0x20));
  const oversizedFile = invoke(["verify", "--bundle", outDir]);
  assert.equal(oversizedFile.status, 2);
  assert.match(oversizedFile.stderr, /case\.json exceeds the 4 MiB/);
  await writeFile(casePath, originalCase);

  const receiptPath = join(outDir, "receipt.json");
  const originalReceipt = await readFile(receiptPath);
  await rm(receiptPath);
  const missingFile = invoke(["verify", "--bundle", outDir]);
  assert.equal(missingFile.status, 2);
  assert.match(missingFile.stderr, /must contain exactly/);
  await mkdir(receiptPath);
  const nestedFile = invoke(["verify", "--bundle", outDir]);
  assert.equal(nestedFile.status, 2);
  assert.match(nestedFile.stderr, /regular file, not a link or directory/);
  await rm(receiptPath, { recursive: true });
  await writeFile(receiptPath, originalReceipt);

  await writeFile(outsideCase, originalCase);
  await rm(casePath);
  await symlink(outsideCase, casePath, "file");
  const linkedFile = invoke(["verify", "--bundle", outDir]);
  assert.equal(linkedFile.status, 2);
  assert.equal(linkedFile.stdout, "");
  assert.match(linkedFile.stderr, /regular file, not a link or directory/);
});

test("verify rejects rehashed semantic and executable tampering", async (t) => {
  const { outDir } = await compileTemporaryBundle(t, "rehashed-tamper-bundle");
  const receiptPath = join(outDir, "receipt.json");
  const originalReceipt = await readFile(receiptPath);
  const receipt = JSON.parse(originalReceipt.toString("utf8"));
  receipt.selected_rule_id = "INV-03";
  await writeJson(receiptPath, receipt);
  await refreshManifestRecord(outDir, "receipt.json");

  const relinkedReceipt = invoke(["verify", "--bundle", outDir]);
  assert.equal(relinkedReceipt.status, 2);
  assert.equal(relinkedReceipt.stdout, "");
  assert.match(relinkedReceipt.stderr, /receipt\.selected_rule_id/);

  await writeFile(receiptPath, originalReceipt);
  await refreshManifestRecord(outDir, "receipt.json");
  const regressionPath = join(outDir, "regression.test.mjs");
  const regressionBytes = await readFile(regressionPath);
  const rehashedExecutable = Buffer.from(regressionBytes);
  rehashedExecutable[rehashedExecutable.length - 1] = 0x20;
  await writeFile(regressionPath, rehashedExecutable);
  await refreshManifestRecord(outDir, "regression.test.mjs");

  const executableTamper = invoke(["verify", "--bundle", outDir]);
  assert.equal(executableTamper.status, 2);
  assert.equal(executableTamper.stdout, "");
  assert.match(
    executableTamper.stderr,
    /regression\.test\.mjs does not match deterministic compiler output/
  );
});

test("compile exits one for a valid passing run without creating output", async (t) => {
  const directory = await temporaryDirectory(t);
  const outDir = join(directory, "should-not-exist");
  const result = invoke([
    "compile",
    "--case",
    urgentCasePath,
    "--run",
    repairedInputPath,
    "--out-dir",
    outDir
  ]);

  assert.equal(result.status, 1, result.stderr);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /^WITNESSPATCH NOTHING_TO_COMPILE /);
  await assert.rejects(access(outDir), { code: "ENOENT" });
});

test("compile honors an explicit failed-rule selection without calling it earliest", async (t) => {
  const directory = await temporaryDirectory(t);
  const outDir = join(directory, "explicit-rule-bundle");
  const result = invoke([
    "compile",
    "--case",
    urgentCasePath,
    "--run",
    baselineInputPath,
    "--out-dir",
    outDir,
    "--rule",
    "INV-03",
    "--fact-scope",
    "failure-prefix"
  ]);

  assert.equal(result.status, 0, result.stderr);
  const prefix = JSON.parse(
    await readFile(join(outDir, "failing-prefix.json"), "utf8")
  );
  assert.equal(prefix.kind, "explicit_failed_action_invariant_prefix");
  assert.equal(prefix.selection_policy, "explicit_failed_action_invariant");
  assert.equal(prefix.target_rule_id, "INV-03");
  assert.deepEqual(prefix.coincident_critical_failures, ["INV-02"]);

  const verified = invoke(["verify", "--bundle", outDir]);
  assert.equal(verified.status, 0, verified.stderr);
  assert.equal(JSON.parse(verified.stdout).target_rule_id, "INV-03");
});

test("compile is portable across renamed case, step, evidence, rule, and control ids", async (t) => {
  const directory = await temporaryDirectory(t);
  const casePath = join(directory, "renamed-case.json");
  const runPath = join(directory, "renamed-run.json");
  const outDir = join(directory, "renamed-bundle");
  const caseData = JSON.parse(await readFile(urgentCasePath, "utf8"));
  const run = JSON.parse(await readFile(baselineInputPath, "utf8"));

  caseData.id = "portable-witness-case";
  const stepIds = new Map(
    caseData.timeline.map((step, index) => [step.id, `STEP-${index + 41}`])
  );
  for (const step of caseData.timeline) {
    step.id = stepIds.get(step.id);
  }
  for (const decision of run.decisions) {
    decision.step_id = stepIds.get(decision.step_id);
  }
  const evidenceIds = new Map(
    caseData.evidence.map((item, index) => [item.id, `EVID-${index + 51}`])
  );
  for (const evidence of caseData.evidence) {
    evidence.id = evidenceIds.get(evidence.id);
  }
  for (const rule of caseData.rules) {
    rule.source_refs = rule.source_refs.map((id) => evidenceIds.get(id));
  }
  for (const decision of run.decisions) {
    decision.evidence_refs = decision.evidence_refs.map((id) =>
      evidenceIds.get(id)
    );
  }
  caseData.rules.forEach((rule, index) => {
    rule.id = `INV-${index + 61}`;
  });
  caseData.controls.forEach((control, index) => {
    control.id = `CTRL-${index + 71}`;
  });
  run.run_id = "portable-failing-run";
  await Promise.all([writeJson(casePath, caseData), writeJson(runPath, run)]);

  const result = invoke([
    "compile",
    "--case",
    casePath,
    "--run",
    runPath,
    "--out-dir",
    outDir
  ]);
  assert.equal(result.status, 0, result.stderr);
  const prefix = JSON.parse(
    await readFile(join(outDir, "failing-prefix.json"), "utf8")
  );
  assert.equal(prefix.case_id, "portable-witness-case");
  assert.equal(prefix.target_rule_id, "INV-62");
  assert.deepEqual(prefix.earlier_failed_action_invariants, [
    { id: "INV-61", critical: false, failure_known_at_minute: 0 }
  ]);
  assert.deepEqual(prefix.coincident_critical_failures, ["INV-63"]);
  const witness = JSON.parse(
    await readFile(join(outDir, "static-witness.json"), "utf8")
  );
  assert.equal(witness.target_rule_id, "INV-62");
  assert.ok(!witness.counterexample_id.includes("pws"));
});

test("compile refuses existing and symlinked output paths without partial writes", async (t) => {
  const directory = await temporaryDirectory(t);
  const existing = join(directory, "existing");
  const marker = join(existing, "keep.txt");
  await mkdir(existing);
  await writeFile(marker, "keep", "utf8");

  const existingResult = invoke([
    "compile",
    "--case",
    urgentCasePath,
    "--run",
    baselineInputPath,
    "--out-dir",
    existing
  ]);
  assert.equal(existingResult.status, 2);
  assert.match(existingResult.stderr, /existing paths are never replaced/);
  assert.equal(await readFile(marker, "utf8"), "keep");

  const symlinkPath = join(directory, "bundle-link");
  await symlink(existing, symlinkPath, "dir");
  const symlinkResult = invoke([
    "compile",
    "--case",
    urgentCasePath,
    "--run",
    baselineInputPath,
    "--out-dir",
    symlinkPath
  ]);
  assert.equal(symlinkResult.status, 2);
  assert.match(symlinkResult.stderr, /existing paths are never replaced/);
  assert.equal(await readFile(marker, "utf8"), "keep");

  const malformedPath = join(directory, "malformed.json");
  const malformedOut = join(directory, "malformed-out");
  await writeFile(malformedPath, "{", "utf8");
  const malformedResult = invoke([
    "compile",
    "--case",
    urgentCasePath,
    "--run",
    malformedPath,
    "--out-dir",
    malformedOut
  ]);
  assert.equal(malformedResult.status, 2);
  await assert.rejects(access(malformedOut), { code: "ENOENT" });
});
