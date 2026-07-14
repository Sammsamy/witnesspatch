import assert from "node:assert/strict";
import { createHash, webcrypto } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  writeFile
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  parseStoredReviewZip,
  runReviewBundle
} from "../../build/run-review-bundle.mjs";
import { runReviewPreflight } from "../../build/review-preflight.mjs";
import { createStoredBundleZip } from "../browser-bundle-zip.mjs";
import { compileBrowserWitness } from "../browser-witness-compiler.mjs";

const testDir = dirname(fileURLToPath(import.meta.url));
const rootDir = dirname(dirname(testDir));
const publicDir = join(rootDir, "public");
const manifestPath = join(publicDir, "runs", "v2", "manifest.json");

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function git(cwd, args) {
  const result = spawnSync("git", args, {
    cwd,
    encoding: "utf8",
    windowsHide: true
  });
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

async function temporaryDirectory(t, prefix) {
  const directory = await realpath(await mkdtemp(join(tmpdir(), prefix)));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
}

async function browserCompilerFixture() {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const routes = new Map();
  for (const record of manifest.files) {
    if (record.id === "case" || record.id === "baseline") {
      routes.set(record.path, await readFile(join(publicDir, record.path)));
    }
  }
  const fetchImpl = async (input) => {
    const bytes = routes.get(new URL(input).pathname);
    return {
      ok: Boolean(bytes),
      redirected: false,
      async arrayBuffer() {
        if (!bytes) return new ArrayBuffer(0);
        return bytes.buffer.slice(
          bytes.byteOffset,
          bytes.byteOffset + bytes.byteLength
        );
      }
    };
  };
  return compileBrowserWitness({
    manifest,
    fetchImpl,
    subtle: webcrypto.subtle,
    baseUrl: "https://witnesspatch.test/"
  });
}

test("review preflight binds a clean clone to both out-of-band fingerprints", async (t) => {
  const directory = await temporaryDirectory(t, "witnesspatch-preflight-");
  const fixtureDir = join(directory, "public", "runs", "v2");
  await mkdir(fixtureDir, { recursive: true });
  const manifestBytes = Buffer.from("{\"fixture\":true}\n", "utf8");
  await writeFile(join(fixtureDir, "manifest.json"), manifestBytes);
  git(directory, ["init"]);
  git(directory, ["config", "user.name", "Review Test"]);
  git(directory, ["config", "user.email", "review@example.invalid"]);
  git(directory, ["add", "."]);
  git(directory, ["commit", "-m", "Frozen fixture"]);
  const commit = git(directory, ["rev-parse", "HEAD"]);
  const manifestHash = sha256(manifestBytes);
  const fixedTime = new Date("2026-07-14T00:00:00.000Z");

  const receipt = await runReviewPreflight({
    expectedCommit: commit,
    expectedManifest: manifestHash,
    rootDir: directory,
    now: () => fixedTime
  });
  assert.equal(receipt.status, "pass");
  assert.equal(receipt.frozen_commit, commit);
  assert.equal(receipt.v2_manifest_sha256, manifestHash);
  assert.equal(receipt.repository_clean, true);
  assert.equal(receipt.checked_at, fixedTime.toISOString());

  await writeFile(join(directory, "unexpected.txt"), "dirty\n");
  await assert.rejects(
    runReviewPreflight({
      expectedCommit: commit,
      expectedManifest: manifestHash,
      rootDir: directory
    }),
    /not clean/u
  );
  await rm(join(directory, "unexpected.txt"));

  const wrongCommit = `${commit.slice(0, -1)}${commit.endsWith("0") ? "1" : "0"}`;
  await assert.rejects(
    runReviewPreflight({
      expectedCommit: wrongCommit,
      expectedManifest: manifestHash,
      rootDir: directory
    }),
    /Frozen commit mismatch/u
  );
  await assert.rejects(
    runReviewPreflight({
      expectedCommit: commit,
      expectedManifest: "0".repeat(64),
      rootDir: directory
    }),
    /V2 manifest mismatch/u
  );
});

test("review bundle runner requires exact browser/CLI bytes and real red-to-green execution", async (t) => {
  const directory = await temporaryDirectory(t, "witnesspatch-review-bundle-");
  const bundle = await browserCompilerFixture();
  const archive = createStoredBundleZip(bundle.files);
  const archivePath = join(directory, "browser-export.zip");
  const receiptPath = join(directory, "bundle-execution-receipt.json");
  await writeFile(archivePath, archive);
  const fixedCommit = "1".repeat(40);
  const fixedManifest = "2".repeat(64);
  const fixedTime = new Date("2026-07-14T00:01:00.000Z");
  const preflight = async () => ({
    checked_at: fixedTime.toISOString(),
    status: "pass",
    frozen_commit: fixedCommit,
    v2_manifest_sha256: fixedManifest,
    repository_clean: true,
    node: process.version,
    npm: "test",
    platform: "test",
    browser_entry: "test"
  });

  const result = await runReviewBundle(
    {
      expectedCommit: fixedCommit,
      expectedManifest: fixedManifest,
      bundleZip: archivePath,
      receiptPath
    },
    { rootDir, preflight, now: () => fixedTime }
  );
  assert.equal(result.receipt.browser_cli_byte_parity.status, "pass");
  assert.equal(result.receipt.browser_cli_byte_parity.files_matched, 9);
  assert.equal(result.receipt.baseline_regression.exit_code, 1);
  assert.equal(result.receipt.baseline_regression.tests_failed, 1);
  assert.equal(result.receipt.supplied_repair_regression.exit_code, 0);
  assert.equal(result.receipt.supplied_repair_regression.tests_passed, 1);
  assert.equal(result.receipt.browser_zip_sha256, sha256(archive));
  assert.equal(result.receipt.recorded_at, fixedTime.toISOString());
  assert.equal(
    sha256(await readFile(receiptPath)),
    result.receipt_sha256
  );

  const parsed = parseStoredReviewZip(archive);
  const tamperedFiles = parsed.map((entry) => ({
    path: entry.name,
    contents:
      entry.name === "run.json"
        ? Buffer.concat([Buffer.from(entry.contents), Buffer.from("\n")])
        : entry.contents
  }));
  const tamperedPath = join(directory, "tampered.zip");
  await writeFile(tamperedPath, createStoredBundleZip(tamperedFiles));
  await assert.rejects(
    runReviewBundle(
      {
        expectedCommit: fixedCommit,
        expectedManifest: fixedManifest,
        bundleZip: tamperedPath,
        receiptPath: join(directory, "tampered-receipt.json")
      },
      { rootDir, preflight, now: () => fixedTime }
    ),
    /SHA-256 mismatch/u
  );
});

test("review ZIP parser rejects archives outside the exact nine-file format", () => {
  const archive = createStoredBundleZip([
    { path: "case.json", contents: "{}\n" }
  ]);
  assert.throws(() => parseStoredReviewZip(archive), /exactly nine entries/u);
});
