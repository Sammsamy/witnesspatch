import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { createStoredBundleZip } from "../browser-bundle-zip.mjs";
import { compileBrowserWitness } from "../browser-witness-compiler.mjs";

const testDir = dirname(fileURLToPath(import.meta.url));
const rootDir = dirname(dirname(testDir));
const publicDir = join(rootDir, "public");
const manifestPath = join(publicDir, "runs", "v2", "manifest.json");
const decoder = new TextDecoder("utf-8", { fatal: true });
const encoder = new TextEncoder();

function uint16(view, offset) {
  return view.getUint16(offset, true);
}

function uint32(view, offset) {
  return view.getUint32(offset, true);
}

function independentCrc32(bytes) {
  let value = 0xffffffff;
  for (const byte of bytes) {
    value ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value & 1) === 1
        ? 0xedb88320 ^ (value >>> 1)
        : value >>> 1;
    }
  }
  return (value ^ 0xffffffff) >>> 0;
}

function parseStoredZip(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const eocdOffset = bytes.length - 22;
  assert.ok(eocdOffset >= 0);
  assert.equal(uint32(view, eocdOffset), 0x06054b50);
  assert.equal(uint16(view, eocdOffset + 4), 0);
  assert.equal(uint16(view, eocdOffset + 6), 0);
  const entryCount = uint16(view, eocdOffset + 8);
  assert.equal(uint16(view, eocdOffset + 10), entryCount);
  const centralSize = uint32(view, eocdOffset + 12);
  const centralOffset = uint32(view, eocdOffset + 16);
  assert.equal(uint16(view, eocdOffset + 20), 0);
  assert.equal(centralOffset + centralSize, eocdOffset);

  const localEntries = new Map();
  let cursor = 0;
  while (cursor < centralOffset) {
    const localOffset = cursor;
    assert.equal(uint32(view, cursor), 0x04034b50);
    assert.equal(uint16(view, cursor + 4), 20);
    assert.equal(uint16(view, cursor + 6), 0x0800);
    assert.equal(uint16(view, cursor + 8), 0);
    assert.equal(uint16(view, cursor + 10), 0);
    assert.equal(uint16(view, cursor + 12), 0x0021);
    const crc32 = uint32(view, cursor + 14);
    const compressedSize = uint32(view, cursor + 18);
    const uncompressedSize = uint32(view, cursor + 22);
    const nameLength = uint16(view, cursor + 26);
    const extraLength = uint16(view, cursor + 28);
    assert.equal(compressedSize, uncompressedSize);
    assert.equal(extraLength, 0);
    const nameStart = cursor + 30;
    const name = decoder.decode(bytes.subarray(nameStart, nameStart + nameLength));
    const dataStart = nameStart + nameLength + extraLength;
    const contents = bytes.slice(dataStart, dataStart + compressedSize);
    assert.equal(contents.length, uncompressedSize);
    assert.equal(independentCrc32(contents), crc32);
    assert.ok(!localEntries.has(name));
    localEntries.set(name, {
      name,
      localOffset,
      crc32,
      compressedSize,
      uncompressedSize,
      contents
    });
    cursor = dataStart + compressedSize;
  }
  assert.equal(cursor, centralOffset);
  assert.equal(localEntries.size, entryCount);

  const centralEntries = [];
  cursor = centralOffset;
  for (let index = 0; index < entryCount; index += 1) {
    assert.equal(uint32(view, cursor), 0x02014b50);
    assert.equal(uint16(view, cursor + 4), 20);
    assert.equal(uint16(view, cursor + 6), 20);
    assert.equal(uint16(view, cursor + 8), 0x0800);
    assert.equal(uint16(view, cursor + 10), 0);
    assert.equal(uint16(view, cursor + 12), 0);
    assert.equal(uint16(view, cursor + 14), 0x0021);
    const crc32 = uint32(view, cursor + 16);
    const compressedSize = uint32(view, cursor + 20);
    const uncompressedSize = uint32(view, cursor + 24);
    const nameLength = uint16(view, cursor + 28);
    const extraLength = uint16(view, cursor + 30);
    const commentLength = uint16(view, cursor + 32);
    assert.equal(uint16(view, cursor + 34), 0);
    assert.equal(uint16(view, cursor + 36), 0);
    assert.equal(uint32(view, cursor + 38), 0);
    const localOffset = uint32(view, cursor + 42);
    assert.equal(extraLength, 0);
    assert.equal(commentLength, 0);
    const nameStart = cursor + 46;
    const name = decoder.decode(bytes.subarray(nameStart, nameStart + nameLength));
    const local = localEntries.get(name);
    assert.ok(local, name);
    assert.equal(local.localOffset, localOffset);
    assert.equal(local.crc32, crc32);
    assert.equal(local.compressedSize, compressedSize);
    assert.equal(local.uncompressedSize, uncompressedSize);
    centralEntries.push(local);
    cursor = nameStart + nameLength + extraLength + commentLength;
  }
  assert.equal(cursor, eocdOffset);
  return centralEntries;
}

