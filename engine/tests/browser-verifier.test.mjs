import assert from "node:assert/strict";
import { createHash, webcrypto } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { verifyBrowserArtifacts } from "../browser-verifier.mjs";

const testDir = dirname(fileURLToPath(import.meta.url));
const rootDir = dirname(dirname(testDir));
const publicDir = join(rootDir, "public");
const manifestPath = join(publicDir, "runs", "manifest.json");
const baseUrl = "https://witnesspatch.test/demo/";
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function encodeJson(value) {
  return encoder.encode(`${JSON.stringify(value, null, 2)}\n`);
}

async function loadBrowserFixture() {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const files = new Map();

  for (const record of manifest.files) {
    const relativePath = record.path.replace(/^\/+/, "");
    files.set(record.path, new Uint8Array(await readFile(join(publicDir, relativePath))));
  }

  return { manifest, files };
}

function artifactRecord(manifest, id) {
  const record = manifest.files.find((item) => item.id === id);
  assert.ok(record, `Missing fixture manifest record ${id}.`);
  return record;
}

function replaceAndRehash(fixture, id, bytes) {
  const record = artifactRecord(fixture.manifest, id);
  const replacement = Uint8Array.from(bytes);
  fixture.files.set(record.path, replacement);
  record.bytes = replacement.byteLength;
  record.sha256 = sha256(replacement);
}

function responseFor(bytes, url, options = {}) {
  const body = Uint8Array.from(bytes ?? []);
  const status = options.status ?? 200;
  const responseUrl = options.url ?? url;

  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? "OK" : "Not Found",
    redirected: options.redirected ?? false,
    url: responseUrl,
    headers: new Headers({ "content-type": "application/octet-stream" }),
    async arrayBuffer() {
      return body.buffer.slice(0);
    },
    async text() {
      return decoder.decode(body);
    },
    async json() {
      return JSON.parse(decoder.decode(body));
    },
    async blob() {
      return new Blob([body]);
    }
  };
}

function createFetch(files, options = {}) {
  const calls = [];
  const fetchImpl = async (input, init = {}) => {
    const rawUrl =
      typeof input === "string" || input instanceof URL ? String(input) : input.url;
    const url = new URL(rawUrl, baseUrl);
    calls.push({ url: url.href, init });

    if (options.redirectPath === url.pathname) {
      return responseFor(files.get(url.pathname), url.href, {
        redirected: true,
        url: new URL("/runs/redirected-artifact.json", baseUrl).href
      });
    }

    if (options.notFoundPath === url.pathname) {
      return responseFor([], url.href, { status: 404 });
    }

    const bytes = files.get(url.pathname);
    return bytes
      ? responseFor(bytes, url.href)
      : responseFor([], url.href, { status: 404 });
  };

  return { fetchImpl, calls };
}

async function verify(fixture, overrides = {}) {
  const mocked = createFetch(fixture.files, overrides.fetchOptions);
  const promise = Promise.resolve().then(() =>
    verifyBrowserArtifacts({
      manifest: fixture.manifest,
      fetchImpl: mocked.fetchImpl,
      subtle: Object.hasOwn(overrides, "subtle")
        ? overrides.subtle
        : webcrypto.subtle,
      baseUrl
    })
  );
  return { promise, calls: mocked.calls };
}

test("browser verifier proves exact bytes, fresh regrades, and deterministic holdouts", async () => {
  const fixture = await loadBrowserFixture();
  const { promise, calls } = await verify(fixture);
  const receipt = await promise;

  assert.equal(receipt.status, "pass");
  assert.deepEqual(receipt.hashes, {
    verified: fixture.manifest.files.length,
    total: fixture.manifest.files.length
  });
  assert.deepEqual(receipt.regrades, { verified: 2, total: 2 });
  assert.deepEqual(receipt.holdouts, { passed: 13, total: 13 });
  assert.equal(calls.length, fixture.manifest.files.length);
  for (const call of calls) {
    assert.equal(new URL(call.url).origin, new URL(baseUrl).origin);
    assert.equal(call.init.redirect, "error");
    assert.equal(call.init.cache, "no-store");
  }
});

