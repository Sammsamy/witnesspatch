import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  mkdir,
  mkdtemp,
  readdir,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { isAbsolute, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  founderCaptionsFromAi,
  parseFounderVideoArguments,
  reviewedScreenMaster,
  validateFounderMedia,
} from "../build/assemble-founder-video.mjs";
import {
  freezeFinalRelease,
  parseAvmediainfoReport,
  parseFfprobeReport,
  parseFreezeArguments,
  parseStaticClientManifest,
  selectSuccessfulVerifyRun,
  validateDeploymentUrl,
  validateFeedbackSessionId,
  validateNarrationConfirmations,
  validateRepositoryUrl,
  validateYouTubeUrl,
} from "../build/freeze-final-release.mjs";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const mediaDirectory = new URL("../submission/media/", import.meta.url);
const fiveMegabytes = 5 * 1024 * 1024;
const expectedImages = [
  "01-thumbnail-failure.png",
  "02-local-input-compiled-red.png",
  "03-reference-compiled-red.png",
  "04-reference-verified-receipt.png",
  "05-reference-success-closure.png",
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
  assert.match(manifest, /No physician fixture\/wording review or clinical validation was performed/i);
});

test("submission overview copy stays inside the recorded field limits", async () => {
  const draft = await readFile(
    new URL("../docs/SUBMISSION_DRAFT.md", import.meta.url),
    "utf8",
  );
  const title = extractQuotedField(draft, "Project name — 57/60 characters");
  const pitch = extractQuotedField(draft, "Elevator pitch — 178/200 characters");

  assert.equal([...title].length, 57);
  assert.ok([...title].length <= 60);
  assert.equal(
    title,
    "WitnessPatch: Time-Fenced Contracts for Healthcare Agents",
  );
  assert.equal([...pitch].length, 178);
  assert.ok([...pitch].length <= 200);
  assert.equal(
    pitch,
    "Turn one synthetic missed deadline into a portable red test: freeze what the agent knew, check whether action happened on time, then verify any repair offline before trusting it.",
  );
  assert.match(draft, /## Inspiration\n/);
  assert.match(draft, /## Approach\n/);
  assert.match(draft, /## Challenges\n/);
  assert.match(draft, /## What I learned\n/);
  assert.doesNotMatch(draft, /`OpenAI API`,/);
  const story = draft.match(
    /<!-- DEVPOST_STORY_START -->\n([\s\S]*?)\n<!-- DEVPOST_STORY_END -->/,
  );
  assert.ok(story, "Missing the exact bounded Devpost story");
  const storyWordCount = story[1].match(/\b[\w'-]+\b/g)?.length ?? 0;
  assert.ok(storyWordCount >= 650 && storyWordCount <= 850);

  const tagsSection = draft.match(
    /Devpost normalized the saved selection to these `22\/25` tags:\n\n([^\n]+)\n/,
  );
  assert.ok(tagsSection, "Missing the exact Built with tag list");
  const tags = [...tagsSection[1].matchAll(/`([^`]+)`/g)].map(
    (match) => match[1],
  );
  assert.equal(tags.length, 22);
  assert.equal(new Set(tags).size, 22);
  assert.ok(!tags.includes("OpenAI API"));
  assert.deepEqual(tags, [
    "GPT-5.6",
    "Tailwind",
    "Cloudflare",
    "JSON",
    "Web",
    "Crypto",
    "GitHub",
    "AI",
    "Agent",
    "Regression",
    "Synthetic",
    "Healthcare",
    "Node.js",
    "JavaScript",
    "TypeScript",
    "React",
    "Next.js",
    "Vite",
    "OpenAI",
    "Developer",
    "Open",
    "CI/CD",
  ]);
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
  const [manifestBytes, provenance] = await Promise.all([
    readFile(new URL("../public/runs/v2/manifest.json", import.meta.url)),
    readFile(
      new URL("../docs/BUILD_WEEK_PROVENANCE.md", import.meta.url),
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
});

test("the reviewed static-client fingerprint is enforced and documented", async () => {
  const [recordBytes, packageBytes, workflow, ...documents] = await Promise.all([
    readFile(
      new URL(
        "../submission/release/static-client-fingerprint.json",
        import.meta.url,
      ),
      "utf8",
    ),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(
      new URL("../.github/workflows/verify.yml", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../README.md", import.meta.url), "utf8"),
    readFile(
      new URL("../docs/CLEAN_CHECKOUT_RECEIPT.md", import.meta.url),
      "utf8",
    ),
    readFile(
      new URL("../docs/SUBMISSION_DRAFT.md", import.meta.url),
      "utf8",
    ),
  ]);
  const record = JSON.parse(recordBytes);
  const packageData = JSON.parse(packageBytes);

  assert.equal(record.schema_version, "1.0.0");
  assert.equal(record.algorithm, "sha256");
  assert.equal(record.root, "dist/client");
  assert.equal(record.file_count, 55);
  assert.match(record.manifest_sha256, /^[0-9a-f]{64}$/u);
  for (const document of documents) {
    assert.ok(
      document.includes(record.manifest_sha256),
      "A current release-evidence document has a stale static fingerprint",
    );
  }

  const [
    notices,
    assetProvenance,
    repositoryInstructions,
    verifierInstructions,
    verifierAgent,
    workflowSkill,
  ] =
    await Promise.all([
      readFile(new URL("../THIRD_PARTY_NOTICES.md", import.meta.url), "utf8"),
      readFile(
        new URL("../docs/ASSET_PROVENANCE.md", import.meta.url),
        "utf8",
      ),
      readFile(new URL("../AGENTS.md", import.meta.url), "utf8"),
      readFile(
        new URL("../.agents/artifact-verifier.md", import.meta.url),
        "utf8",
      ),
      readFile(
        new URL("../.codex/agents/artifact-verifier.toml", import.meta.url),
        "utf8",
      ),
      readFile(
        new URL("../.codex/skills/witnesspatch/SKILL.md", import.meta.url),
        "utf8",
      ),
    ]);
  assert.match(notices, /publicly distributed under the repository's MIT License/u);
  assert.match(notices, /entrant-authored WitnessPatch assets/u);
  assert.match(assetProvenance, /entrant-created geometric artwork/u);
  for (const instructions of [
    repositoryInstructions,
    verifierInstructions,
    verifierAgent,
    workflowSkill,
  ]) {
    assert.doesNotMatch(instructions, /94 core tests|4 rendered tests/u);
    assert.doesNotMatch(instructions, /physician validation pending/iu);
    assert.match(instructions, /clinical_validation(?::|`) (?:`?not_claimed|not claimed)/u);
  }
  for (const internalPath of [
    "../docs/JUDGE_SCORECARD.md",
    "../docs/GPT56_PRO_REVIEW_PROMPT.md",
    "../docs/CODEX_CREDIT_REQUEST.md",
    "../docs/SUBMISSION_FORM_CHECKLIST.md",
    "../docs/OFFICIAL_REQUIREMENTS_AUDIT.md",
    "../docs/SAME_DAY_VALIDATION_PROTOCOL.md",
    "../docs/VALIDATION_OUTREACH_DRAFTS.md",
    "../docs/VALIDATION_PLAN.md",
  ]) {
    await assert.rejects(
      readFile(new URL(internalPath, import.meta.url), "utf8"),
      (error) => error?.code === "ENOENT",
      `Internal-only file remains in the public release tree: ${internalPath}`,
    );
  }

  assert.equal(
    packageData.scripts["release:fingerprint"],
    "node build/verify-static-fingerprint.mjs",
  );
  assert.equal(
    packageData.scripts.demo,
    "node targets/demo-agent/v2/run-demo.mjs",
  );
  assert.equal(
    packageData.scripts["judge:proof"],
    "node build/run-judge-proof.mjs",
  );
  assert.match(
    packageData.scripts["deploy:dry-run"],
    /npm run release:static:check && npm run release:fingerprint && CI=1 wrangler deploy/u,
  );
  assert.match(
    packageData.scripts["deploy:free"],
    /npm run release:static:check && npm run release:fingerprint && wrangler deploy/u,
  );
  assert.match(
    packageData.scripts["verify:release"],
    /&& npm run deploy:dry-run$/u,
  );
  assert.match(workflow, /npm run verify:release/u);
  assert.match(workflow, /npm run judge:proof/u);
  assert.match(workflow, /GITHUB_STEP_SUMMARY/u);
  assert.match(workflow, /output\/release\/judge-proof\.log/u);
  assert.match(workflow, /output\/release\/dist-client\.sha256/u);
  assert.match(workflow, /include-hidden-files:\s+true/u);
  assert.match(workflow, /persist-credentials:\s+false/u);
  assert.match(workflow, /github\.run_attempt/u);

  const actionRefs = [...workflow.matchAll(/^\s*uses:\s+\S+@(\S+)/gmu)].map(
    (match) => match[1],
  );
  assert.ok(actionRefs.length > 0, "The workflow must use pinned actions");
  for (const actionRef of actionRefs) {
    assert.match(
      actionRef,
      /^[0-9a-f]{40}$/u,
      `Workflow action is not pinned to a full commit SHA: ${actionRef}`,
    );
  }
});

test("the threat model preserves the exact integrity and non-claim boundary", async () => {
  const threatModel = await readFile(
    new URL("../docs/THREAT_MODEL.md", import.meta.url),
    "utf8",
  );

  for (const required of [
    "compiler-exact reconstructed bytes",
    "publisher identity",
    "clinical correctness",
    "absence of undisclosed patient data",
    "target-in-loop, causal, or counterfactual behavior",
    "requested GPT-5.6 model/effort",
    "npm run judge:proof",
    "output/release/judge-proof.log",
  ]) {
    assert.ok(
      threatModel.includes(required),
      `Threat model is missing required boundary: ${required}`,
    );
  }
});

test("the final release template binds local artifacts but cannot masquerade as frozen", async () => {
  const [
    templateBytes,
    v2ManifestBytes,
    staticRecordBytes,
    mediaManifest,
    packageBytes,
  ] =
    await Promise.all([
      readFile(
        new URL(
          "../submission/release/final-release-template.json",
          import.meta.url,
        ),
        "utf8",
      ),
      readFile(new URL("../public/runs/v2/manifest.json", import.meta.url)),
      readFile(
        new URL(
          "../submission/release/static-client-fingerprint.json",
          import.meta.url,
        ),
        "utf8",
      ),
      readFile(
        new URL("../submission/media/MANIFEST.md", import.meta.url),
        "utf8",
      ),
      readFile(new URL("../package.json", import.meta.url), "utf8"),
    ]);
  const template = JSON.parse(templateBytes);
  const staticRecord = JSON.parse(staticRecordBytes);
  const mediaRows = parseManifestRows(mediaManifest);
  const packageJson = JSON.parse(packageBytes);

  assert.equal(template.status, "not_frozen");
  assert.equal(template.v2_manifest_sha256, sha256(v2ManifestBytes));
  assert.equal(
    template.static_client_manifest_sha256,
    staticRecord.manifest_sha256,
  );
  assert.deepEqual(
    template.submission_media,
    Object.fromEntries(
      expectedImages.map((name) => [name, mediaRows.get(name).sha256]),
    ),
  );
  for (const field of [
    "submitted_commit",
    "repository_url",
    "deployment_url",
    "video_url",
    "video_sha256",
    "feedback_session_id",
  ]) {
    assert.equal(template[field], null, `${field} must remain unset before freeze`);
  }

  assert.equal(
    packageJson.scripts["release:freeze"],
    "node build/freeze-final-release.mjs",
  );
  const freezeValueArguments = [
    "--repository-url",
    "https://github.com/Sammsamy/witnesspatch",
    "--deployment-url",
    "https://witnesspatch.example.workers.dev",
    "--video-url",
    "https://youtu.be/AbCdEf12345",
    "--video-file",
    "/tmp/witnesspatch.mp4",
    "--feedback-session-id",
    "feedback_123456",
    "--feedback-confirmed",
    "--video-public-confirmed",
  ];
  const parsed = parseFreezeArguments([
    ...freezeValueArguments,
    "--founder-voice-confirmed",
    "--narration-human-reviewed-confirmed",
  ]);
  assert.equal(parsed.narrationMode, "founder_voice");
  const aiParsed = parseFreezeArguments([
    ...freezeValueArguments,
    "--ai-narration-confirmed",
    "--ai-narration-disclosed-confirmed",
    "--narration-human-reviewed-confirmed",
  ]);
  assert.equal(aiParsed.narrationMode, "ai_generated_voice");
  assert.equal(
    validateNarrationConfirmations(aiParsed),
    "ai_generated_voice",
  );
  assert.throws(
    () => parseFreezeArguments(freezeValueArguments),
    /Confirm exactly one narration mode/u,
  );
  assert.throws(
    () =>
      parseFreezeArguments([
        ...freezeValueArguments,
        "--founder-voice-confirmed",
        "--ai-narration-confirmed",
        "--narration-human-reviewed-confirmed",
      ]),
    /Confirm exactly one narration mode/u,
  );
  assert.throws(
    () =>
      parseFreezeArguments([
        ...freezeValueArguments,
        "--founder-voice-confirmed",
      ]),
    /Every final narrated video requires confirmation/u,
  );
  assert.throws(
    () =>
      parseFreezeArguments([
        ...freezeValueArguments,
        "--ai-narration-confirmed",
      ]),
    /Every final narrated video requires confirmation/u,
  );
  assert.throws(
    () =>
      parseFreezeArguments([
        ...freezeValueArguments,
        "--ai-narration-confirmed",
        "--narration-human-reviewed-confirmed",
      ]),
    /final video and public YouTube description explicitly disclose/u,
  );
  assert.throws(
    () =>
      parseFreezeArguments([
        ...freezeValueArguments,
        "--ai-narration-confirmed",
        "--ai-narration-disclosed-confirmed",
      ]),
    /Every final narrated video requires confirmation/u,
  );
  assert.throws(
    () =>
      parseFreezeArguments([
        ...freezeValueArguments,
        "--founder-voice-confirmed",
        "--ai-narration-disclosed-confirmed",
        "--narration-human-reviewed-confirmed",
      ]),
    /may be used only with AI narration/u,
  );
  assert.equal(
    validateRepositoryUrl(parsed.repositoryUrl).normalized,
    "https://github.com/Sammsamy/witnesspatch",
  );
  assert.equal(
    validateDeploymentUrl(parsed.deploymentUrl),
    "https://witnesspatch.example.workers.dev",
  );
  assert.equal(
    validateYouTubeUrl(parsed.videoUrl).normalized,
    "https://www.youtube.com/watch?v=AbCdEf12345",
  );
  assert.equal(
    validateFeedbackSessionId(parsed.feedbackSessionId),
    "feedback_123456",
  );
  assert.deepEqual(
    parseFfprobeReport({
      format: { duration: "179.999" },
      streams: [{ codec_type: "video" }, { codec_type: "audio" }],
    }),
    { durationSeconds: 179.999, videoStreams: 1, audioStreams: 1 },
  );
  const avmediainfoReport = `Asset: founder-demo.mp4
Duration: 148.000 seconds (148000/1000)
Track count: 2
Track 1: Video 'vide'
\tSystem support for decoding this track: Yes
Track 2: Sound 'soun'
\tSystem support for decoding this track: Yes
Movie analyzed with 0 error.`;
  assert.deepEqual(parseAvmediainfoReport(avmediainfoReport), {
    durationSeconds: 148,
    videoStreams: 1,
    audioStreams: 1,
  });
  assert.throws(
    () =>
      parseAvmediainfoReport(
        avmediainfoReport.replace(
          "System support for decoding this track: Yes",
          "System support for decoding this track: No",
        ),
      ),
    /does not support decoding/u,
  );
  assert.throws(
    () => parseFreezeArguments([]),
    /--repository-url is required/u,
  );
  assert.throws(
    () =>
      validateRepositoryUrl(
        "https://github.com/Sammsamy/witnesspatch?unreviewed=true",
      ),
    /canonical HTTPS GitHub repository URL/u,
  );
  assert.throws(
    () => validateYouTubeUrl("https://example.com/video"),
    /canonical public YouTube/u,
  );
  assert.throws(
    () => validateFeedbackSessionId("a".repeat(40)),
    /Git commit or SHA-256/u,
  );
  assert.throws(
    () => validateFeedbackSessionId("feedback_123456", "feedback_123456"),
    /technical task\/thread UUID/u,
  );
  assert.throws(
    () =>
      parseFfprobeReport({
        format: { duration: "180" },
        streams: [{ codec_type: "video" }, { codec_type: "audio" }],
      }),
    /below 180 seconds/u,
  );

  const temporaryRoot = await mkdtemp(join(tmpdir(), "witnesspatch-freeze-test-"));
  try {
    const v2Bytes = Buffer.from('{"fixture":"synthetic"}\n');
    const staticFiles = {
      ".assetsignore": Buffer.from("ignored deployment control\n"),
      ".vite/manifest.json": Buffer.from("{}\n"),
      "404.html": Buffer.from("<title>Not found</title>\n"),
      "THIRD_PARTY_NOTICES.md": Buffer.from("Synthetic notices\n"),
      "_headers": Buffer.from("/*\n  X-Content-Type-Options: nosniff\n"),
      "assets/app.js": Buffer.from('console.log("WitnessPatch");\n'),
      "favicon.svg": Buffer.from("<svg></svg>\n"),
      "index.html": Buffer.from("<title>WitnessPatch</title>\n"),
      "index.rsc": Buffer.from("synthetic rsc\n"),
      "runs/v2/manifest.json": v2Bytes,
    };
    const staticManifestText = Object.entries(staticFiles)
      .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
      .map(([path, bytes]) => `${sha256(bytes)}  ${path}\n`)
      .join("");
    const staticManifestDigest = sha256(staticManifestText);
    const media = Object.fromEntries(
      expectedImages.map((name) => [name, Buffer.from(`reviewed:${name}`)]),
    );
    await Promise.all([
      mkdir(join(temporaryRoot, "submission", "release"), { recursive: true }),
      mkdir(join(temporaryRoot, "submission", "media"), { recursive: true }),
      mkdir(join(temporaryRoot, "public", "runs", "v2"), { recursive: true }),
      mkdir(join(temporaryRoot, "dist", "client", ".vite"), { recursive: true }),
      mkdir(join(temporaryRoot, "dist", "client", "assets"), { recursive: true }),
      mkdir(join(temporaryRoot, "dist", "client", "runs", "v2"), {
        recursive: true,
      }),
      mkdir(join(temporaryRoot, "output", "release"), { recursive: true }),
    ]);
    await Promise.all([
      writeFile(join(temporaryRoot, "LICENSE"), "MIT License\n"),
      writeFile(
        join(temporaryRoot, "package.json"),
        `${JSON.stringify({ license: "MIT" })}\n`,
      ),
      writeFile(
        join(temporaryRoot, "public", "runs", "v2", "manifest.json"),
        v2Bytes,
      ),
      writeFile(
        join(
          temporaryRoot,
          "submission",
          "release",
          "static-client-fingerprint.json",
        ),
        `${JSON.stringify({
          file_count: Object.keys(staticFiles).length,
          manifest_sha256: staticManifestDigest,
        })}\n`,
      ),
      writeFile(
        join(temporaryRoot, "output", "release", "dist-client.sha256"),
        staticManifestText,
      ),
      writeFile(join(temporaryRoot, "founder-demo.mp4"), "video-bytes"),
      ...Object.entries(staticFiles).map(([path, bytes]) =>
        writeFile(join(temporaryRoot, "dist", "client", path), bytes),
      ),
      ...Object.entries(media).map(([name, bytes]) =>
        writeFile(join(temporaryRoot, "submission", "media", name), bytes),
      ),
    ]);
    const syntheticTemplate = {
      schema_version: "1.0.0",
      kind: "witnesspatch_final_release_fingerprint_template",
      status: "not_frozen",
      submitted_commit: null,
      v2_manifest_sha256: sha256(v2Bytes),
      static_client_manifest_sha256: staticManifestDigest,
      submission_media: Object.fromEntries(
        Object.entries(media).map(([name, bytes]) => [name, sha256(bytes)]),
      ),
      repository_url: null,
      deployment_url: null,
      video_url: null,
      video_sha256: null,
      feedback_session_id: null,
      boundary: "template",
    };
    await writeFile(
      join(
        temporaryRoot,
        "submission",
        "release",
        "final-release-template.json",
      ),
      `${JSON.stringify(syntheticTemplate)}\n`,
    );
    const commit = "c".repeat(40);
    const successfulWorkflowRun = {
      id: 123456789,
      name: "Verify",
      path: ".github/workflows/verify.yml",
      event: "push",
      status: "completed",
      conclusion: "success",
      head_sha: commit,
      head_branch: "main",
      run_number: 14,
      run_attempt: 1,
      html_url: "https://github.com/Sammsamy/witnesspatch/actions/runs/123456789",
    };
    assert.equal(
      selectSuccessfulVerifyRun(
        { workflow_runs: [successfulWorkflowRun] },
        { commit, defaultBranch: "main" },
      ).run_id,
      123456789,
    );
    assert.throws(
      () =>
        selectSuccessfulVerifyRun(
          {
            workflow_runs: [
              { ...successfulWorkflowRun, conclusion: "failure" },
            ],
          },
          { commit, defaultBranch: "main" },
        ),
      /successful completed Verify push run/u,
    );
    assert.equal(
      parseStaticClientManifest(staticManifestText).length,
      Object.keys(staticFiles).length,
    );
    assert.throws(
      () =>
        parseStaticClientManifest(
          `${"a".repeat(64)}  assets/app.js\n${"b".repeat(64)}  assets/app.js\n`,
        ),
      /duplicate paths/u,
    );
    const commandRunner = (command, args) => {
      if (command === "npm") return "release verified";
      if (
        command === "ffprobe" ||
        command === process.env.WITNESSPATCH_FFPROBE_BIN?.trim()
      ) {
        return JSON.stringify({
          format: { duration: "173.08" },
          streams: [{ codec_type: "video" }, { codec_type: "audio" }],
        });
      }
      if (command === "git" && args[0] === "ls-remote") {
        return `${commit}\trefs/heads/main`;
      }
      if (command === "git" && args.join(" ") === "rev-parse --show-toplevel") {
        return temporaryRoot;
      }
      if (command === "git" && args.join(" ") === "rev-parse HEAD") return commit;
      if (command === "git" && args[0] === "status") return "";
      throw new Error(`Unexpected test command: ${command} ${args.join(" ")}`);
    };
    const fetchImpl = async (url) => {
      const href = String(url);
      if (href.includes("/actions/runs?")) {
        const requested = new URL(href);
        assert.equal(requested.searchParams.get("head_sha"), commit);
        assert.equal(requested.searchParams.get("status"), "completed");
        assert.equal(requested.searchParams.get("per_page"), "100");
        return new Response(
          JSON.stringify({ workflow_runs: [successfulWorkflowRun] }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }
      if (href.startsWith("https://api.github.com/repos/")) {
        return new Response(
          JSON.stringify({
            private: false,
            default_branch: "main",
            license: { spdx_id: "MIT" },
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }
      if (href.startsWith("https://www.youtube.com/oembed")) {
        return new Response(JSON.stringify({ title: "WitnessPatch demo" }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      }
      if (href === "https://witnesspatch.example.workers.dev/") {
        return new Response(staticFiles["index.html"], { status: 200 });
      }
      if (href.startsWith("https://witnesspatch.example.workers.dev/")) {
        const relativePath = new URL(href).pathname
          .slice(1)
          .split("/")
          .map(decodeURIComponent)
          .join("/");
        const bytes = staticFiles[relativePath];
        assert.ok(bytes, `Unexpected deployed path ${relativePath}`);
        return new Response(bytes, { status: 200 });
      }
      throw new Error(`Unexpected test fetch: ${href}`);
    };
    const frozen = await freezeFinalRelease({
      options: {
        ...parsed,
        videoFile: join(temporaryRoot, "founder-demo.mp4"),
      },
      rootDir: temporaryRoot,
      fetchImpl,
      commandRunner,
      now: () => new Date("2026-07-20T12:00:00.000Z"),
      technicalThreadId: "different_thread_123",
    });
    assert.equal(frozen.record.status, "frozen");
    assert.equal(frozen.record.submitted_commit, commit);
    assert.equal(
      frozen.record.verification.repository.exact_commit_is_default_branch_tip,
      true,
    );
    assert.equal(
      frozen.record.verification.repository.remote_ci.conclusion,
      "success",
    );
    assert.equal(
      frozen.record.verification.repository.remote_ci.head_sha,
      commit,
    );
    assert.equal(
      frozen.record.verification.deployment.public_files_byte_verified,
      Object.keys(staticFiles).length - 4,
    );
    assert.equal(frozen.record.verification.video.duration_seconds, 173.08);
    assert.deepEqual(frozen.record.verification.video.narration, {
      mode: "founder_voice",
      founder_voice_confirmed_by_entrant: true,
      ai_generated_voice_confirmed_by_entrant: false,
      ai_voice_publicly_disclosed_confirmed_by_entrant: false,
      complete_human_review_confirmed_by_entrant: true,
    });
    assert.equal(frozen.record.feedback_session_id, "feedback_123456");
    assert.equal(
      sha256(await readFile(frozen.outputPath)),
      frozen.digest,
    );
    await assert.rejects(
      freezeFinalRelease({
        options: {
          ...parsed,
          videoFile: join(temporaryRoot, "founder-demo.mp4"),
        },
        rootDir: temporaryRoot,
        fetchImpl,
        commandRunner,
      }),
      /final release receipt already exists/u,
    );
    await Promise.all([
      rm(frozen.outputPath, { force: true }),
      rm(frozen.digestPath, { force: true }),
    ]);
    await assert.rejects(
      freezeFinalRelease({
        options: {
          ...parsed,
          videoFile: join(temporaryRoot, "founder-demo.mp4"),
          founderVoiceConfirmed: false,
        },
        rootDir: temporaryRoot,
        fetchImpl,
        commandRunner,
      }),
      /Confirm exactly one narration mode/u,
    );
    const aiFrozen = await freezeFinalRelease({
      options: {
        ...aiParsed,
        videoFile: join(temporaryRoot, "founder-demo.mp4"),
      },
      rootDir: temporaryRoot,
      fetchImpl,
      commandRunner,
      now: () => new Date("2026-07-20T12:01:00.000Z"),
      technicalThreadId: "different_thread_123",
    });
    assert.deepEqual(aiFrozen.record.verification.video.narration, {
      mode: "ai_generated_voice",
      founder_voice_confirmed_by_entrant: false,
      ai_generated_voice_confirmed_by_entrant: true,
      ai_voice_publicly_disclosed_confirmed_by_entrant: true,
      complete_human_review_confirmed_by_entrant: true,
    });
    assert.match(aiFrozen.record.boundary, /not machine-verified facts/u);
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
});

test("founder demo timeline stays continuous, speakable, and below three minutes", async () => {
  const founderVideoArguments = parseFounderVideoArguments([
    "--audio-file",
    "/tmp/founder-voice.m4a",
    "--out",
    "/tmp/founder-demo.mp4",
  ]);
  assert.equal(founderVideoArguments.audioFile, "/tmp/founder-voice.m4a");
  assert.equal(founderVideoArguments.outputFile, "/tmp/founder-demo.mp4");
  assert.throws(
    () => parseFounderVideoArguments([]),
    /--audio-file is required/u,
  );
  assert.throws(
    () =>
      parseFounderVideoArguments([
        "--audio-file",
        "/tmp/founder-voice.m4a",
        "--out",
        "/tmp/founder-demo.webm",
      ]),
    /must use the \.mp4 extension/u,
  );
  assert.deepEqual(
    validateFounderMedia(
      {
        format: { duration: "148.000" },
        streams: [
          { codec_type: "video", codec_name: "h264", width: 1400, height: 900 },
        ],
      },
      {
        format: { duration: "146.250" },
        streams: [{ codec_type: "audio", codec_name: "aac" }],
      },
    ),
    { videoDuration: 148, audioDuration: 146.25 },
  );
  assert.throws(
    () =>
      validateFounderMedia(
        {
          format: { duration: "148.000" },
          streams: [
            { codec_type: "video", codec_name: "h264", width: 1400, height: 900 },
            { codec_type: "audio" },
          ],
        },
        {
          format: { duration: "146.250" },
          streams: [{ codec_type: "audio" }],
        },
      ),
    /screen master must remain silent/u,
  );
  assert.throws(
    () =>
      validateFounderMedia(
        {
          format: { duration: "148.000" },
          streams: [
            { codec_type: "video", codec_name: "vp8", width: 1400, height: 900 },
          ],
        },
        {
          format: { duration: "146.250" },
          streams: [{ codec_type: "audio" }],
        },
      ),
    /one H\.264 1400 x 900 video stream/u,
  );
  assert.throws(
    () =>
      validateFounderMedia(
        {
          format: { duration: "148.000" },
          streams: [
            { codec_type: "video", codec_name: "h264", width: 1400, height: 900 },
          ],
        },
        {
          format: { duration: "147.501" },
          streams: [{ codec_type: "audio" }],
        },
      ),
    /no later than 2:27\.5/u,
  );
  const [script, captions, readme] = await Promise.all([
    readFile(new URL("../docs/DEMO_SCRIPT.md", import.meta.url), "utf8"),
    readFile(
      new URL("../submission/video/witnesspatch-demo.en.srt", import.meta.url),
      "utf8",
    ),
    readFile(new URL("../README.md", import.meta.url), "utf8"),
  ]);
  assert.match(script, new RegExp(reviewedScreenMaster.sha256));
  assert.match(readme, new RegExp(reviewedScreenMaster.sha256));
  const rowPattern =
    /^\| `(\d+):(\d+)–(\d+):(\d+)` \| “([^”]+)” \|/gm;
  const rows = [...script.matchAll(rowPattern)].map((match) => ({
    start: Number(match[1]) * 60 + Number(match[2]),
    end: Number(match[3]) * 60 + Number(match[4]),
    narration: match[5],
  }));

  assert.equal(rows.length, 10);
  assert.equal(rows[0].start, 0);
  assert.equal(rows.at(-1).end, 148);
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
  assert.equal(captionRows.at(-1).endMs, 148_000);

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
  const founderCaptions = founderCaptionsFromAi(captions);
  const captionNarration = (value) =>
    value
      .trim()
      .split(/\r?\n\r?\n+/u)
      .map((block) => block.split(/\r?\n/u).slice(2).join(" "))
      .join(" ");
  const expectedFounderNarration = narration.replace(
    /^This demo uses AI narration for Fuzlullah Syed, a third-year medical student\./u,
    "I’m Fuzlullah Syed, a third-year medical student.",
  );
  assert.equal(captionNarration(founderCaptions), expectedFounderNarration);
  assert.doesNotMatch(founderCaptions, /uses AI narration/u);
  assert.match(founderCaptions, /I’m Fuzlullah Syed/u);
  const timingLines = (value) =>
    value.match(/^\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}$/gmu);
  assert.deepEqual(timingLines(founderCaptions), timingLines(captions));
  for (const block of founderCaptions.trim().split(/\r?\n\r?\n+/u)) {
    for (const line of block.split(/\r?\n/u).slice(2)) {
      assert.ok([...line].length <= 42);
    }
  }
  assert.throws(
    () => founderCaptionsFromAi(founderCaptions),
    /exactly one expected AI-identity cue/u,
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
