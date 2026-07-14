import { createHash } from "node:crypto";
import { lstat, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const clientRoot = join(repositoryRoot, "dist", "client");
const expectedPath = join(
  repositoryRoot,
  "submission",
  "release",
  "static-client-fingerprint.json",
);
const manifestOutputPath = join(
  repositoryRoot,
  "output",
  "release",
  "dist-client.sha256",
);

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function collectFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(path)));
    } else if (entry.isFile()) {
      files.push(path);
    } else {
      throw new Error(`Unsupported static-build entry: ${path}`);
    }
  }
  return files;
}

const expected = JSON.parse(await readFile(expectedPath, "utf8"));
if (
  expected.schema_version !== "1.0.0" ||
  expected.algorithm !== "sha256" ||
  expected.root !== "dist/client" ||
  !Number.isSafeInteger(expected.file_count) ||
  !/^[0-9a-f]{64}$/u.test(expected.manifest_sha256)
) {
  throw new Error("Invalid static-client fingerprint record.");
}

const clientRootStats = await lstat(clientRoot);
if (clientRootStats.isSymbolicLink() || !clientRootStats.isDirectory()) {
  throw new Error("Static-client root must be a real directory.");
}

const paths = await collectFiles(clientRoot);
const rows = await Promise.all(
  paths.map(async (path) => {
    const relativePath = relative(clientRoot, path).split(sep).join("/");
    if (
      !relativePath ||
      relativePath.startsWith("/") ||
      relativePath === ".." ||
      relativePath.startsWith("../") ||
      relativePath.includes("\\") ||
      /[\u0000-\u001f\u007f]/u.test(relativePath)
    ) {
      throw new Error(`Unsafe static-build path: ${relativePath}`);
    }
    return {
      relativePath,
      sha256: sha256(await readFile(path)),
    };
  }),
);
const normalizedPaths = new Set(rows.map((row) => row.relativePath));
if (normalizedPaths.size !== rows.length) {
  throw new Error("Static-client manifest contains duplicate normalized paths.");
}
rows.sort((left, right) =>
  left.relativePath < right.relativePath
    ? -1
    : left.relativePath > right.relativePath
      ? 1
      : 0,
);

const manifest = rows
  .map((row) => `${row.sha256}  ${row.relativePath}\n`)
  .join("");
const manifestSha256 = sha256(manifest);

if (rows.length !== expected.file_count) {
  throw new Error(
    `Static-client file count changed: expected ${expected.file_count}, received ${rows.length}.`,
  );
}
if (manifestSha256 !== expected.manifest_sha256) {
  throw new Error(
    `Static-client fingerprint changed: expected ${expected.manifest_sha256}, received ${manifestSha256}.`,
  );
}

await mkdir(dirname(manifestOutputPath), { recursive: true });
await writeFile(manifestOutputPath, manifest, "utf8");

console.log(`Verified ${rows.length} static-client files.`);
console.log(`Canonical manifest SHA-256: ${manifestSha256}`);
console.log(
  `Manifest: ${relative(repositoryRoot, manifestOutputPath).split(sep).join("/")}`,
);