test("browser verifier rejects a same-length byte tamper", async () => {
  const fixture = await loadBrowserFixture();
  const baseline = artifactRecord(fixture.manifest, "baseline");
  const tampered = Uint8Array.from(fixture.files.get(baseline.path));
  const index = tampered.findIndex((value) => value === "f".charCodeAt(0));
  assert.notEqual(index, -1);
  tampered[index] = "p".charCodeAt(0);
  assert.equal(tampered.byteLength, baseline.bytes);
  fixture.files.set(baseline.path, tampered);

  const { promise } = await verify(fixture);
  await assert.rejects(promise, /hash|sha-?256|integrity/i);
});

test("browser verifier rejects a truncated response", async () => {
  const fixture = await loadBrowserFixture();
  const repaired = artifactRecord(fixture.manifest, "repaired");
  const original = fixture.files.get(repaired.path);
  fixture.files.set(repaired.path, original.slice(0, -1));

  const { promise } = await verify(fixture);
  await assert.rejects(promise, /byte|length|size|hash|integrity/i);
});

test("browser verifier rejects a missing artifact", async () => {
  const fixture = await loadBrowserFixture();
  const holdouts = artifactRecord(fixture.manifest, "holdouts");
  const { promise } = await verify(fixture, {
    fetchOptions: { notFoundPath: holdouts.path }
  });

  await assert.rejects(promise, /fetch|http|404|artifact/i);
});

test("browser verifier rejects a redirected artifact response", async () => {
  const fixture = await loadBrowserFixture();
  const sourceCase = artifactRecord(fixture.manifest, "case");
  const { promise } = await verify(fixture, {
    fetchOptions: { redirectPath: sourceCase.path }
  });

  await assert.rejects(promise, /redirect/i);
});

test("browser verifier rejects unsafe and cross-origin manifest paths before fetching", async () => {
  for (const unsafePath of [
    "/runs/../private.json",
    "../private.json",
    "https://evil.example/runs/postpartum-warning-signs-case.json"
  ]) {
    const fixture = await loadBrowserFixture();
    artifactRecord(fixture.manifest, "case").path = unsafePath;
    const { promise, calls } = await verify(fixture);

    await assert.rejects(promise, /path|unsafe|origin|same-origin|runs/i);
    assert.equal(calls.length, 0, `Unsafe path was fetched: ${unsafePath}`);
  }
});

test("browser verifier catches stored evaluation drift after a valid rehash", async () => {
  const fixture = await loadBrowserFixture();
  const baselineRecord = artifactRecord(fixture.manifest, "baseline");
  const baseline = JSON.parse(decoder.decode(fixture.files.get(baselineRecord.path)));
  baseline.evaluation.score += 1;
  replaceAndRehash(fixture, "baseline", encodeJson(baseline));

  const { promise } = await verify(fixture);
  await assert.rejects(promise, /evaluation|regrade|drift|baseline/i);
});

test("browser verifier recomputes holdout expectations instead of trusting stored green checks", async () => {
  const fixture = await loadBrowserFixture();
  const holdoutRecord = artifactRecord(fixture.manifest, "holdouts");
  const holdouts = JSON.parse(decoder.decode(fixture.files.get(holdoutRecord.path)));
  const golden = holdouts.checks.find((check) => check.id === "HOLD-01");
  assert.ok(golden);
  golden.expected.score = 99;
  replaceAndRehash(fixture, "holdouts", encodeJson(holdouts));

  const { promise } = await verify(fixture);
  await assert.rejects(promise, /holdout|expectation|drift/i);
});

test("browser verifier fails closed when WebCrypto SubtleCrypto is unavailable", async () => {
  const fixture = await loadBrowserFixture();
  const { promise, calls } = await verify(fixture, { subtle: null });

  await assert.rejects(promise, /webcrypto|subtle|digest|sha-?256/i);
  assert.equal(calls.length, 0);
});