async function compilerFixture() {
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
        return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
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

test("ZIP store archive independently verifies every browser-compiled bundle entry", async () => {
  const bundle = await compilerFixture();
  assert.equal(bundle.files.length, 9);
  const expected = new Map(
    bundle.files.map(({ path, contents }) => [path, encoder.encode(contents)])
  );
  const bytes = createStoredBundleZip(bundle.files);
  assert.ok(bytes instanceof Uint8Array);
  const entries = parseStoredZip(bytes);

  assert.equal(entries.length, 9);
  assert.deepEqual(
    entries.map(({ name }) => name),
    [...expected.keys()].sort((left, right) =>
      Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"))
    )
  );
  for (const entry of entries) {
    const expectedContents = expected.get(entry.name);
    assert.ok(expectedContents, entry.name);
    assert.equal(entry.uncompressedSize, expectedContents.length);
    assert.equal(entry.compressedSize, expectedContents.length);
    assert.equal(entry.crc32, independentCrc32(expectedContents));
    assert.deepEqual(entry.contents, expectedContents);
  }
});

test("ZIP bytes are deterministic across input order and preserve safe UTF-8 paths", () => {
  const files = [
    { path: "résultats/Δ.json", contents: "{\"ok\":true}\n" },
    { path: "plain.txt", contents: new Uint8Array([0, 1, 2, 255]) }
  ];
  const forward = createStoredBundleZip(files);
  const reverse = createStoredBundleZip([...files].reverse());
  assert.deepEqual(forward, reverse);
  const parsed = parseStoredZip(forward);
  assert.deepEqual(parsed.map(({ name }) => name), ["plain.txt", "résultats/Δ.json"]);
  assert.deepEqual(parsed[0].contents, files[1].contents);
  assert.equal(decoder.decode(parsed[1].contents), files[0].contents);
});

test("ZIP creation rejects duplicate, traversal, absolute, and ambiguous paths", () => {
  assert.throws(
    () => createStoredBundleZip([
      { path: "case.json", contents: "a" },
      { path: "case.json", contents: "b" }
    ]),
    /duplicate/
  );
  assert.throws(
    () => createStoredBundleZip([{ path: "nested/../case.json", contents: "a" }]),
    /unsafe or ambiguous segment/
  );
  assert.throws(
    () => createStoredBundleZip([{ path: "/case.json", contents: "a" }]),
    /relative file path/
  );
  assert.throws(
    () => createStoredBundleZip([{ path: "nested\\case.json", contents: "a" }]),
    /relative file path/
  );
  assert.throws(
    () => createStoredBundleZip([
      { path: "café.json", contents: "a" },
      { path: "cafe\u0301.json", contents: "b" }
    ]),
    /Unicode-equivalent/
  );
});
