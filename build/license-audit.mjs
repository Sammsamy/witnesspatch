import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const lockPath = resolve(projectRoot, "package-lock.json");
const packageJsonPath = resolve(projectRoot, "package.json");
const noticesPath = resolve(projectRoot, "THIRD_PARTY_NOTICES.md");

const reviewedLicenseCounts = new Map([
  ["0BSD", 2],
  ["Apache-2.0", 40],
  ["Apache-2.0 AND LGPL-3.0-or-later", 3],
  ["Apache-2.0 AND LGPL-3.0-or-later AND MIT", 1],
  ["BlueOak-1.0.0", 1],
  ["BSD-2-Clause", 11],
  ["BSD-3-Clause", 5],
  ["CC-BY-4.0", 1],
  ["CC0-1.0", 2],
  ["ISC", 19],
  ["LGPL-3.0-or-later", 10],
  ["MIT", 497],
  ["MIT OR Apache-2.0", 3],
  ["MPL-2.0", 28],
  ["Python-2.0", 1]
]);

const lock = JSON.parse(await readFile(lockPath, "utf8"));
const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
const notices = await readFile(noticesPath, "utf8");
const packageEntries = Object.entries(lock.packages ?? {})
  .filter(([packagePath]) => packagePath !== "");
const unversioned = packageEntries.filter(([, metadata]) => !metadata?.version);
const packages = packageEntries
  .map(([packagePath, metadata]) => ({
    packagePath,
    name: metadata.name ?? packagePath.replace(/^node_modules\//, ""),
    version: metadata.version,
    license: typeof metadata.license === "string" ? metadata.license : null
  }))
  .sort((left, right) => left.packagePath.localeCompare(right.packagePath));

const canonicalInventory = packages
  .map((entry) => [entry.packagePath, entry.name, entry.version, entry.license].join("\t"))
  .join("\n") + "\n";
const inventorySha256 = createHash("sha256")
  .update(canonicalInventory)
  .digest("hex");

const missing = packages.filter((entry) => !entry.license);
const observedCounts = new Map();

for (const entry of packages) {
  if (entry.license) {
    observedCounts.set(entry.license, (observedCounts.get(entry.license) ?? 0) + 1);
  }
}

const compareText = (left, right) => left.localeCompare(right);
const observedLicenses = [...observedCounts.keys()].sort(compareText);
const reviewedLicenses = [...reviewedLicenseCounts.keys()].sort(compareText);
const unreviewed = observedLicenses.filter((license) => !reviewedLicenseCounts.has(license));
const removed = reviewedLicenses.filter((license) => !observedCounts.has(license));
const changedCounts = observedLicenses
  .filter((license) => reviewedLicenseCounts.has(license))
  .filter((license) => observedCounts.get(license) !== reviewedLicenseCounts.get(license))
  .map((license) => ({
    license,
    expected: reviewedLicenseCounts.get(license),
    observed: observedCounts.get(license)
  }));

const directPackageNames = [
  ...Object.keys(packageJson.dependencies ?? {}),
  ...Object.keys(packageJson.devDependencies ?? {}),
].sort(compareText);
const expectedDirectRows = directPackageNames.map((name) => {
  const metadata = lock.packages?.[`node_modules/${name}`];
  return [name, metadata?.version ?? null, metadata?.license ?? null];
});
const directNoticePrefix = notices.split("## Conservative locked-dependency inventory")[0];
const observedDirectRows = [...directNoticePrefix.matchAll(
  /^\| `([^`]+)` \| ([^|]+?) \| `([^`]+)` \|$/gm,
)]
  .map((match) => [match[1], match[2].trim(), match[3]])
  .sort((left, right) => left[0].localeCompare(right[0]));
const directTableMismatch =
  JSON.stringify(observedDirectRows) !== JSON.stringify(expectedDirectRows);

const observedAggregateRows = [...notices.matchAll(
  /^\| `([^`]+)` \| (\d+) \|$/gm,
)]
  .map((match) => [match[1], Number(match[2])])
  .sort((left, right) => left[0].localeCompare(right[0]));
const expectedAggregateRows = observedLicenses.map((license) => [
  license,
  observedCounts.get(license),
]);
const aggregateTableMismatch =
  JSON.stringify(observedAggregateRows) !== JSON.stringify(expectedAggregateRows);

const noticeGaps = [
  `Locked package entries inventoried: ${packages.length}`,
  `Locked dependency inventory SHA-256: \`${inventorySha256}\``,
].filter((needle) => !notices.includes(needle));

if (unversioned.length || missing.length || unreviewed.length || removed.length || changedCounts.length || directTableMismatch || aggregateTableMismatch || noticeGaps.length) {
  console.error("Locked-dependency license inventory requires review.");
  if (unversioned.length) console.error("Unversioned or linked lockfile entries:", unversioned);
  if (missing.length) console.error("Missing license metadata:", missing);
  if (unreviewed.length) console.error("Unreviewed license expressions:", unreviewed);
  if (removed.length) console.error("Previously reviewed expressions no longer present:", removed);
  if (changedCounts.length) console.error("Changed license counts:", changedCounts);
  if (directTableMismatch) {
    console.error("Direct dependency table mismatch:", {
      expected: expectedDirectRows,
      observed: observedDirectRows,
    });
  }
  if (aggregateTableMismatch) {
    console.error("Aggregate license table mismatch:", {
      expected: expectedAggregateRows,
      observed: observedAggregateRows,
    });
  }
  if (noticeGaps.length) console.error("THIRD_PARTY_NOTICES.md gaps:", noticeGaps);
  console.error(`Observed inventory SHA-256: ${inventorySha256}`);
  process.exit(1);
}

console.log(`Verified license metadata for ${packages.length} locked package entries.`);
console.log(`Inventory SHA-256: ${inventorySha256}`);
for (const license of observedLicenses) {
  console.log(`${String(observedCounts.get(license)).padStart(3)}  ${license}`);
}
console.log("Inventory only: this check does not determine which packages are embedded in a release or provide legal advice.");
