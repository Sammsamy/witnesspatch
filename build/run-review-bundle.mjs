import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  mkdir,
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { parseReviewPins, runReviewPreflight } from "./review-preflight.mjs";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MAX_ARCHIVE_BYTES = 4 * 1024 * 1024;
const UTF8_FLAG = 0x0800;
const STORE_METHOD = 0;
const EXPECTED_FILES = Object.freeze([
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
const MANIFEST_LISTED_FILES = Object.freeze(
  EXPECTED_FILES.filter((path) => path !== "manifest.json")
);
const decoder = new TextDecoder("utf-8", { fatal: true });

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < table.length; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) === 1
        ? 0xedb88320 ^ (value >>> 1)
        : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  return table;
})();

function requireValue(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function crc32(bytes) {
  let value = 0xffffffff;
  for (const byte of bytes) {
    value = CRC32_TABLE[(value ^ byte) & 0xff] ^ (value >>> 8);
  }
  return (value ^ 0xffffffff) >>> 0;
}

function uint16(view, offset) {
  requireValue(offset >= 0 && offset + 2 <= view.byteLength, "The ZIP is truncated.");
  return view.getUint16(offset, true);
}

function uint32(view, offset) {
  requireValue(offset >= 0 && offset + 4 <= view.byteLength, "The ZIP is truncated.");
  return view.getUint32(offset, true);
}

function assertExactFileNames(names) {
  const sorted = [...names].sort();
  requireValue(
    JSON.stringify(sorted) === JSON.stringify(EXPECTED_FILES),
    "The review ZIP must contain the exact nine-file WitnessPatch bundle and no other entries."
  );
}

export function parseStoredReviewZip(inputBytes) {
  const bytes = inputBytes instanceof Uint8Array
    ? inputBytes
    : new Uint8Array(inputBytes);
  requireValue(bytes.length <= MAX_ARCHIVE_BYTES, "The review ZIP exceeds 4 MiB.");
  requireValue(bytes.length >= 22, "The review ZIP is truncated.");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const eocdOffset = bytes.length - 22;
  requireValue(uint32(view, eocdOffset) === 0x06054b50, "The ZIP end record is missing.");
  requireValue(
    uint16(view, eocdOffset + 4) === 0 &&
      uint16(view, eocdOffset + 6) === 0,
    "Multi-disk ZIP archives are not accepted."
  );
  const entryCount = uint16(view, eocdOffset + 8);
  requireValue(
    entryCount === EXPECTED_FILES.length &&
      uint16(view, eocdOffset + 10) === entryCount,
    "The review ZIP must declare exactly nine entries."
  );
  const centralSize = uint32(view, eocdOffset + 12);
  const centralOffset = uint32(view, eocdOffset + 16);
  requireValue(uint16(view, eocdOffset + 20) === 0, "ZIP comments are not accepted.");
  requireValue(
    centralOffset + centralSize === eocdOffset,
    "The ZIP central directory boundary is invalid."
  );

  const localEntries = new Map();
  let cursor = 0;
  while (cursor < centralOffset) {
    const localOffset = cursor;
    requireValue(uint32(view, cursor) === 0x04034b50, "A ZIP local header is invalid.");
    requireValue(uint16(view, cursor + 4) === 20, "The ZIP version is unsupported.");
    requireValue(uint16(view, cursor + 6) === UTF8_FLAG, "ZIP entries must use safe UTF-8 names.");
    requireValue(uint16(view, cursor + 8) === STORE_METHOD, "Compressed ZIP entries are not accepted.");
    const checksum = uint32(view, cursor + 14);
    const compressedSize = uint32(view, cursor + 18);
    const uncompressedSize = uint32(view, cursor + 22);
    const nameLength = uint16(view, cursor + 26);
    const extraLength = uint16(view, cursor + 28);
    requireValue(compressedSize === uncompressedSize, "A ZIP entry size is inconsistent.");
    requireValue(extraLength === 0, "ZIP extra fields are not accepted.");
    const nameStart = cursor + 30;
    const nameEnd = nameStart + nameLength;
    requireValue(nameEnd <= centralOffset, "A ZIP file name is truncated.");
    const name = decoder.decode(bytes.subarray(nameStart, nameEnd));
    requireValue(
      EXPECTED_FILES.includes(name),
      "The review ZIP contains an unexpected or unsafe path."
    );
    requireValue(!localEntries.has(name), "The review ZIP contains a duplicate path.");
    const dataStart = nameEnd;
    const dataEnd = dataStart + compressedSize;
    requireValue(dataEnd <= centralOffset, "A ZIP entry is truncated.");
    const contents = bytes.slice(dataStart, dataEnd);
    requireValue(crc32(contents) === checksum, `CRC-32 mismatch for ${name}.`);
    localEntries.set(name, {
      name,
      localOffset,
      checksum,
      compressedSize,
      uncompressedSize,
      contents
    });
    cursor = dataEnd;
  }
  requireValue(cursor === centralOffset, "The ZIP local directory boundary is invalid.");
  assertExactFileNames(localEntries.keys());

  const centralEntries = [];
  cursor = centralOffset;
  for (let index = 0; index < entryCount; index += 1) {
    requireValue(uint32(view, cursor) === 0x02014b50, "A ZIP central header is invalid.");
    requireValue(
      uint16(view, cursor + 4) === 20 && uint16(view, cursor + 6) === 20,
      "The ZIP central version is unsupported."
    );
    requireValue(uint16(view, cursor + 8) === UTF8_FLAG, "ZIP central names must use UTF-8.");
    requireValue(uint16(view, cursor + 10) === STORE_METHOD, "Compressed ZIP entries are not accepted.");
    const checksum = uint32(view, cursor + 16);
    const compressedSize = uint32(view, cursor + 20);
    const uncompressedSize = uint32(view, cursor + 24);
    const nameLength = uint16(view, cursor + 28);
    const extraLength = uint16(view, cursor + 30);
    const commentLength = uint16(view, cursor + 32);
    requireValue(
      uint16(view, cursor + 34) === 0 &&
        uint16(view, cursor + 36) === 0 &&
        uint32(view, cursor + 38) === 0,
      "The ZIP contains unsupported central metadata."
    );
    const localOffset = uint32(view, cursor + 42);
    requireValue(extraLength === 0 && commentLength === 0, "ZIP entry metadata is not accepted.");
    const nameStart = cursor + 46;
    const nameEnd = nameStart + nameLength;
    requireValue(nameEnd <= eocdOffset, "A ZIP central name is truncated.");
    const name = decoder.decode(bytes.subarray(nameStart, nameEnd));
    const local = localEntries.get(name);
    requireValue(local, "The ZIP central directory names an unknown entry.");
    requireValue(
      local.localOffset === localOffset &&
        local.checksum === checksum &&
        local.compressedSize === compressedSize &&
        local.uncompressedSize === uncompressedSize,
      `ZIP directory mismatch for ${name}.`
    );
    centralEntries.push(local);
    cursor = nameEnd;
  }
  requireValue(cursor === eocdOffset, "The ZIP central directory size is invalid.");
  assertExactFileNames(centralEntries.map((entry) => entry.name));
  return centralEntries;
}

function parseJson(bytes, label) {
  try {
    return JSON.parse(decoder.decode(bytes));
  } catch {
    throw new Error(`${label} is not valid UTF-8 JSON.`);
  }
}

function verifyInternalManifest(entries) {
  const files = new Map(entries.map((entry) => [entry.name, entry.contents]));
  const manifest = parseJson(files.get("manifest.json"), "manifest.json");
  requireValue(
    manifest?.kind === "witness_bundle_manifest" &&
      typeof manifest.bundle_id === "string" &&
      typeof manifest.target_rule_id === "string" &&
      Array.isArray(manifest.files),
    "The bundle manifest is incomplete."
  );
  const records = new Map();
  for (const record of manifest.files) {
    requireValue(
      record &&
        typeof record.path === "string" &&
        /^[a-f0-9]{64}$/u.test(record.sha256 ?? "") &&
        !records.has(record.path),
      "The bundle manifest contains an invalid file record."
    );
    records.set(record.path, record.sha256);
  }
  requireValue(
    JSON.stringify([...records.keys()].sort()) ===
      JSON.stringify([...MANIFEST_LISTED_FILES].sort()),
    "The bundle manifest must list the exact eight non-manifest files."
  );
  for (const path of MANIFEST_LISTED_FILES) {
    requireValue(
      sha256(files.get(path)) === records.get(path),
      `SHA-256 mismatch for ${path}.`
    );
  }
  return { manifest, files };
}

function invoke(command, args, options) {
  const result = spawnSync(command, args, {
    ...options,
    encoding: "utf8",
    maxBuffer: 2 * 1024 * 1024,
    windowsHide: true
  });
  requireValue(result.error === undefined, "A review subprocess could not start.");
  return result;
}

async function compileExpectedBundle(rootDir, outDir) {
  const result = invoke(
    process.execPath,
    [
      resolve(rootDir, "bin", "witnesspatch.mjs"),
      "compile",
      "--case",
      resolve(rootDir, "public", "runs", "v2", "postpartum-warning-signs-case.json"),
      "--run",
      resolve(rootDir, "public", "runs", "v2", "postpartum-warning-signs-baseline.json"),
      "--out-dir",
      outDir,
      "--fact-scope",
      "failure-prefix"
    ],
    { cwd: rootDir }
  );
  requireValue(
    result.status === 0,
    "The frozen CLI could not compile the expected reference bundle."
  );
}

function runRegression(rootDir, bundleDir, candidatePath = null) {
  const environment = { ...process.env };
  delete environment.WITNESSPATCH_CANDIDATE;
  delete environment.NODE_TEST_CONTEXT;
  delete environment.NODE_TEST_REPORTER;
  delete environment.NODE_TEST_REPORTER_DESTINATION;
  environment.WITNESSPATCH_CLI = resolve(rootDir, "bin", "witnesspatch.mjs");
  if (candidatePath) environment.WITNESSPATCH_CANDIDATE = candidatePath;
  return invoke(
    process.execPath,
    [
      "--test",
      "--test-reporter=tap",
      resolve(bundleDir, "regression.test.mjs")
    ],
    { cwd: rootDir, env: environment }
  );
}

function verifyRegressionResult(result, expected, targetRuleId) {
  const output = `${result.stdout}\n${result.stderr}`;
  requireValue(
    !output.includes("WitnessPatch CLI was not found"),
    "The generated regression could not find the frozen WitnessPatch CLI."
  );
  if (expected === "red") {
    const passZero = /# pass 0\b/u.test(output);
    const failOne = /# fail 1\b/u.test(output);
    requireValue(
      result.status === 1 && passZero && failOne,
      `The exported baseline regression did not produce the required red Node test (exit ${result.status ?? "none"}, pass-zero ${passZero}, fail-one ${failOne}).`
    );
    requireValue(
      output.includes(`Encoded contract ${targetRuleId} still fails for this candidate.`),
      "The red result did not fail on the selected encoded contract."
    );
    return;
  }
  const passOne = /# pass 1\b/u.test(output);
  const failZero = /# fail 0\b/u.test(output);
  requireValue(
    result.status === 0 && passOne && failZero,
    `The exported regression did not turn green for the supplied retained repair (exit ${result.status ?? "none"}, pass-one ${passOne}, fail-zero ${failZero}).`
  );
}

export function parseReviewBundleArgs(argv, environment = process.env) {
  const values = new Map();
  const allowed = new Set([
    "--expected-commit",
    "--expected-manifest",
    "--bundle-zip",
    "--receipt"
  ]);
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    requireValue(allowed.has(key), `Unknown bundle-review argument ${JSON.stringify(key)}.`);
    const value = argv[index + 1];
    requireValue(
      typeof value === "string" && !value.startsWith("--"),
      `${key} requires a value.`
    );
    requireValue(!values.has(key), `${key} may be supplied only once.`);
    values.set(key, value);
    index += 1;
  }
  const pins = parseReviewPins(
    [
      ...(values.has("--expected-commit")
        ? ["--expected-commit", values.get("--expected-commit")]
        : []),
      ...(values.has("--expected-manifest")
        ? ["--expected-manifest", values.get("--expected-manifest")]
        : [])
    ],
    environment
  );
  requireValue(values.has("--bundle-zip"), "Supply the browser-exported ZIP with --bundle-zip.");
  requireValue(values.has("--receipt"), "Supply a new private receipt path with --receipt.");
  return {
    ...pins,
    bundleZip: values.get("--bundle-zip"),
    receiptPath: values.get("--receipt")
  };
}

