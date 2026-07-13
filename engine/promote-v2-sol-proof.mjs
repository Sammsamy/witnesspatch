#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  lstat,
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  writeFile
} from "node:fs/promises";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import { assertCase, stableStringify } from "./core.mjs";
import {
  EXPECTED_V2_ACCEPTANCE_SIGNATURE,
  assertV2PolicyRepairProposal,
  buildV2PolicyRepairPrompt,
  compileV2PolicyRepairProposal
} from "./policy-repair-v2.mjs";
import { assertCodexPolicyRepairV2Schema } from "./schema-validator.mjs";
import { applyUnifiedDiff } from "./unified-diff.mjs";

const engineDir = dirname(fileURLToPath(import.meta.url));
const rootDir = dirname(engineDir);
const captureRoot = join(rootDir, "output", "codex-policy-repair-v2");
const defaultCaptureDir = join(
  captureRoot,
  "2026-07-13T17-49-55-290Z-cdc6f9e9"
);
const proofRoot = join(rootDir, "proof");
const proofDir = join(proofRoot, "v2");
const retainedNames = Object.freeze({
  receipt: "sol-v2-receipt.json",
  proposal: "sol-v2-proposal.json",
  candidate: "sol-v2-candidate.mjs",
  patch: "sol-v2-candidate.patch",
  prompt: "sol-v2-prompt.txt"
});

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function requireValue(condition, message) {
  if (!condition) throw new Error(message);
}

function parseArgs(args) {
  let captureDir = defaultCaptureDir;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--capture-dir") {
      const value = args[index + 1];
      if (!value) throw new Error("--capture-dir requires a path.");
      captureDir = isAbsolute(value) ? value : resolve(rootDir, value);
      index += 1;
    } else if (arg === "--help" || arg === "-h") {
      process.stdout.write(
        "Usage: node engine/promote-v2-sol-proof.mjs [--capture-dir output/codex-policy-repair-v2/CHILD]\n"
      );
      process.exit(0);
    } else {
      throw new Error(`Unknown argument ${arg}.`);
    }
  }
  return { captureDir: assertBoundedCaptureDirectory(captureDir) };
}

export function assertBoundedCaptureDirectory(captureDir) {
  const resolved = resolve(captureDir);
  const fromRoot = relative(captureRoot, resolved);
  requireValue(
    fromRoot.length > 0 &&
      fromRoot !== ".." &&
      !fromRoot.startsWith(`..${sep}`) &&
      !isAbsolute(fromRoot) &&
      !fromRoot.includes(sep),
    "Capture must be one direct child of output/codex-policy-repair-v2/."
  );
  return resolved;
}

async function readRegularFile(path, label) {
  const details = await lstat(path);
  requireValue(details.isFile() && !details.isSymbolicLink(), `${label} must be a regular file.`);
  return readFile(path);
}

function assertExactByteRecord(record, expectedPath, bytes, label) {
  requireValue(record?.path === expectedPath, `${label} input path drifted.`);
  requireValue(record?.sha256 === sha256(bytes), `${label} input hash drifted.`);
  requireValue(record?.byte_length === bytes.length, `${label} input byte length drifted.`);
}

