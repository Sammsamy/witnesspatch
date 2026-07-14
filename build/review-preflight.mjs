import { createHash } from "node:crypto";
import { readFile, realpath } from "node:fs/promises";
import { arch, release } from "node:os";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const COMMIT_PATTERN = /^[a-f0-9]{40}$/u;
const SHA256_PATTERN = /^[a-f0-9]{64}$/u;
const MINIMUM_NODE = Object.freeze({ major: 22, minor: 15 });

function requireValue(condition, message) {
  if (!condition) throw new Error(message);
}

function runGit(rootDir, args) {
  const result = spawnSync("git", args, {
    cwd: rootDir,
    encoding: "utf8",
    windowsHide: true
  });
  requireValue(
    result.error === undefined && result.status === 0,
    `Git preflight failed while running ${args[0]}.`
  );
  return result.stdout.trim();
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function assertSupportedNode(version = process.versions.node) {
  const [major, minor] = version.split(".").map(Number);
  requireValue(
    Number.isInteger(major) && Number.isInteger(minor),
    "The Node.js version could not be parsed."
  );
  requireValue(
    major > MINIMUM_NODE.major ||
      (major === MINIMUM_NODE.major && minor >= MINIMUM_NODE.minor),
    `Node.js ${MINIMUM_NODE.major}.${MINIMUM_NODE.minor} or newer is required; found ${version}.`
  );
}

function npmVersionFromEnvironment(environment = process.env) {
  return /(?:^|\s)npm\/([^\s]+)/u.exec(
    environment.npm_config_user_agent ?? ""
  )?.[1] ?? "not reported";
}

export function parseReviewPins(argv, environment = process.env) {
  const values = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    requireValue(
      key === "--expected-commit" || key === "--expected-manifest",
      `Unknown preflight argument ${JSON.stringify(key)}.`
    );
    const value = argv[index + 1];
    requireValue(
      typeof value === "string" && !value.startsWith("--"),
      `${key} requires a value.`
    );
    requireValue(!values.has(key), `${key} may be supplied only once.`);
    values.set(key, value);
    index += 1;
  }

  const expectedCommit =
    values.get("--expected-commit") ?? environment.WITNESSPATCH_REVIEW_COMMIT;
  const expectedManifest =
    values.get("--expected-manifest") ??
    environment.WITNESSPATCH_REVIEW_MANIFEST_SHA256;
  requireValue(
    COMMIT_PATTERN.test(expectedCommit ?? ""),
    "Supply the facilitator's exact 40-character lowercase commit with --expected-commit."
  );
  requireValue(
    SHA256_PATTERN.test(expectedManifest ?? ""),
    "Supply the facilitator's exact 64-character lowercase V2 manifest SHA-256 with --expected-manifest."
  );
  return { expectedCommit, expectedManifest };
}

export async function runReviewPreflight({
  expectedCommit,
  expectedManifest,
  rootDir = projectRoot,
  now = () => new Date()
}) {
  requireValue(
    COMMIT_PATTERN.test(expectedCommit ?? ""),
    "The expected review commit is invalid."
  );
  requireValue(
    SHA256_PATTERN.test(expectedManifest ?? ""),
    "The expected V2 manifest SHA-256 is invalid."
  );
  assertSupportedNode();

  const repositoryRoot = runGit(rootDir, ["rev-parse", "--show-toplevel"]);
  requireValue(
    (await realpath(repositoryRoot)) === (await realpath(rootDir)),
    "Run the review preflight from the repository root."
  );
  const actualCommit = runGit(rootDir, ["rev-parse", "HEAD"]);
  requireValue(
    actualCommit === expectedCommit,
    `Frozen commit mismatch: expected ${expectedCommit}, found ${actualCommit}.`
  );
  const status = runGit(rootDir, [
    "status",
    "--porcelain=v1",
    "--untracked-files=all"
  ]);
  requireValue(
    status.length === 0,
    "Repository is not clean. Preserve this attempt and start a separately labeled rerun from a clean clone."
  );

  const manifestBytes = await readFile(
    resolve(rootDir, "public", "runs", "v2", "manifest.json")
  );
  const actualManifest = sha256(manifestBytes);
  requireValue(
    actualManifest === expectedManifest,
    `V2 manifest mismatch: expected ${expectedManifest}, found ${actualManifest}.`
  );

  return Object.freeze({
    checked_at: now().toISOString(),
    status: "pass",
    frozen_commit: actualCommit,
    v2_manifest_sha256: actualManifest,
    repository_clean: true,
    node: process.version,
    npm: npmVersionFromEnvironment(),
    platform: `${process.platform} ${release()} ${arch()}`,
    browser_entry: "use the exact local URL printed by the development server"
  });
}

export function formatReviewPreflight(receipt) {
  return [
    "REVIEW PREFLIGHT PASS",
    `checked_at=${receipt.checked_at}`,
    `frozen_commit=${receipt.frozen_commit}`,
    `v2_manifest_sha256=${receipt.v2_manifest_sha256}`,
    "repository_clean=yes",
    `node=${receipt.node}`,
    `npm=${receipt.npm}`,
    `platform=${receipt.platform}`,
    `browser_entry=${receipt.browser_entry}`
  ].join("\n");
}

async function main() {
  try {
    const pins = parseReviewPins(process.argv.slice(2));
    const receipt = await runReviewPreflight(pins);
    process.stdout.write(`${formatReviewPreflight(receipt)}\n`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown preflight error.";
    process.stderr.write(`REVIEW PREFLIGHT FAIL: ${message}\n`);
    process.exitCode = 1;
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await main();
}
