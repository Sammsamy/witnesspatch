import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import { isAbsolute, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const mediaDirectory = new URL("../submission/media/", import.meta.url);
const fiveMegabytes = 5 * 1024 * 1024;
const expectedImages = [
  "01-thumbnail-failure.png",
  "02-compiled-red-regression.png",
  "03-verified-receipt.png",
];
const expectedVisualSources = [
  "app/components/witnesspatch-lab.tsx",
  "app/globals.css",
  "public/favicon.svg",
];

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function parseManifestRows(markdown) {
  const rows = new Map();
  const rowPattern =
    /^\| `([^`]+\.png)` \|.*\| (\d+) x (\d+) \| (\d+) \| `([0-9a-f]{64})` \|$/gm;
  for (const match of markdown.matchAll(rowPattern)) {
    rows.set(match[1], {
      width: Number(match[2]),
      height: Number(match[3]),
      bytes: Number(match[4]),
      sha256: match[5],
    });
  }
  return rows;
}

function parseSourceRows(markdown) {
  const rows = new Map();
  const rowPattern = /^\| `([^`]+)` \| `([0-9a-f]{64})` \|$/gm;
  for (const match of markdown.matchAll(rowPattern)) rows.set(match[1], match[2]);
  return rows;
}

function extractQuotedField(markdown, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = markdown.match(
    new RegExp(`\\*\\*${escaped}\\*\\*\\n\\n> ([^\\n]+)`),
  );
  assert.ok(match, `Missing exact submission field: ${label}`);
  return match[1];
}

test("Devpost media are exact 3:2 PNGs within the declared upload boundary", async () => {
  const entries = (await readdir(mediaDirectory))
    .filter((name) => /\.(?:png|jpe?g|gif)$/i.test(name))
    .sort();
  assert.deepEqual(entries, expectedImages);
  assert.ok(entries.length <= 15);

  const manifest = await readFile(
    new URL("../submission/media/MANIFEST.md", import.meta.url),
    "utf8",
  );
  const rows = parseManifestRows(manifest);
  assert.equal(rows.size, expectedImages.length);
  const sourceRows = parseSourceRows(manifest);
  assert.deepEqual([...sourceRows.keys()].sort(), [...expectedVisualSources].sort());

  for (const name of expectedVisualSources) {
    const bytes = await readFile(new URL(`../${name}`, import.meta.url));
    assert.equal(sourceRows.get(name), sha256(bytes), `${name} changed after capture`);
  }

  for (const name of expectedImages) {
    const url = new URL(`../submission/media/${name}`, import.meta.url);
    const [bytes, metadata] = await Promise.all([readFile(url), stat(url)]);
    const row = rows.get(name);
    assert.ok(row, `${name} is missing from the media manifest`);

    assert.deepEqual(
      [...bytes.subarray(0, 8)],
      [137, 80, 78, 71, 13, 10, 26, 10],
      `${name} is not a PNG`,
    );
    assert.equal(bytes.subarray(12, 16).toString("ascii"), "IHDR");
    assert.equal(bytes.readUInt32BE(16), 1200);
    assert.equal(bytes.readUInt32BE(20), 800);
    assert.equal(bytes[24], 8, `${name} must use 8-bit color`);
    assert.ok(
      bytes[25] === 2 || bytes[25] === 6,
      `${name} must use RGB or RGBA color`,
    );
    assert.equal(bytes[26], 0, `${name} must use PNG compression method 0`);
    assert.equal(bytes[27], 0, `${name} must use PNG filter method 0`);
    assert.equal(bytes[28], 0, `${name} must be non-interlaced`);
    assert.ok(metadata.size < fiveMegabytes, `${name} exceeds 5 MB`);
    assert.equal(row.width, 1200);
    assert.equal(row.height, 800);
    assert.equal(row.bytes, metadata.size);
    assert.equal(row.sha256, sha256(bytes));
  }

  assert.match(manifest, /fully synthetic/i);
  assert.match(manifest, /not clinical decision support/i);
  assert.match(manifest, /Physician validation remains pending/i);
});

test("authenticated overview copy stays inside the recorded field limits", async () => {
  const draft = await readFile(
    new URL("../docs/SUBMISSION_DRAFT.md", import.meta.url),
    "utf8",
  );
  const title = extractQuotedField(draft, "Project name — 50/60 characters");
  const pitch = extractQuotedField(draft, "Elevator pitch — 191/200 characters");

  assert.equal([...title].length, 50);
  assert.ok([...title].length <= 60);
  assert.equal([...pitch].length, 191);
  assert.ok([...pitch].length <= 200);
  assert.doesNotMatch(draft, /`OpenAI API`,/);

  const tagsSection = draft.match(
    /Use these `22\/25` tags:\n\n([^\n]+)\n/,
  );
  assert.ok(tagsSection, "Missing the exact Built with tag list");
  const tags = [...tagsSection[1].matchAll(/`([^`]+)`/g)].map(
    (match) => match[1],
  );
  assert.equal(tags.length, 22);
  assert.equal(new Set(tags).size, 22);
  assert.ok(!tags.includes("OpenAI API"));
});

test("founder demo timeline stays continuous, speakable, and below three minutes", async () => {
  const script = await readFile(
    new URL("../docs/DEMO_SCRIPT.md", import.meta.url),
    "utf8",
  );
  const rowPattern =
    /^\| `(\d+):(\d+)–(\d+):(\d+)` \| “([^”]+)” \|/gm;
  const rows = [...script.matchAll(rowPattern)].map((match) => ({
    start: Number(match[1]) * 60 + Number(match[2]),
    end: Number(match[3]) * 60 + Number(match[4]),
    narration: match[5],
  }));

  assert.equal(rows.length, 10);
  assert.equal(rows[0].start, 0);
  assert.equal(rows.at(-1).end, 158);
  assert.ok(rows.at(-1).end < 180);

  for (const [index, row] of rows.entries()) {
    assert.ok(row.end > row.start);
    if (index > 0) assert.equal(row.start, rows[index - 1].end);
    const wordCount = row.narration.match(/\S+/g)?.length ?? 0;
    const wordsPerMinute = wordCount / ((row.end - row.start) / 60);
    assert.ok(
      wordsPerMinute <= 145,
      `Demo segment ${index + 1} requires ${wordsPerMinute.toFixed(1)} wpm`,
    );
  }

  const narration = rows.map((row) => row.narration).join(" ");
  const totalWords = narration.match(/\S+/g)?.length ?? 0;
  assert.ok(totalWords <= 330);
  assert.doesNotMatch(
    narration,
    /clinically validated|tamper-proof|Sol fixed it|HIPAA compliant|saves lives|production-ready/i,
  );
});

test("submission package paths remain inside the repository", () => {
  for (const url of [
    mediaDirectory,
    new URL("../docs/SUBMISSION_DRAFT.md", import.meta.url),
    new URL("../submission/media/MANIFEST.md", import.meta.url),
  ]) {
    const candidate = fileURLToPath(url);
    const candidateRelative = relative(repositoryRoot, candidate);
    assert.notEqual(candidateRelative, "");
    assert.ok(!isAbsolute(candidateRelative));
    assert.ok(candidateRelative !== "..");
    assert.ok(!candidateRelative.startsWith(`..${sep}`));
  }
});