function assertReceiptBoundary(receipt) {
  requireValue(receipt.schema_version === "2.0.0", "Receipt schema is not V2.");
  requireValue(receipt.status === "validated_candidate", "Capture is not a validated candidate.");
  requireValue(
    Date.parse(receipt.generated_at) >= Date.parse(receipt.started_at) &&
      Date.parse(receipt.started_at) >= Date.parse("2026-07-13T16:00:00.000Z"),
    "Receipt timestamps are not a valid post-start interval."
  );
  const generation = receipt.generation;
  requireValue(
    generation?.mode === "local_codex_cli_chatgpt_subscription" &&
      generation.auth_status === "Logged in using ChatGPT" &&
      generation.api_key_required === false &&
      generation.requested_model === "gpt-5.6-sol" &&
      generation.requested_reasoning_effort === "ultra" &&
      generation.forced_login_method === "chatgpt" &&
      generation.ephemeral === true &&
      generation.sandbox === "read-only" &&
      generation.isolated_working_directory === true &&
      generation.ignored_user_config === true &&
      generation.ignored_exec_rules === true &&
      generation.hidden_reasoning_captured === false,
    "Receipt generation boundary is invalid."
  );
  requireValue(
    stableStringify(generation.model_tools_disabled) ===
      stableStringify([
        "shell_tool",
        "unified_exec",
        "browser_use",
        "computer_use",
        "apps",
        "multi_agent"
      ]),
    "Receipt disabled-tool boundary drifted."
  );
  requireValue(
    receipt.candidate?.automatically_installed === false,
    "Promoted candidate must remain quarantined."
  );
  requireValue(
    receipt.deterministic_validation?.exact_signature_match === true &&
      stableStringify(receipt.deterministic_validation.expected_signature) ===
        stableStringify(EXPECTED_V2_ACCEPTANCE_SIGNATURE) &&
      stableStringify(receipt.deterministic_validation.observed_signature) ===
        stableStringify(EXPECTED_V2_ACCEPTANCE_SIGNATURE),
    "Receipt exact deterministic signature drifted."
  );
}

async function assertExistingProof(expected) {
  const entries = (await readdir(proofDir)).sort();
  const names = [...expected.keys()].sort();
  assert.deepEqual(entries, names, "Existing proof/v2 contains an unexpected file set.");
  for (const [name, bytes] of expected) {
    assert.deepEqual(
      await readRegularFile(join(proofDir, name), `Existing ${name}`),
      bytes,
      `Existing proof/v2/${name} differs from the validated capture.`
    );
  }
}

