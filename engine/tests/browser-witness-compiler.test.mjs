import assert from "node:assert/strict";
import { createHash, webcrypto } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { compileBrowserWitness } from "../browser-witness-compiler.mjs";
import { compileWitnessBundle } from "../compile-witness.mjs";
import { caseFingerprint } from "../core.mjs";

const testDir = dirname(fileURLToPath(import.meta.url));
const rootDir = dirname(dirname(testDir));
const publicDir = join(rootDir, "public");
const manifestPath = join(publicDir, "runs", "v2", "manifest.json");

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

test("browser compilation byte-matches the Node compiler for the exact public inputs", async () => {
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
