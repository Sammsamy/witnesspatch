#!/usr/bin/env node

import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import { constants as fsConstants } from "node:fs";
import {
  lstat,
  mkdir,
  open,
  readFile,
  readdir,
  realpath,
  rename,
  rm,
  writeFile
} from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { TextDecoder } from "node:util";

import {
  assertCase,
  buildRunArtifact,
  readJson,
  sha256,
  stableStringify
} from "../engine/core.mjs";
import {
  compileWitnessBundle,
  NoCompilableFailureError
} from "../engine/compile-witness.mjs";
import {
  assertCompiledWitnessSchema,
  assertRunSchema,
  assertWitnessBundleManifestSchema
} from "../engine/schema-validator.mjs";

const BUNDLE_FILE_NAMES = Object.freeze([
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
const MANIFEST_FILE_NAMES = Object.freeze(
  BUNDLE_FILE_NAMES.filter((name) => name !== "manifest.json")
);
const JSON_FILE_NAMES = Object.freeze(
  BUNDLE_FILE_NAMES.filter((name) => name.endsWith(".json"))
);
const SHA256_HEX = /^[a-f0-9]{64}$/u;
const MAX_BUNDLE_FILE_BYTES = 4 * 1024 * 1024;
const MAX_BUNDLE_TOTAL_BYTES = 16 * 1024 * 1024;
const MAX_JSON_DEPTH = 64;
const MAX_JSON_NODES = 100_000;
const MAX_RECONSTRUCTION_FACTS = 16;
const utf8Decoder = new TextDecoder("utf-8", { fatal: true });

function usage() {
  return [
    "Usage: witnesspatch evaluate --case PATH --candidate PATH [--out PATH]",
    "       witnesspatch compile --case PATH --run PATH --out-dir PATH [--rule ID] [--fact-scope failure-prefix|full-trace]",
    "       witnesspatch verify --bundle PATH",
    "",
    "Re-grades a JSON run input or evaluated artifact against a fully synthetic",
    "case. The deterministic evaluator never imports policy code or invokes a model.",
    "",
    "compile emits an atomic, hash-listed static-trace witness bundle and a red",
    "contract regression. It never imports or reruns a target and never invokes a model.",
    "",
    "verify checks the exact bundle file set, safe regular files, manifest hashes,",
    "schemas, semantic links, deterministic evaluation, and compiler-exact bytes.",
    "It verifies local consistency, not publisher identity or source provenance.",
    "",
    "Exit codes: evaluate: 0 pass, 1 valid fail, 2 invalid input or usage.",
    "            compile: 0 compiled, 1 nothing to compile, 2 invalid input or usage.",
    "            verify: 0 verified, 2 invalid, unsafe, or tampered bundle."
  ].join("\n");
}

function parseArguments(args) {
  if (args.length === 1 && (args[0] === "--help" || args[0] === "-h")) {
    return { help: true };
  }
  if (
    args[0] !== "evaluate" &&
    args[0] !== "compile" &&
    args[0] !== "verify"
  ) {
    const received = args[0] === undefined ? "no subcommand" : `subcommand ${args[0]}`;
    throw new Error(`Expected evaluate, compile, or verify; received ${received}. Use --help for usage.`);
  }

  const subcommand = args[0];
  const parsed = {
    help: false,
    subcommand,
    casePath: null,
    candidatePath: null,
    runPath: null,
    outPath: null,
    outDir: null,
    targetRuleId: null,
    factScope: null,
    bundlePath: null
  };
  const optionNames =
    subcommand === "evaluate"
      ? new Map([
          ["--case", "casePath"],
          ["--candidate", "candidatePath"],
          ["--out", "outPath"]
        ])
      : subcommand === "compile"
        ? new Map([
            ["--case", "casePath"],
            ["--run", "runPath"],
            ["--out-dir", "outDir"],
            ["--rule", "targetRuleId"],
            ["--fact-scope", "factScope"]
          ])
        : new Map([["--bundle", "bundlePath"]]);

  for (let index = 1; index < args.length; index += 1) {
    const option = args[index];
    const field = optionNames.get(option);
    if (!field) {
      throw new Error(`Unknown argument ${option}. Use --help for usage.`);
    }
    if (parsed[field] !== null) {
      throw new Error(`${option} may be supplied only once.`);
    }
    const value = args[index + 1];
    if (!value || value.startsWith("--")) {
      const requiredValue =
        option === "--rule"
          ? "an ID"
          : option === "--fact-scope"
            ? "failure-prefix or full-trace"
            : "a path";
      throw new Error(`${option} requires ${requiredValue}.`);
    }
    parsed[field] = value;
    index += 1;
  }

  if (
    subcommand === "evaluate" &&
    (!parsed.casePath || !parsed.candidatePath)
  ) {
    throw new Error("evaluate requires both --case and --candidate.");
  }
  if (
    subcommand === "compile" &&
    (!parsed.casePath || !parsed.runPath || !parsed.outDir)
  ) {
    throw new Error("compile requires --case, --run, and --out-dir.");
  }
  if (subcommand === "verify" && !parsed.bundlePath) {
    throw new Error("verify requires --bundle.");
  }
  if (
    parsed.factScope !== null &&
    parsed.factScope !== "failure-prefix" &&
    parsed.factScope !== "full-trace"
  ) {
    throw new Error(
      "--fact-scope must be either failure-prefix or full-trace."
    );
  }
  return parsed;
}

function requireValue(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertLinkedValue(label, actual, expected) {
  requireValue(
    stableStringify(actual) === stableStringify(expected),
    `${label} does not match the bundle's deterministic source of truth.`
  );
}

function decodeUtf8(bytes, name) {
  try {
    return utf8Decoder.decode(bytes);
  } catch {
    throw new Error(`${name} is not valid UTF-8.`);
  }
}

function parseBundleJson(bytes, name) {
  let value;
  try {
    value = JSON.parse(decodeUtf8(bytes, name));
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`${name} is not valid JSON: ${error.message}`);
    }
    throw error;
  }
  const pending = [{ value, depth: 0 }];
  let nodes = 0;
  while (pending.length > 0) {
    const current = pending.pop();
    nodes += 1;
    requireValue(
      nodes <= MAX_JSON_NODES,
      `${name} exceeds the ${MAX_JSON_NODES.toLocaleString("en-US")}-node verification limit.`
    );
    requireValue(
      current.depth <= MAX_JSON_DEPTH,
      `${name} exceeds the maximum JSON depth of ${MAX_JSON_DEPTH}.`
    );
    if (Array.isArray(current.value)) {
      for (const item of current.value) {
        pending.push({ value: item, depth: current.depth + 1 });
      }
    } else if (
      current.value !== null &&
      typeof current.value === "object"
    ) {
      for (const item of Object.values(current.value)) {
        pending.push({ value: item, depth: current.depth + 1 });
      }
    }
  }
  return value;
}

function sameFileIdentity(left, right) {
  return (
    left.dev === right.dev &&
    left.ino === right.ino &&
    left.mode === right.mode &&
    left.size === right.size &&
    left.mtimeNs === right.mtimeNs &&
    left.ctimeNs === right.ctimeNs
  );
}

async function readRegularFileNoFollow(path, name) {
  const pathDetails = await lstat(path, { bigint: true });
  requireValue(
    pathDetails.isFile() && !pathDetails.isSymbolicLink(),
    `${name} must be a regular file, not a symbolic link.`
  );
  requireValue(
    pathDetails.size <= BigInt(MAX_BUNDLE_FILE_BYTES),
    `${name} exceeds the 4 MiB verification limit.`
  );
  let handle;
  try {
    handle = await open(
      path,
      fsConstants.O_RDONLY | (fsConstants.O_NOFOLLOW ?? 0)
    );
  } catch (error) {
    if (error?.code === "ELOOP") {
      throw new Error(`${name} must be a regular file, not a symbolic link.`);
    }
    throw error;
  }
  try {
    const beforeRead = await handle.stat({ bigint: true });
    requireValue(beforeRead.isFile(), `${name} must be a regular file.`);
    requireValue(
      sameFileIdentity(pathDetails, beforeRead),
      `${name} changed while verification opened it.`
    );
    const bytes = Buffer.from(await handle.readFile());
    const afterRead = await handle.stat({ bigint: true });
    requireValue(
      sameFileIdentity(beforeRead, afterRead),
      `${name} changed while verification read it.`
    );
    requireValue(
      BigInt(bytes.length) === afterRead.size,
      `${name} changed length while verification read it.`
    );
    return { bytes, identity: afterRead };
  } finally {
    await handle.close();
  }
}

function exactNames(actual, expected, label) {
  const sorted = [...actual].sort((left, right) => left.localeCompare(right));
  requireValue(
    stableStringify(sorted) === stableStringify(expected),
    `${label} must contain exactly: ${expected.join(", ")}.`
  );
}

async function readBundleFiles(requestedDirectory) {
  const resolved = resolve(requestedDirectory);
  const requestedDetails = await lstat(resolved, { bigint: true });
  requireValue(
    !requestedDetails.isSymbolicLink(),
    "--bundle must name a directory, not a symbolic link."
  );
  requireValue(requestedDetails.isDirectory(), "--bundle must name a directory.");

  const bundleDirectory = await realpath(resolved);
  const directoryIdentity = await lstat(bundleDirectory, { bigint: true });
  requireValue(directoryIdentity.isDirectory(), "--bundle must name a directory.");
  const entries = await readdir(bundleDirectory, { withFileTypes: true });
  exactNames(
    entries.map((entry) => entry.name),
    BUNDLE_FILE_NAMES,
    "Bundle directory"
  );
  for (const entry of entries) {
    requireValue(
      entry.isFile() && !entry.isSymbolicLink(),
      `${entry.name} must be a regular file, not a link or directory.`
    );
  }

  const snapshots = new Map(
    await Promise.all(
      BUNDLE_FILE_NAMES.map(async (name) => [
        name,
        await readRegularFileNoFollow(join(bundleDirectory, name), name)
      ])
    )
  );
  const totalBytes = [...snapshots.values()].reduce(
    (total, snapshot) => total + snapshot.bytes.length,
    0
  );
  requireValue(
    totalBytes <= MAX_BUNDLE_TOTAL_BYTES,
    "Bundle exceeds the 16 MiB total verification limit."
  );

  const directoryAfterRead = await lstat(bundleDirectory, { bigint: true });
  requireValue(
    sameFileIdentity(directoryIdentity, directoryAfterRead),
    "Bundle directory changed while verification read it."
  );
  const entriesAfterRead = await readdir(bundleDirectory, {
    withFileTypes: true
  });
  exactNames(
    entriesAfterRead.map((entry) => entry.name),
    BUNDLE_FILE_NAMES,
    "Bundle directory"
  );
  for (const entry of entriesAfterRead) {
    requireValue(
      entry.isFile() && !entry.isSymbolicLink(),
      `${entry.name} changed to a link or non-file during verification.`
    );
    const finalDetails = await lstat(join(bundleDirectory, entry.name), {
      bigint: true
    });
    requireValue(
      finalDetails.isFile() &&
        sameFileIdentity(snapshots.get(entry.name).identity, finalDetails),
      `${entry.name} changed while verification read the bundle.`
    );
  }
  const files = new Map(
    [...snapshots].map(([name, snapshot]) => [name, snapshot.bytes])
  );
  return { bundleDirectory, files };
}

function validateManifest(manifest, files) {
  assertWitnessBundleManifestSchema(manifest);
  const paths = manifest.files.map((record) => record.path);
  exactNames(paths, MANIFEST_FILE_NAMES, "Manifest");
  requireValue(
    stableStringify(paths) === stableStringify(MANIFEST_FILE_NAMES),
    "Manifest file records must be in canonical lexical order."
  );
  requireValue(new Set(paths).size === paths.length, "Manifest paths must be unique.");

  for (const record of manifest.files) {
    const expectedKind = record.path.endsWith(".test.mjs")
      ? "red_regression_test"
      : "json_artifact";
    requireValue(
      record.kind === expectedKind,
      `Manifest kind for ${record.path} must be ${expectedKind}.`
    );
    const bytes = files.get(record.path);
    requireValue(bytes, `Manifest names missing bundle file ${record.path}.`);
    requireValue(
      record.bytes === bytes.length,
      `Manifest byte count mismatch for ${record.path}.`
    );
    requireValue(
      record.sha256 === sha256(bytes),
      `Manifest SHA-256 mismatch for ${record.path}.`
    );
  }
}

function determineStartingFactScope(caseData, target, witness) {
  const fullTraceFacts = caseData.timeline.flatMap((step) => step.facts_revealed);
  const failurePrefixFacts = caseData.timeline
    .filter((step) => step.at_minute <= target.deadline_minute)
    .flatMap((step) => step.facts_revealed);
  requireValue(
    witness.starting_fact_ids.length <= MAX_RECONSTRUCTION_FACTS,
    `static-witness.json exceeds the ${MAX_RECONSTRUCTION_FACTS}-fact semantic reconstruction limit.`
  );
  if (
    stableStringify(witness.starting_fact_ids) ===
    stableStringify(fullTraceFacts)
  ) {
    return undefined;
  }
  if (
    stableStringify(witness.starting_fact_ids) ===
    stableStringify(failurePrefixFacts)
  ) {
    return "failure_prefix";
  }
  throw new Error(
    "static-witness.json starting facts are neither the full trace nor the selected failure prefix."
  );
}

function validateBundleLinks(artifacts) {
  const {
    caseData,
    evaluatedRun,
    failingPrefix,
    manifest,
    receipt,
    regression,
    runInput,
    staticWitness
  } = artifacts;
  assertCase(caseData);
  assertRunSchema(evaluatedRun);
  assertCompiledWitnessSchema(staticWitness);

  const freshlyEvaluated = buildRunArtifact(caseData, runInput);
  assertLinkedValue("evaluated-run.json", evaluatedRun, freshlyEvaluated);
  requireValue(
    evaluatedRun.evaluation.status === "fail",
    "A compiled witness bundle must contain a failing evaluated run."
  );
  const target = evaluatedRun.evaluation.results.find(
    (result) => result.id === manifest.target_rule_id
  );
  requireValue(
    target?.kind === "action_invariant" && target.passed === false,
    "Manifest target_rule_id must name a failed action invariant."
  );

  const identity = manifest.bundle_id.slice("witness-bundle-".length);
  const links = [
    ["manifest.case_id", manifest.case_id, caseData.id],
    ["manifest.source_run_id", manifest.source_run_id, evaluatedRun.run_id],
    ["evaluated-run.case_id", evaluatedRun.case_id, caseData.id],
    ["failing-prefix.bundle_id", failingPrefix.bundle_id, manifest.bundle_id],
    ["failing-prefix.case_id", failingPrefix.case_id, caseData.id],
    ["failing-prefix.case_sha256", failingPrefix.case_sha256, evaluatedRun.case_sha256],
    ["failing-prefix.source_run_id", failingPrefix.source_run_id, evaluatedRun.run_id],
    ["failing-prefix.target_rule_id", failingPrefix.target_rule_id, target.id],
    ["failing-prefix.target_rule_title", failingPrefix.target_rule_title, target.title],
    ["failing-prefix.triggered_at_minute", failingPrefix.triggered_at_minute, target.triggered_at_minute],
    ["failing-prefix.failure_known_at_minute", failingPrefix.failure_known_at_minute, target.deadline_minute],
    ["static-witness.counterexample_id", staticWitness.counterexample_id, `static-witness-${identity}`],
    ["static-witness.case_id", staticWitness.case_id, caseData.id],
    ["static-witness.source_run_id", staticWitness.source_run_id, evaluatedRun.run_id],
    ["static-witness.target_rule_id", staticWitness.target_rule_id, target.id],
    ["static-witness.target_rule_title", staticWitness.target_rule_title, target.title],
    ["regression.regression_id", regression.regression_id, `regression-${identity}`],
    ["regression.bundle_id", regression.bundle_id, manifest.bundle_id],
    ["regression.case_file", regression.case_file, "case.json"],
    ["regression.candidate_file", regression.candidate_file, "run.json"],
    ["regression.target_rule_id", regression.target_rule_id, target.id],
    ["regression.initial_status", regression.initial_status, "red"],
    ["regression.initial_score", regression.initial_score, evaluatedRun.evaluation.score],
    ["receipt.bundle_id", receipt.bundle_id, manifest.bundle_id],
    ["receipt.case_id", receipt.case_id, caseData.id],
    ["receipt.case_sha256", receipt.case_sha256, evaluatedRun.case_sha256],
    ["receipt.source_run_id", receipt.source_run_id, evaluatedRun.run_id],
    ["receipt.selected_rule_id", receipt.selected_rule_id, target.id],
    ["receipt.failure_known_at_minute", receipt.failure_known_at_minute, target.deadline_minute],
    ["receipt.starting_fact_count", receipt.starting_fact_count, staticWitness.starting_fact_count],
    ["receipt.minimal_fact_count", receipt.minimal_fact_count, staticWitness.minimal_fact_count],
    ["receipt.regression_initial_status", receipt.regression_initial_status, "red"],
    ["receipt.api_key_required", receipt.api_key_required, false],
    ["receipt.model_invoked", receipt.model_invoked, false],
    ["receipt.contains_real_patient_data", receipt.contains_real_patient_data, false],
    ["receipt.clinician_validation", receipt.clinician_validation, "pending"],
    ["receipt.manifest_file", receipt.manifest_file, "manifest.json"]
  ];
  for (const [label, actual, expected] of links) {
    assertLinkedValue(label, actual, expected);
  }
  assertLinkedValue(
    "manifest.input_integrity",
    manifest.input_integrity,
    receipt.input_integrity
  );
  assertLinkedValue(
    "regression.initial_critical_failures",
    regression.initial_critical_failures,
    evaluatedRun.evaluation.critical_failures
  );
  assertLinkedValue("failing-prefix.failure.missing_actions", failingPrefix.failure?.missing_actions, target.missing_actions);
  assertLinkedValue(
    "failing-prefix.failure.forbidden_actions_observed",
    failingPrefix.failure?.forbidden_actions_observed,
    target.forbidden_actions_observed
  );
  requireValue(
    SHA256_HEX.test(receipt.input_case_sha256 ?? "") &&
      SHA256_HEX.test(receipt.input_run_sha256 ?? ""),
    "receipt.json must contain both lowercase SHA-256 source-input hashes."
  );
  requireValue(
    receipt.input_integrity?.hashes_computed === 2,
    "receipt.json input_integrity.hashes_computed must be 2."
  );

  const targetRuleId =
    staticWitness.selection_policy === "explicit_failed_action_invariant"
      ? target.id
      : undefined;
  const expectedSelectionReason = targetRuleId
    ? "explicit --rule selection"
    : target.critical
      ? "earliest failed critical action invariant"
      : "earliest failed action invariant";
  assertLinkedValue(
    "receipt.selected_rule_reason",
    receipt.selected_rule_reason,
    expectedSelectionReason
  );
  const startingFactScope = determineStartingFactScope(
    caseData,
    target,
    staticWitness
  );
  return {
    target,
    compileOptions: {
      targetRuleId,
      startingFactScope,
      inputCaseSha256: receipt.input_case_sha256,
      inputRunSha256: receipt.input_run_sha256
    }
  };
}

async function verifyBundle(requestedDirectory) {
  const { bundleDirectory, files } = await readBundleFiles(requestedDirectory);
  const manifest = parseBundleJson(files.get("manifest.json"), "manifest.json");
  validateManifest(manifest, files);
  const parsed = new Map([
    ["manifest.json", manifest],
    ...JSON_FILE_NAMES.filter((name) => name !== "manifest.json").map(
      (name) => [name, parseBundleJson(files.get(name), name)]
    )
  ]);
  const artifacts = {
    caseData: parsed.get("case.json"),
    evaluatedRun: parsed.get("evaluated-run.json"),
    failingPrefix: parsed.get("failing-prefix.json"),
    manifest,
    receipt: parsed.get("receipt.json"),
    regression: parsed.get("regression.json"),
    runInput: parsed.get("run.json"),
    staticWitness: parsed.get("static-witness.json")
  };
  const { target, compileOptions } = validateBundleLinks(artifacts);

  let expectedBundle;
  try {
    expectedBundle = compileWitnessBundle(
      artifacts.caseData,
      artifacts.runInput,
      compileOptions
    );
  } catch (error) {
    throw new Error(`Bundle semantic reconstruction failed: ${safeErrorMessage(error)}`);
  }
  for (const name of [...MANIFEST_FILE_NAMES, "manifest.json"]) {
    const expected = Buffer.from(expectedBundle.files.get(name), "utf8");
    requireValue(
      files.get(name).equals(expected),
      `${name} does not match deterministic compiler output.`
    );
  }

  return {
    bundle_id: manifest.bundle_id,
    bundle_directory: bundleDirectory,
    case_id: manifest.case_id,
    source_run_id: manifest.source_run_id,
    target_rule_id: target.id,
    verified_file_count: files.size,
    manifest_record_count: manifest.files.length,
    manifest_sha256: sha256(files.get("manifest.json")),
    evaluated_status: artifacts.evaluatedRun.evaluation.status,
    api_key_required: false,
    model_invoked: false,
    publisher_provenance_verified: false
  };
}

async function writeAtomic(path, contents) {
  await mkdir(dirname(path), { recursive: true });
  const temporaryPath = resolve(
    dirname(path),
    `.${basename(path)}.${process.pid}.${randomUUID()}.tmp`
  );
  try {
    await writeFile(temporaryPath, contents, {
      encoding: "utf8",
      flag: "wx",
      mode: 0o600
    });
    await rename(temporaryPath, path);
  } finally {
    await rm(temporaryPath, { force: true });
  }
}

async function canonicalOutputPath(path) {
  const resolved = resolve(path);
  await mkdir(dirname(resolved), { recursive: true });
  const canonicalParent = await realpath(dirname(resolved));
  return join(canonicalParent, basename(resolved));
}

async function canonicalExistingOutputTarget(path) {
  try {
    return await realpath(path);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

async function existingPathDetails(path) {
  try {
    return await lstat(path);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

async function writeBundleAtomic(requestedDirectory, files) {
  const resolved = resolve(requestedDirectory);
  await mkdir(dirname(resolved), { recursive: true });
  const canonicalParent = await realpath(dirname(resolved));
  const outputDirectory = join(canonicalParent, basename(resolved));
  if (await existingPathDetails(outputDirectory)) {
    throw new Error("--out-dir must name a new path; existing paths are never replaced.");
  }

  const temporaryDirectory = join(
    canonicalParent,
    `.${basename(resolved)}.${process.pid}.${randomUUID()}.tmp`
  );
  await mkdir(temporaryDirectory, { mode: 0o700 });
  try {
    for (const [name, contents] of files) {
      if (name !== basename(name)) {
        throw new Error(`Unsafe compiled bundle file name ${name}.`);
      }
      await writeFile(join(temporaryDirectory, name), contents, {
        encoding: "utf8",
        flag: "wx",
        mode: 0o600
      });
    }
    await rename(temporaryDirectory, outputDirectory);
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
  return outputDirectory;
}

function escapeControlCharacters(value) {
  return String(value).replace(/[\u0000-\u001f\u007f-\u009f]/g, (character) =>
    `\\u${character.codePointAt(0).toString(16).padStart(4, "0")}`
  );
}

function terminalField(value) {
  return JSON.stringify(escapeControlCharacters(value));
}

function safeErrorMessage(error) {
  return escapeControlCharacters(error instanceof Error ? error.message : String(error))
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1000);
}

async function main() {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) {
      process.stdout.write(`${usage()}\n`);
      return 0;
    }

    if (options.subcommand === "verify") {
      const summary = await verifyBundle(options.bundlePath);
      process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
      process.stderr.write(
        `WITNESSPATCH VERIFIED bundle=${terminalField(summary.bundle_id)} rule=${terminalField(summary.target_rule_id)} files=${terminalField(summary.verified_file_count)} provenance=${terminalField("unverified")}\n`
      );
      return 0;
    }

    if (options.subcommand === "compile") {
      const [casePath, runPath] = await Promise.all([
        realpath(resolve(options.casePath)),
        realpath(resolve(options.runPath))
      ]);
      const [caseBytes, runBytes] = await Promise.all([
        readFile(casePath),
        readFile(runPath)
      ]);
      const caseInput = JSON.parse(caseBytes.toString("utf8"));
      const runInput = JSON.parse(runBytes.toString("utf8"));
      const bundle = compileWitnessBundle(caseInput, runInput, {
        targetRuleId: options.targetRuleId,
        startingFactScope:
          options.factScope === "failure-prefix"
            ? "failure_prefix"
            : undefined,
        inputCaseSha256: sha256(caseBytes),
        inputRunSha256: sha256(runBytes)
      });
      const outputDirectory = await writeBundleAtomic(
        options.outDir,
        bundle.files
      );
      const summary = {
        ...bundle.receipt,
        output_directory: outputDirectory,
        output_file_count: bundle.files.size,
        manifest_sha256: sha256(bundle.files.get("manifest.json"))
      };
      process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
      process.stderr.write(
        `WITNESSPATCH COMPILED bundle=${terminalField(bundle.bundleId)} rule=${terminalField(bundle.targetRuleId)} files=${terminalField(bundle.files.size)}\n`
      );
      return 0;
    }

    const [casePath, candidatePath] = await Promise.all([
      realpath(resolve(options.casePath)),
      realpath(resolve(options.candidatePath))
    ]);

    const [caseInput, candidateInput] = await Promise.all([
      readJson(casePath),
      readJson(candidatePath)
    ]);
    const caseData = assertCase(caseInput);
    const artifact = buildRunArtifact(caseData, candidateInput);
    const serialized = `${JSON.stringify(artifact, null, 2)}\n`;

    if (options.outPath) {
      const outPath = await canonicalOutputPath(options.outPath);
      const existingOutputTarget = await canonicalExistingOutputTarget(outPath);
      if (
        outPath === casePath ||
        outPath === candidatePath ||
        existingOutputTarget === casePath ||
        existingOutputTarget === candidatePath
      ) {
        throw new Error("--out must not overwrite the case or candidate input.");
      }
      await writeAtomic(outPath, serialized);
    }

    process.stdout.write(serialized);
    const criticalFailures =
      artifact.evaluation.critical_failures.length > 0
        ? artifact.evaluation.critical_failures.join(",")
        : "none";
    process.stderr.write(
      `WITNESSPATCH ${artifact.evaluation.status.toUpperCase()} ${artifact.evaluation.score}/100 case=${terminalField(artifact.case_id)} run=${terminalField(artifact.run_id)} critical=${terminalField(criticalFailures)}\n`
    );
    return artifact.evaluation.status === "pass" ? 0 : 1;
  } catch (error) {
    if (error instanceof NoCompilableFailureError) {
      process.stderr.write(
        `WITNESSPATCH NOTHING_TO_COMPILE ${safeErrorMessage(error)}\n`
      );
      return 1;
    }
    process.stderr.write(`WITNESSPATCH ERROR ${safeErrorMessage(error)}\n`);
    return 2;
  }
}

process.exitCode = await main();