export async function promoteV2SolProof({ captureDir = defaultCaptureDir } = {}) {
  const boundedCapture = assertBoundedCaptureDirectory(captureDir);
  const captureRootDetails = await lstat(captureRoot);
  requireValue(
    captureRootDetails.isDirectory() && !captureRootDetails.isSymbolicLink(),
    "Capture root must be a real directory, not a symbolic link."
  );
  const captureDetails = await lstat(boundedCapture);
  requireValue(
    captureDetails.isDirectory() && !captureDetails.isSymbolicLink(),
    "Capture must be a real directory, not a symbolic link."
  );

  const paths = {
    receipt: join(boundedCapture, "receipt.json"),
    proposal: join(boundedCapture, "proposal.json"),
    candidate: join(boundedCapture, "candidate.mjs"),
    patch: join(boundedCapture, "candidate.patch"),
    baseline: join(rootDir, "targets", "demo-agent", "v2", "baseline.mjs"),
    urgent: join(rootDir, "cases", "v2", "postpartum-warning-signs.json"),
    exactNegative: join(
      rootDir,
      "cases",
      "v2",
      "postpartum-exact-negative-control.json"
    ),
    holdouts: join(
      engineDir,
      "fixtures",
      "v2",
      "postpartum-warning-signs-holdouts.json"
    ),
    schema: join(rootDir, "contracts", "codex-policy-repair-v2.schema.json")
  };
  const bytes = Object.fromEntries(
    await Promise.all(
      Object.entries(paths).map(async ([id, path]) => [
        id,
        await readRegularFile(path, id)
      ])
    )
  );
  const receipt = JSON.parse(bytes.receipt.toString("utf8"));
  const urgentCase = assertCase(JSON.parse(bytes.urgent.toString("utf8")));
  const exactNegativeCase = assertCase(
    JSON.parse(bytes.exactNegative.toString("utf8"))
  );
  const proposal = JSON.parse(bytes.proposal.toString("utf8"));

  assertReceiptBoundary(receipt);
  assertCodexPolicyRepairV2Schema(proposal);
  assertV2PolicyRepairProposal(proposal, urgentCase, exactNegativeCase);

  const relativeCapture = relative(rootDir, boundedCapture);
  requireValue(
    receipt.candidate.files.proposal === `${relativeCapture}/proposal.json` &&
      receipt.candidate.files.source === `${relativeCapture}/candidate.mjs` &&
      receipt.candidate.files.patch === `${relativeCapture}/candidate.patch`,
    "Receipt candidate file links do not name this capture."
  );
  requireValue(
    receipt.candidate.proposal_sha256 === sha256(bytes.proposal) &&
      receipt.candidate.candidate_source_sha256 === sha256(bytes.candidate) &&
      receipt.candidate.patch_sha256 === sha256(bytes.patch),
    "Receipt candidate byte links are invalid."
  );

  const input = receipt.input_scope;
  requireValue(input?.hash_algorithm === "sha256_exact_bytes", "Input hash scope is invalid.");
  assertExactByteRecord(
    input.baseline,
    "targets/demo-agent/v2/baseline.mjs",
    bytes.baseline,
    "Baseline"
  );
  assertExactByteRecord(
    input.urgent_case,
    "cases/v2/postpartum-warning-signs.json",
    bytes.urgent,
    "Urgent case"
  );
  assertExactByteRecord(
    input.exact_negative_control,
    "cases/v2/postpartum-exact-negative-control.json",
    bytes.exactNegative,
    "Exact negative control"
  );
  assertExactByteRecord(
    input.holdout_suite,
    "engine/fixtures/v2/postpartum-warning-signs-holdouts.json",
    bytes.holdouts,
    "Holdout suite"
  );
  assertExactByteRecord(
    input.output_schema,
    "contracts/codex-policy-repair-v2.schema.json",
    bytes.schema,
    "Output schema"
  );
  requireValue(
    input.checked_in_repaired_policy_supplied === false &&
      input.holdout_suite_supplied_to_model === false &&
      input.isolated_model_directory_contains_repaired_policy === false,
    "Receipt input-isolation claims drifted."
  );

  const prompt = Buffer.from(
    buildV2PolicyRepairPrompt({
      baselineSource: bytes.baseline.toString("utf8"),
      urgentCase,
      exactNegativeControl: exactNegativeCase
    }),
    "utf8"
  );
  requireValue(sha256(prompt) === input.prompt_sha256, "Reconstructed prompt hash drifted.");
  assert.deepEqual(
    Buffer.from(compileV2PolicyRepairProposal(proposal), "utf8"),
    bytes.candidate,
    "Fixed compiler output differs from the captured candidate."
  );
  assert.deepEqual(
    Buffer.from(
      applyUnifiedDiff({
        oldText: bytes.baseline.toString("utf8"),
        patchText: bytes.patch.toString("utf8"),
        oldLabel: "a/targets/demo-agent/v2/baseline.mjs",
        newLabel: "b/output/codex-policy-repair-v2/candidate.mjs"
      }),
      "utf8"
    ),
    bytes.candidate,
    "Captured unified diff does not produce the exact candidate bytes."
  );

  const retained = new Map([
    [retainedNames.receipt, bytes.receipt],
    [retainedNames.proposal, bytes.proposal],
    [retainedNames.candidate, bytes.candidate],
    [retainedNames.patch, bytes.patch],
    [retainedNames.prompt, prompt]
  ]);
  await mkdir(proofRoot, { recursive: true });
  const proofRootDetails = await lstat(proofRoot);
  requireValue(
    proofRootDetails.isDirectory() && !proofRootDetails.isSymbolicLink(),
    "Proof root must be a real directory, not a symbolic link."
  );
  try {
    const existingProofDetails = await lstat(proofDir);
    requireValue(
      existingProofDetails.isDirectory() &&
        !existingProofDetails.isSymbolicLink(),
      "Existing proof/v2 must be a real directory, not a symbolic link."
    );
    await assertExistingProof(retained);
    return { proof_dir: proofDir, receipt, already_present: true };
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }

  const temporary = join(proofRoot, `.v2.tmp-${process.pid}`);
  await rm(temporary, { recursive: true, force: true });
  await mkdir(temporary);
  try {
    for (const [name, value] of retained) {
      await writeFile(join(temporary, name), value, { flag: "wx" });
    }
    await rename(temporary, proofDir);
  } catch (error) {
    await rm(temporary, { recursive: true, force: true });
    throw error;
  }
  return { proof_dir: proofDir, receipt, already_present: false };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await promoteV2SolProof(parseArgs(process.argv.slice(2)));
  process.stdout.write(
    `${result.already_present ? "Verified" : "Promoted"} post-start Sol V2 proof into ${relative(rootDir, result.proof_dir)}; candidate remains quarantined.\n`
  );
}
