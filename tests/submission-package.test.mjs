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
  "02-local-input-compiled-red.png",
  "03-reference-compiled-red.png",
  "04-reference-verified-receipt.png",
];
const expectedVisualSources = [
  "app/components/witnesspatch-lab.tsx",
  "app/components/local-witness-compiler.tsx",
  "app/globals.css",
  "app/layout.tsx",
  "app/page.tsx",
  "engine/browser-witness-compiler.mjs",
  "engine/browser-verifier.mjs",
  "public/runs/v2/clinical-scope.json",
  "public/runs/v2/manifest.json",
  "public/runs/v2/postpartum-warning-signs-baseline.json",
  "public/runs/v2/postpartum-warning-signs-case.json",
  "public/runs/v2/postpartum-warning-signs-repaired.json",
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
  assert.match(manifest, /Licensed-physician fixture review remains pending/i);
});

test("authenticated overview copy stays inside the recorded field limits", async () => {
  const draft = await readFile(
    new URL("../docs/SUBMISSION_DRAFT.md", import.meta.url),
    "utf8",
  );
  const title = extractQuotedField(draft, "Project name — 57/60 characters");
  const pitch = extractQuotedField(draft, "Elevator pitch — 185/200 characters");

  assert.equal([...title].length, 57);
  assert.ok([...title].length <= 60);
  assert.equal(
    title,
    "WitnessPatch: Time-Fenced Contracts for Healthcare Agents",
  );
  assert.equal([...pitch].length, 185);
  assert.ok([...pitch].length <= 200);
  assert.equal(
    pitch,
    "Turn a synthetic healthcare-agent failure into a replayable test, then check a fix a human must approve against locked rules—without patient data, an API key, or a model grading itself.",
  );
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

test("judge-facing clinical source lists match the exact V2 fixture evidence", async () => {
  const [urgentBytes, controlBytes, readme, physicianPacket] = await Promise.all([
    readFile(
      new URL("../cases/v2/postpartum-warning-signs.json", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL(
        "../cases/v2/postpartum-exact-negative-control.json",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(new URL("../README.md", import.meta.url), "utf8"),
    readFile(
      new URL("../docs/PHYSICIAN_REVIEW_PACKET.md", import.meta.url),
      "utf8",
    ),
  ]);
  const cases = [JSON.parse(urgentBytes), JSON.parse(controlBytes)];
  const evidenceUrls = [
    ...new Set(
      cases.flatMap((caseData) =>
        caseData.evidence.map((item) => item.url),
      ),
    ),
  ];
  assert.equal(evidenceUrls.length, 5);

  const markdownUrls = (markdown, startMarker, endMarker) => {
    const start = markdown.indexOf(startMarker);
    const end = markdown.indexOf(endMarker, start + startMarker.length);
    assert.ok(start >= 0 && end > start, `Missing bounded source list: ${startMarker}`);
    return [
      ...markdown
        .slice(start, end)
        .matchAll(/^- .*?\[[^\]]+\]\((https:\/\/[^)]+)\)$/gm),
    ].map((match) => match[1]);
  };

  assert.deepEqual(
    markdownUrls(
      readme,
      "The declared rules link to current public guidance from:",
      "The software verifies that declared source IDs resolve",
    ),
    evidenceUrls,
  );
  assert.deepEqual(
    markdownUrls(
      physicianPacket,
      "The packet uses only the five source URLs embedded in the V2 cases:",
      "The exact routing phrases",
    ),
    evidenceUrls,
  );
});

test("judge-facing current V2 fingerprints match the exact release manifest", async () => {
  const [manifestBytes, provenance, reviewPrompt] = await Promise.all([
    readFile(new URL("../public/runs/v2/manifest.json", import.meta.url)),
    readFile(
      new URL("../docs/BUILD_WEEK_PROVENANCE.md", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../docs/GPT56_PRO_REVIEW_PROMPT.md", import.meta.url),
      "utf8",
    ),
  ]);
  const manifestSha256 = sha256(manifestBytes);

  assert.match(
    provenance,
    new RegExp(
      `The current V2 manifest hash is:[\\s\\S]*?${manifestSha256}  public/runs/v2/manifest\\.json`,
    ),
  );
  assert.match(
    reviewPrompt,
    new RegExp("Current manifest SHA-256: `" + manifestSha256 + "`"),
  );
});

test("founder demo timeline stays continuous, speakable, and below three minutes", async () => {
  const [script, captions] = await Promise.all([
    readFile(new URL("../docs/DEMO_SCRIPT.md", import.meta.url), "utf8"),
    readFile(
      new URL("../submission/video/witnesspatch-demo.en.srt", import.meta.url),
      "utf8",
    ),
  ]);
  const rowPattern =
    /^\| `(\d+):(\d+)–(\d+):(\d+)` \| “([^”]+)” \|/gm;
  const rows = [...script.matchAll(rowPattern)].map((match) => ({
    start: Number(match[1]) * 60 + Number(match[2]),
    end: Number(match[3]) * 60 + Number(match[4]),
    narration: match[5],
  }));

  assert.equal(rows.length, 10);
  assert.equal(rows[0].start, 0);
  assert.equal(rows.at(-1).end, 173);
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

  const parseTimestamp = (value, cueIndex, boundary) => {
    const match = value.match(/^(\d{2}):(\d{2}):(\d{2}),(\d{3})$/);
    assert.ok(match, `Invalid ${boundary} timestamp at cue ${cueIndex}`);
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    const seconds = Number(match[3]);
    const milliseconds = Number(match[4]);
    assert.ok(minutes < 60, `Invalid minutes at cue ${cueIndex}`);
    assert.ok(seconds < 60, `Invalid seconds at cue ${cueIndex}`);
    assert.ok(milliseconds < 1000, `Invalid milliseconds at cue ${cueIndex}`);
    return ((hours * 60 + minutes) * 60 + seconds) * 1000 + milliseconds;
  };

  const captionRows = captions
    .trim()
    .split(/\r?\n\r?\n+/)
    .map((block) => {
      const [indexText, timing, ...textLines] = block.split(/\r?\n/);
      assert.match(indexText, /^\d+$/, `Invalid SRT cue index: ${indexText}`);
      const timingMatch = timing?.match(
        /^(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})$/,
      );
      const index = Number(indexText);
      assert.ok(timingMatch, `Invalid SRT timing at cue ${index}`);
      assert.ok(
        textLines.length >= 1 && textLines.length <= 2,
        `Cue ${index} must contain one or two caption lines`,
      );
      for (const line of textLines) {
        assert.equal(line, line.trim(), `Cue ${index} contains edge whitespace`);
        assert.ok(line.length > 0, `Cue ${index} contains an empty line`);
        assert.ok(
          [...line].length <= 42,
          `Cue ${index} caption line exceeds 42 characters`,
        );
      }
      return {
        index,
        startMs: parseTimestamp(timingMatch[1], index, "start"),
        endMs: parseTimestamp(timingMatch[2], index, "end"),
        narration: textLines.join(" "),
      };
    });

  assert.ok(captionRows.length >= 25 && captionRows.length <= 35);
  assert.equal(captionRows[0].startMs, 0);
  assert.equal(captionRows.at(-1).endMs, 173_000);

  const captionsByScriptRow = rows.map(() => []);
  for (const [index, caption] of captionRows.entries()) {
    assert.equal(caption.index, index + 1);
    assert.ok(caption.endMs > caption.startMs, `Cue ${caption.index} is empty`);
    const durationMs = caption.endMs - caption.startMs;
    assert.ok(
      durationMs >= 2_000 && durationMs <= 8_000,
      `Cue ${caption.index} must last between two and eight seconds`,
    );
    if (index > 0) {
      assert.equal(
        caption.startMs,
        captionRows[index - 1].endMs,
        `Cue ${caption.index} does not continue exactly from the prior cue`,
      );
    }

    const containingRows = rows
      .map((row, rowIndex) => ({ row, rowIndex }))
      .filter(
        ({ row }) =>
          caption.startMs >= row.start * 1000 &&
          caption.endMs <= row.end * 1000,
      );
    assert.equal(
      containingRows.length,
      1,
      `Cue ${caption.index} must fit wholly inside one demo-script row`,
    );
    captionsByScriptRow[containingRows[0].rowIndex].push(caption);
  }

  for (const [rowIndex, row] of rows.entries()) {
    const rowCaptions = captionsByScriptRow[rowIndex];
    assert.ok(rowCaptions.length > 0, `Demo segment ${rowIndex + 1} has no cues`);
    assert.equal(rowCaptions[0].startMs, row.start * 1000);
    assert.equal(rowCaptions.at(-1).endMs, row.end * 1000);
    assert.equal(
      rowCaptions.map((caption) => caption.narration).join(" "),
      row.narration,
      `Demo segment ${rowIndex + 1} captions changed the exact narration`,
    );
  }

  assert.equal(
    captionRows.map((caption) => caption.narration).join(" "),
    narration,
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