export async function runReviewBundle(
  { expectedCommit, expectedManifest, bundleZip, receiptPath },
  {
    rootDir = projectRoot,
    preflight = runReviewPreflight,
    now = () => new Date()
  } = {}
) {
  const preflightReceipt = await preflight({
    expectedCommit,
    expectedManifest,
    rootDir,
    now
  });
  const absoluteBundlePath = resolve(rootDir, bundleZip);
  const bundleMetadata = await stat(absoluteBundlePath);
  requireValue(bundleMetadata.isFile(), "The review ZIP path must name a regular file.");
  requireValue(
    bundleMetadata.size <= MAX_ARCHIVE_BYTES,
    "The review ZIP exceeds 4 MiB."
  );
  const zipBytes = await readFile(absoluteBundlePath);
  const entries = parseStoredReviewZip(zipBytes);
  const { manifest, files } = verifyInternalManifest(entries);
  const temporaryRoot = await mkdtemp(join(tmpdir(), "witnesspatch-review-"));
  try {
    const receivedDir = join(temporaryRoot, "received");
    const expectedDir = join(temporaryRoot, "expected");
    await mkdir(receivedDir);
    for (const [path, contents] of files) {
      await writeFile(join(receivedDir, path), contents, { flag: "wx" });
    }
    await compileExpectedBundle(rootDir, expectedDir);
    for (const path of EXPECTED_FILES) {
      const expectedBytes = await readFile(join(expectedDir, path));
      requireValue(
        Buffer.from(files.get(path)).equals(expectedBytes),
        `The browser ZIP differs from the frozen CLI output at ${path}.`
      );
    }

    const baseline = runRegression(rootDir, receivedDir);
    verifyRegressionResult(baseline, "red", manifest.target_rule_id);
    const repairedCandidate = resolve(
      rootDir,
      "engine",
      "fixtures",
      "v2",
      "postpartum-warning-signs-repaired.input.json"
    );
    const repaired = runRegression(rootDir, receivedDir, repairedCandidate);
    verifyRegressionResult(repaired, "green", manifest.target_rule_id);

    const candidateBytes = await readFile(repairedCandidate);
    const cliBytes = await readFile(resolve(rootDir, "bin", "witnesspatch.mjs"));
    const receipt = Object.freeze({
      schema_version: "1.0.0",
      kind: "external_builder_bundle_execution_receipt",
      recorded_at: now().toISOString(),
      frozen_commit: preflightReceipt.frozen_commit,
      v2_manifest_sha256: preflightReceipt.v2_manifest_sha256,
      bundle_id: manifest.bundle_id,
      target_rule_id: manifest.target_rule_id,
      browser_zip_sha256: sha256(zipBytes),
      bundle_manifest_sha256: sha256(files.get("manifest.json")),
      exact_bundle_files: EXPECTED_FILES.length,
      browser_cli_byte_parity: {
        status: "pass",
        files_matched: EXPECTED_FILES.length,
        files_total: EXPECTED_FILES.length
      },
      baseline_regression: {
        expected: "red",
        exit_code: baseline.status,
        tests_passed: 0,
        tests_failed: 1,
        stdout_sha256: sha256(baseline.stdout),
        stderr_sha256: sha256(baseline.stderr)
      },
      supplied_repair_regression: {
        expected: "pass",
        exit_code: repaired.status,
        tests_passed: 1,
        tests_failed: 0,
        stdout_sha256: sha256(repaired.stdout),
        stderr_sha256: sha256(repaired.stderr)
      },
      supplied_repair: {
        role: "retained_reference_repair",
        sha256: sha256(candidateBytes)
      },
      witnesspatch_cli_sha256: sha256(cliBytes),
      boundary:
        "This receipt proves one frozen synthetic bundle matched the local CLI bytes, failed red on its retained baseline, and passed with the supplied retained repair. It is not clinical validation, target-in-loop counterfactual evidence, publisher attestation, adoption evidence, or a time-saved claim."
    });
    const receiptBytes = `${JSON.stringify(receipt, null, 2)}\n`;
    const absoluteReceiptPath = resolve(rootDir, receiptPath);
    await mkdir(dirname(absoluteReceiptPath), { recursive: true });
    try {
      await writeFile(absoluteReceiptPath, receiptBytes, {
        encoding: "utf8",
        flag: "wx",
        mode: 0o600
      });
    } catch {
      throw new Error("The private receipt path must be new and writable; do not overwrite an earlier attempt.");
    }
    return {
      receipt,
      receipt_sha256: sha256(receiptBytes),
      receipt_file: basename(absoluteReceiptPath)
    };
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}

export function formatReviewBundleResult(result) {
  return [
    "REVIEW BUNDLE EXECUTION PASS",
    `bundle_id=${result.receipt.bundle_id}`,
    `browser_cli_byte_parity=${result.receipt.browser_cli_byte_parity.files_matched}/${result.receipt.browser_cli_byte_parity.files_total}`,
    `baseline_regression=RED exit ${result.receipt.baseline_regression.exit_code}`,
    `supplied_repair_regression=PASS exit ${result.receipt.supplied_repair_regression.exit_code}`,
    `receipt_file=${result.receipt_file}`,
    `receipt_sha256=${result.receipt_sha256}`
  ].join("\n");
}

async function main() {
  try {
    const options = parseReviewBundleArgs(process.argv.slice(2));
    const result = await runReviewBundle(options);
    process.stdout.write(`${formatReviewBundleResult(result)}\n`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown bundle-review error.";
    process.stderr.write(`REVIEW BUNDLE EXECUTION FAIL: ${message}\n`);
    process.exitCode = 1;
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await main();
}
