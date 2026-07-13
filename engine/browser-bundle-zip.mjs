const UTF8_FLAG = 0x0800;
const STORE_METHOD = 0;
const VERSION_NEEDED = 20;
const DOS_TIME = 0;
const DOS_DATE = 0x0021; // 1980-01-01, the earliest ZIP timestamp.
const UINT16_MAX = 0xffff;
const UINT32_MAX = 0xffffffff;
const LOCAL_HEADER_BYTES = 30;
const CENTRAL_HEADER_BYTES = 46;
const END_OF_CENTRAL_DIRECTORY_BYTES = 22;

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
  if (!condition) {
    throw new Error(`ZIP creation failed: ${message}`);
  }
}

function hasUnpairedSurrogate(value) {
  for (let index = 0; index < value.length; index += 1) {
    const unit = value.charCodeAt(index);
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return true;
      index += 1;
    } else if (unit >= 0xdc00 && unit <= 0xdfff) {
      return true;
    }
  }
  return false;
}

function assertSafePath(path) {
  requireValue(typeof path === "string" && path.length > 0, "each path must be a non-empty string.");
  requireValue(!hasUnpairedSurrogate(path), `path ${JSON.stringify(path)} is not valid Unicode.`);
  requireValue(
    !path.startsWith("/") && !path.endsWith("/") && !path.includes("\\"),
    `path ${JSON.stringify(path)} must be a relative file path using forward slashes.`
  );
  requireValue(
    !/[\u0000-\u001f\u007f-\u009f:*?"<>|]/u.test(path),
    `path ${JSON.stringify(path)} contains a control or extraction-unsafe character.`
  );
  const segments = path.split("/");
  requireValue(
    segments.every(
      (segment) =>
        segment.length > 0 &&
        segment !== "." &&
        segment !== ".." &&
        !/[. ]$/u.test(segment) &&
        !/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/iu.test(segment)
    ),
    `path ${JSON.stringify(path)} contains an unsafe or ambiguous segment.`
  );
}

function toBytes(contents, encoder, path) {
  if (typeof contents === "string") return encoder.encode(contents);
  requireValue(
    contents instanceof Uint8Array,
    `contents for ${JSON.stringify(path)} must be a string or Uint8Array.`
  );
  return new Uint8Array(contents.buffer, contents.byteOffset, contents.byteLength);
}

function crc32(bytes) {
  let value = UINT32_MAX;
  for (const byte of bytes) {
    value = CRC32_TABLE[(value ^ byte) & 0xff] ^ (value >>> 8);
  }
  return (value ^ UINT32_MAX) >>> 0;
}

function compareBytes(left, right) {
  const commonLength = Math.min(left.length, right.length);
  for (let index = 0; index < commonLength; index += 1) {
    if (left[index] !== right[index]) return left[index] - right[index];
  }
  return left.length - right.length;
}

function writeUint16(view, offset, value) {
  view.setUint16(offset, value, true);
  return offset + 2;
}

function writeUint32(view, offset, value) {
  view.setUint32(offset, value, true);
  return offset + 4;
}

function writeLocalHeader(view, offset, entry) {
  let cursor = offset;
  cursor = writeUint32(view, cursor, 0x04034b50);
  cursor = writeUint16(view, cursor, VERSION_NEEDED);
  cursor = writeUint16(view, cursor, UTF8_FLAG);
  cursor = writeUint16(view, cursor, STORE_METHOD);
  cursor = writeUint16(view, cursor, DOS_TIME);
  cursor = writeUint16(view, cursor, DOS_DATE);
  cursor = writeUint32(view, cursor, entry.crc32);
  cursor = writeUint32(view, cursor, entry.contents.length);
  cursor = writeUint32(view, cursor, entry.contents.length);
  cursor = writeUint16(view, cursor, entry.name.length);
  cursor = writeUint16(view, cursor, 0);
  return cursor;
}

function writeCentralHeader(view, offset, entry) {
  let cursor = offset;
  cursor = writeUint32(view, cursor, 0x02014b50);
  cursor = writeUint16(view, cursor, VERSION_NEEDED);
  cursor = writeUint16(view, cursor, VERSION_NEEDED);
  cursor = writeUint16(view, cursor, UTF8_FLAG);
  cursor = writeUint16(view, cursor, STORE_METHOD);
  cursor = writeUint16(view, cursor, DOS_TIME);
  cursor = writeUint16(view, cursor, DOS_DATE);
  cursor = writeUint32(view, cursor, entry.crc32);
  cursor = writeUint32(view, cursor, entry.contents.length);
  cursor = writeUint32(view, cursor, entry.contents.length);
  cursor = writeUint16(view, cursor, entry.name.length);
  cursor = writeUint16(view, cursor, 0);
  cursor = writeUint16(view, cursor, 0);
  cursor = writeUint16(view, cursor, 0);
  cursor = writeUint16(view, cursor, 0);
  cursor = writeUint32(view, cursor, 0);
  cursor = writeUint32(view, cursor, entry.localOffset);
  return cursor;
}

/**
 * Build a deterministic, dependency-free ZIP archive using the store method.
 *
 * `files` is an iterable of `{ path, contents }`; contents may be a string or
 * Uint8Array. Entries are ordered by their UTF-8 filename bytes and timestamps
 * are fixed, so equivalent input sets produce identical archive bytes.
 */
export function createStoredBundleZip(files) {
  requireValue(files != null && typeof files[Symbol.iterator] === "function", "files must be iterable.");
  const encoder = new TextEncoder();
  const collisionKeys = new Set();
  const entries = [];

  for (const file of files) {
    requireValue(file !== null && typeof file === "object", "each file must be an object.");
    assertSafePath(file.path);
    const collisionKey = file.path.normalize("NFC");
    requireValue(
      !collisionKeys.has(collisionKey),
      `duplicate or Unicode-equivalent path ${JSON.stringify(file.path)}.`
    );
    collisionKeys.add(collisionKey);
    const name = encoder.encode(file.path);
    requireValue(name.length <= UINT16_MAX, `path ${JSON.stringify(file.path)} is too long for ZIP.`);
    const contents = toBytes(file.contents, encoder, file.path);
    requireValue(contents.length <= UINT32_MAX, `file ${JSON.stringify(file.path)} is too large for ZIP32.`);
    entries.push({
      path: file.path,
      name,
      contents,
      crc32: crc32(contents),
      localOffset: 0
    });
  }

  requireValue(entries.length <= UINT16_MAX, "there are too many entries for ZIP32.");
  entries.sort((left, right) => compareBytes(left.name, right.name));

  let localBytes = 0;
  for (const entry of entries) {
    entry.localOffset = localBytes;
    localBytes += LOCAL_HEADER_BYTES + entry.name.length + entry.contents.length;
    requireValue(localBytes <= UINT32_MAX, "local file data exceeds the ZIP32 limit.");
  }
  let centralBytes = 0;
  for (const entry of entries) {
    centralBytes += CENTRAL_HEADER_BYTES + entry.name.length;
    requireValue(centralBytes <= UINT32_MAX, "central directory exceeds the ZIP32 limit.");
  }
  const archiveBytes = localBytes + centralBytes + END_OF_CENTRAL_DIRECTORY_BYTES;
  requireValue(archiveBytes <= UINT32_MAX, "archive exceeds the ZIP32 limit.");

  const output = new Uint8Array(archiveBytes);
  const view = new DataView(output.buffer);
  let cursor = 0;
  for (const entry of entries) {
    cursor = writeLocalHeader(view, cursor, entry);
    output.set(entry.name, cursor);
    cursor += entry.name.length;
    output.set(entry.contents, cursor);
    cursor += entry.contents.length;
  }
  requireValue(cursor === localBytes, "internal local-directory size mismatch.");
  for (const entry of entries) {
    cursor = writeCentralHeader(view, cursor, entry);
    output.set(entry.name, cursor);
    cursor += entry.name.length;
  }
  requireValue(cursor === localBytes + centralBytes, "internal central-directory size mismatch.");

  cursor = writeUint32(view, cursor, 0x06054b50);
  cursor = writeUint16(view, cursor, 0);
  cursor = writeUint16(view, cursor, 0);
  cursor = writeUint16(view, cursor, entries.length);
  cursor = writeUint16(view, cursor, entries.length);
  cursor = writeUint32(view, cursor, centralBytes);
  cursor = writeUint32(view, cursor, localBytes);
  cursor = writeUint16(view, cursor, 0);
  requireValue(cursor === output.length, "internal archive size mismatch.");
  return output;
}
