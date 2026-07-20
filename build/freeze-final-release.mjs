import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  access,
  lstat,
  mkdir,
  readFile,
  rename,
  writeFile,
} from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const COMMIT_PATTERN = /^[0-9a-f]{40}$/u;
const SHA256_PATTERN = /^[0-9a-f]{64}$/u;
const FEEDBACK_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{7,127}$/u;
const VALUE_ARGUMENTS = new Set([
  "--repository-url",
  "--deployment-url",
  "--video-url",
  "--video-file",
  "--feedback-session-id",
]);
const CONFIRMATION_ARGUMENTS = new Set([
  "--feedback-confirmed",
  "--video-public-confirmed",
  "--founder-voice-confirmed",
  "--ai-narration-confirmed",
  "--ai-narration-disclosed-confirmed",
  "--narration-human-reviewed-confirmed",
]);
const REQUIRED_CONFIRMATION_ARGUMENTS = Object.freeze([
  "--feedback-confirmed",
  "--video-public-confirmed",
]);

function requireValue(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? projectRoot,
    encoding: "utf8",
    env: options.env ?? process.env,
    maxBuffer: 16 * 1024 * 1024,
    windowsHide: true,
  });
  requireValue(
    result.error === undefined && result.status === 0,
    options.failureMessage ?? `${command} ${args[0] ?? ""} failed.`,
  );
  return result.stdout.trim();
}

export function parseFreezeArguments(argv) {
  const values = new Map();
  const confirmations = new Set();
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (CONFIRMATION_ARGUMENTS.has(argument)) {
      requireValue(
        !confirmations.has(argument),
        `${argument} may be supplied only once.`,
      );
      confirmations.add(argument);
      continue;
    }
    requireValue(
      VALUE_ARGUMENTS.has(argument),
      `Unknown release-freeze argument ${JSON.stringify(argument)}.`,
    );
    requireValue(!values.has(argument), `${argument} may be supplied only once.`);
    const value = argv[index + 1];
    requireValue(
      typeof value === "string" && !value.startsWith("--"),
      `${argument} requires a value.`,
    );
    values.set(argument, value);
    index += 1;
  }

  for (const argument of VALUE_ARGUMENTS) {
    requireValue(values.has(argument), `${argument} is required.`);
  }
  for (const argument of REQUIRED_CONFIRMATION_ARGUMENTS) {
    requireValue(
      confirmations.has(argument),
      `${argument} is required as a human confirmation.`,
    );
  }

  const options = {
    repositoryUrl: values.get("--repository-url"),
    deploymentUrl: values.get("--deployment-url"),
    videoUrl: values.get("--video-url"),
    videoFile: values.get("--video-file"),
    feedbackSessionId: values.get("--feedback-session-id"),
    feedbackConfirmed: true,
    videoPublicConfirmed: true,
    founderVoiceConfirmed: confirmations.has("--founder-voice-confirmed"),
    aiNarrationConfirmed: confirmations.has("--ai-narration-confirmed"),
    aiNarrationDisclosedConfirmed: confirmations.has(
      "--ai-narration-disclosed-confirmed",
    ),
    narrationHumanReviewedConfirmed: confirmations.has(
      "--narration-human-reviewed-confirmed",
    ),
  };
  return Object.freeze({
    ...options,
    narrationMode: validateNarrationConfirmations(options),
  });
}

export function validateNarrationConfirmations(options) {
  const founderVoice = options.founderVoiceConfirmed === true;
  const aiNarration = options.aiNarrationConfirmed === true;
  requireValue(
    founderVoice !== aiNarration,
    "Confirm exactly one narration mode: founder voice or AI narration.",
  );
  requireValue(
    options.narrationHumanReviewedConfirmed === true,
    "Every final narrated video requires confirmation that the entrant reviewed the complete video for narration accuracy, pronunciation, intelligibility, and synchronization.",
  );
  if (founderVoice) {
    requireValue(
      options.aiNarrationDisclosedConfirmed !== true,
      "AI narration disclosure confirmation may be used only with AI narration.",
    );
    return "founder_voice";
  }
  requireValue(
    options.aiNarrationDisclosedConfirmed === true,
    "AI narration requires confirmation that both the final video and public YouTube description explicitly disclose the AI-generated voice.",
  );
  return "ai_generated_voice";
}

export function validateRepositoryUrl(value) {
  const url = new URL(value);
  const pathParts = url.pathname.split("/").filter(Boolean);
  requireValue(
    url.protocol === "https:" &&
      url.hostname === "github.com" &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash &&
      pathParts.length === 2,
    "Repository URL must be a canonical HTTPS GitHub repository URL.",
  );
  const owner = pathParts[0];
  const repository = pathParts[1].replace(/\.git$/u, "");
  requireValue(
    /^[A-Za-z0-9_.-]+$/u.test(owner) &&
      /^[A-Za-z0-9_.-]+$/u.test(repository),
    "Repository owner or name is invalid.",
  );
  return Object.freeze({
    normalized: `https://github.com/${owner}/${repository}`,
    owner,
    repository,
  });
}

export function validateDeploymentUrl(value) {
  const url = new URL(value);
  requireValue(
    url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash,
    "Deployment URL must be an HTTPS URL without credentials, query, or fragment.",
  );
  url.pathname = url.pathname.replace(/\/+$/u, "") || "/";
  return url.toString().replace(/\/$/u, "");
}

export function validateYouTubeUrl(value) {
  const url = new URL(value);
  let videoId = "";
  if (url.protocol === "https:" && url.hostname === "youtu.be") {
    videoId = url.pathname.split("/").filter(Boolean)[0] ?? "";
  } else if (
    url.protocol === "https:" &&
    (url.hostname === "www.youtube.com" || url.hostname === "youtube.com") &&
    url.pathname === "/watch"
  ) {
    videoId = url.searchParams.get("v") ?? "";
  }
  requireValue(
    /^[A-Za-z0-9_-]{6,32}$/u.test(videoId),
    "Video URL must be a canonical public YouTube watch or youtu.be URL.",
  );
  return Object.freeze({
    normalized: `https://www.youtube.com/watch?v=${videoId}`,
    videoId,
  });
}

export function validateFeedbackSessionId(value, technicalThreadId) {
  requireValue(
    FEEDBACK_PATTERN.test(value),
    "The /feedback Session ID must be an 8–128 character letter/number identifier returned by Codex.",
  );
  requireValue(
    !COMMIT_PATTERN.test(value) && !SHA256_PATTERN.test(value),
    "A Git commit or SHA-256 cannot be used as the /feedback Session ID.",
  );
  requireValue(
    !technicalThreadId || value !== technicalThreadId,
    "The technical task/thread UUID cannot substitute for the /feedback Session ID.",
  );
  return value;
}

export function parseFfprobeReport(report) {
  requireValue(report && typeof report === "object", "ffprobe returned no report.");
  const duration = Number(report.format?.duration);
  const streamTypes = Array.isArray(report.streams)
    ? report.streams.map((stream) => stream.codec_type)
    : [];
  const videoStreams = streamTypes.filter((type) => type === "video").length;
  const audioStreams = streamTypes.filter((type) => type === "audio").length;
  requireValue(
    Number.isFinite(duration) && duration > 0 && duration < 180,
    `Final video must decode to a positive duration below 180 seconds; received ${report.format?.duration ?? "unknown"}.`,
  );
  requireValue(videoStreams >= 1, "Final video must contain a video stream.");
  requireValue(audioStreams >= 1, "Final video must contain an audio stream.");
  return Object.freeze({ durationSeconds: duration, videoStreams, audioStreams });
}

async function fetchRequired(fetchImpl, url, description, options = {}) {
  const response = await fetchImpl(url, {
    ...options,
    redirect: "follow",
    signal: AbortSignal.timeout(15_000),
  });
  requireValue(
    response.ok,
    `${description} was not publicly reachable: HTTP ${response.status}.`,
  );
  return response;
}

export function selectSuccessfulVerifyRun(payload, { commit, defaultBranch }) {
  requireValue(
    payload && Array.isArray(payload.workflow_runs),
    "GitHub returned an invalid Actions workflow-runs response.",
  );
  const matchingRuns = payload.workflow_runs
    .filter(
      (run) =>
        run &&
        run.name === "Verify" &&
        run.path === ".github/workflows/verify.yml" &&
        run.event === "push" &&
        run.head_sha === commit &&
        run.head_branch === defaultBranch &&
        run.status === "completed" &&
        run.conclusion === "success",
    )
    .sort(
      (left, right) =>
        Number(right.run_number ?? 0) - Number(left.run_number ?? 0) ||
        Number(right.run_attempt ?? 0) - Number(left.run_attempt ?? 0) ||
        Number(right.id ?? 0) - Number(left.id ?? 0),
    );
  requireValue(
    matchingRuns.length > 0,
    "GitHub Actions must show a successful completed Verify push run for the exact default-branch commit.",
  );
  const selected = matchingRuns[0];
  requireValue(
    Number.isSafeInteger(selected.id) && selected.id > 0,
    "The matching GitHub Actions run has no valid run ID.",
  );
  requireValue(
    typeof selected.html_url === "string",
    "The matching GitHub Actions run has no public URL.",
  );
  const runUrl = new URL(selected.html_url);
  requireValue(
    runUrl.protocol === "https:" && runUrl.hostname === "github.com",
    "The matching GitHub Actions run has no canonical public GitHub URL.",
  );
  return Object.freeze({
    workflow: selected.name,
    workflow_path: selected.path,
    event: selected.event,
    status: selected.status,
    conclusion: selected.conclusion,
    run_id: selected.id,
    run_number: selected.run_number,
    run_attempt: selected.run_attempt,
    head_sha: selected.head_sha,
    head_branch: selected.head_branch,
    html_url: runUrl.toString(),
  });
}

async function verifyLocalAnchors(template, rootDir) {
  requireValue(
    template.schema_version === "1.0.0" &&
      template.kind === "witnesspatch_final_release_fingerprint_template" &&
      template.status === "not_frozen",
    "Final release template is invalid or already claims to be frozen.",
  );
  const v2Bytes = await readFile(
    join(rootDir, "public", "runs", "v2", "manifest.json"),
  );
  requireValue(
    sha256(v2Bytes) === template.v2_manifest_sha256,
    "The V2 manifest no longer matches the release template.",
  );
  const staticRecord = JSON.parse(
    await readFile(
      join(
        rootDir,
        "submission",
        "release",
        "static-client-fingerprint.json",
      ),
      "utf8",
    ),
  );
  requireValue(
    staticRecord.manifest_sha256 === template.static_client_manifest_sha256,
    "The static-client fingerprint no longer matches the release template.",
  );
  const mediaEntries = Object.entries(template.submission_media ?? {});
  requireValue(mediaEntries.length === 5, "Release template must bind five media files.");
  for (const [name, expectedDigest] of mediaEntries) {
    requireValue(
      /^[A-Za-z0-9._-]+\.png$/u.test(name),
      `Unsafe submission-media name: ${name}.`,
    );
    requireValue(SHA256_PATTERN.test(expectedDigest), `Invalid media hash for ${name}.`);
    const bytes = await readFile(join(rootDir, "submission", "media", name));
    requireValue(
      sha256(bytes) === expectedDigest,
      `Submission media changed after review: ${name}.`,
    );
  }
  return Object.freeze({
    staticClientManifestSha256: staticRecord.manifest_sha256,
    staticClientFileCount: staticRecord.file_count,
  });
}

export function parseStaticClientManifest(value) {
  requireValue(
    typeof value === "string" && value.endsWith("\n"),
    "Static-client byte manifest must be newline-terminated text.",
  );
  const rows = value
    .slice(0, -1)
    .split("\n")
    .map((line) => {
      const match = line.match(/^([0-9a-f]{64})  ([^\r\n]+)$/u);
      requireValue(match, "Static-client byte manifest contains an invalid row.");
      const path = match[2];
      requireValue(
        path &&
          !path.startsWith("/") &&
          path !== ".." &&
          !path.startsWith("../") &&
          !path.includes("\\") &&
          !/[\u0000-\u001f\u007f]/u.test(path),
        `Static-client byte manifest contains an unsafe path: ${path}.`,
      );
      return Object.freeze({ sha256: match[1], path });
    });
  requireValue(rows.length > 0, "Static-client byte manifest is empty.");
  requireValue(
    new Set(rows.map((row) => row.path)).size === rows.length,
    "Static-client byte manifest contains duplicate paths.",
  );
  const sortedPaths = rows.map((row) => row.path).toSorted();
  requireValue(
    rows.every((row, index) => row.path === sortedPaths[index]),
    "Static-client byte manifest is not canonically sorted.",
  );
  return Object.freeze(rows);
}

async function verifyPublicRepository({
  repository,
  commit,
  localLicense,
  fetchImpl,
  commandRunner,
  rootDir,
}) {
  const apiResponse = await fetchRequired(
    fetchImpl,
    `https://api.github.com/repos/${repository.owner}/${repository.repository}`,
    "GitHub repository",
    { headers: { Accept: "application/vnd.github+json", "User-Agent": "WitnessPatch" } },
  );
  const metadata = await apiResponse.json();
  requireValue(metadata.private === false, "The final GitHub repository is not public.");
  requireValue(
    typeof metadata.default_branch === "string" && metadata.default_branch,
    "GitHub returned no default branch for the final repository.",
  );
  const detectedLicense = metadata.license?.spdx_id;
  requireValue(
    typeof detectedLicense === "string" &&
      detectedLicense !== "NOASSERTION" &&
      detectedLicense === localLicense,
    `GitHub must detect the same open-source license declared locally (${localLicense}).`,
  );
  const remoteRefs = commandRunner("git", ["ls-remote", repository.normalized], {
    cwd: rootDir,
    env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
    failureMessage: "The public GitHub repository could not be read with git ls-remote.",
  });
  requireValue(
    remoteRefs
      .split("\n")
      .includes(`${commit}\trefs/heads/${metadata.default_branch}`),
    "The exact frozen commit is not the public GitHub repository's default-branch tip.",
  );
  const actionsUrl = new URL(
    `https://api.github.com/repos/${repository.owner}/${repository.repository}/actions/runs`,
  );
  actionsUrl.searchParams.set("head_sha", commit);
  actionsUrl.searchParams.set("status", "completed");
  actionsUrl.searchParams.set("per_page", "100");
  const actionsResponse = await fetchRequired(
    fetchImpl,
    actionsUrl,
    "GitHub Actions workflow runs",
    { headers: { Accept: "application/vnd.github+json", "User-Agent": "WitnessPatch" } },
  );
  const remoteCi = selectSuccessfulVerifyRun(await actionsResponse.json(), {
    commit,
    defaultBranch: metadata.default_branch,
  });
  return Object.freeze({
    public: true,
    license_spdx: detectedLicense,
    default_branch: metadata.default_branch,
    exact_commit_is_default_branch_tip: true,
    remote_ci: remoteCi,
  });
}

async function verifyDeployment({
  deploymentUrl,
  expectedManifest,
  expectedStaticManifest,
  expectedStaticFileCount,
  fetchImpl,
  rootDir,
}) {
  const staticManifestText = await readFile(
    join(rootDir, "output", "release", "dist-client.sha256"),
    "utf8",
  );
  requireValue(
    sha256(staticManifestText) === expectedStaticManifest,
    "Generated static-client byte manifest does not match the reviewed release fingerprint.",
  );
  const staticRows = parseStaticClientManifest(staticManifestText);
  requireValue(
    staticRows.length === expectedStaticFileCount,
    "Generated static-client byte manifest has the wrong file count.",
  );
  const rowsByPath = new Map(staticRows.map((row) => [row.path, row]));
  const indexRow = rowsByPath.get("index.html");
  const v2ManifestRow = rowsByPath.get("runs/v2/manifest.json");
  requireValue(indexRow, "Static-client byte manifest is missing index.html.");
  requireValue(
    v2ManifestRow?.sha256 === expectedManifest,
    "Static-client byte manifest has the wrong V2 manifest hash.",
  );
  const rootResponse = await fetchRequired(
    fetchImpl,
    `${deploymentUrl}/`,
    "Deployment root",
  );
  const rootBytes = Buffer.from(await rootResponse.arrayBuffer());
  const html = rootBytes.toString("utf8");
  requireValue(html.includes("WitnessPatch"), "Deployment root is not WitnessPatch.");
  requireValue(
    sha256(rootBytes) === indexRow.sha256,
    "Deployment root bytes do not match the reviewed static client.",
  );
  const excludedPaths = Object.freeze([
    ".assetsignore",
    ".vite/manifest.json",
    "404.html",
    "_headers",
  ]);
  for (const path of excludedPaths) {
    requireValue(
      rowsByPath.has(path),
      `Expected deployment-control file is missing from the static client: ${path}.`,
    );
  }
  const excluded = new Set(["index.html", ...excludedPaths]);
  const publicRows = staticRows.filter((row) => !excluded.has(row.path));
  await Promise.all(
    publicRows.map(async (row) => {
      const response = await fetchRequired(
        fetchImpl,
        new URL(
          `/${row.path.split("/").map(encodeURIComponent).join("/")}`,
          `${deploymentUrl}/`,
        ),
        `Deployed static file ${row.path}`,
      );
      const bytes = Buffer.from(await response.arrayBuffer());
      requireValue(
        sha256(bytes) === row.sha256,
        `Deployed static file does not match the reviewed release: ${row.path}.`,
      );
    }),
  );
  const manifestDigest = v2ManifestRow.sha256;
  requireValue(
    manifestDigest === expectedManifest,
    "Deployed V2 manifest does not match the frozen local release.",
  );
  return Object.freeze({
    root_http_status: rootResponse.status,
    root_sha256: indexRow.sha256,
    v2_manifest_sha256: manifestDigest,
    reviewed_static_manifest_sha256: expectedStaticManifest,
    reviewed_static_file_count: staticRows.length,
    public_files_byte_verified: publicRows.length + 1,
    deployment_control_files_not_publicly_probed: excludedPaths,
  });
}

async function verifyVideo({ video, videoFile, fetchImpl, commandRunner }) {
  const stats = await lstat(videoFile);
  requireValue(
    stats.isFile() && !stats.isSymbolicLink(),
    "Final video must be a real regular file, not a link.",
  );
  const probeOutput = commandRunner(
    process.env.WITNESSPATCH_FFPROBE_BIN?.trim() || "ffprobe",
    [
      "-v",
      "error",
      "-show_entries",
      "format=duration:stream=codec_type",
      "-of",
      "json",
      videoFile,
    ],
    { failureMessage: "ffprobe could not decode the final video." },
  );
  const probe = parseFfprobeReport(JSON.parse(probeOutput));
  const oEmbed = new URL("https://www.youtube.com/oembed");
  oEmbed.searchParams.set("url", video.normalized);
  oEmbed.searchParams.set("format", "json");
  const oEmbedResponse = await fetchRequired(
    fetchImpl,
    oEmbed,
    "YouTube oEmbed record",
  );
  const metadata = await oEmbedResponse.json();
  requireValue(
    typeof metadata.title === "string" && metadata.title.trim(),
    "YouTube returned no public video title.",
  );
  return Object.freeze({
    sha256: sha256(await readFile(videoFile)),
    duration_seconds: probe.durationSeconds,
    video_streams: probe.videoStreams,
    audio_streams: probe.audioStreams,
    youtube_oembed_reachable: true,
    youtube_title: metadata.title,
  });
}

async function assertOutputAbsent(path) {
  try {
    await access(path, constants.F_OK);
  } catch (error) {
    if (error && typeof error === "object" && error.code === "ENOENT") return;
    throw error;
  }
  throw new Error(
    "A final release receipt already exists. Preserve it before starting a separately labeled freeze.",
  );
}

export async function freezeFinalRelease({
  options,
  rootDir = projectRoot,
  fetchImpl = fetch,
  commandRunner = runCommand,
  now = () => new Date(),
  technicalThreadId = process.env.WITNESSPATCH_TECHNICAL_THREAD_ID,
}) {
  requireValue(
    options.feedbackConfirmed === true,
    "The entrant must confirm that Codex /feedback returned this Session ID.",
  );
  requireValue(
    options.videoPublicConfirmed === true,
    "The entrant must confirm that the YouTube video is publicly visible.",
  );
  const narrationMode = validateNarrationConfirmations(options);
  const repository = validateRepositoryUrl(options.repositoryUrl);
  const deploymentUrl = validateDeploymentUrl(options.deploymentUrl);
  const video = validateYouTubeUrl(options.videoUrl);
  const feedbackSessionId = validateFeedbackSessionId(
    options.feedbackSessionId,
    technicalThreadId,
  );
  const videoFile = resolve(options.videoFile);
  await assertOutputAbsent(join(rootDir, "output", "release", "final-release.json"));
  await assertOutputAbsent(
    join(rootDir, "output", "release", "final-release.sha256"),
  );

  const repositoryRoot = commandRunner("git", ["rev-parse", "--show-toplevel"], {
    cwd: rootDir,
    failureMessage: "Final release freeze must run inside a Git repository.",
  });
  requireValue(
    resolve(repositoryRoot) === resolve(rootDir),
    "Run the final release freeze from the repository root.",
  );
  const commit = commandRunner("git", ["rev-parse", "HEAD"], { cwd: rootDir });
  requireValue(COMMIT_PATTERN.test(commit), "Current Git commit is invalid.");
  const status = commandRunner(
    "git",
    ["status", "--porcelain=v1", "--untracked-files=all"],
    { cwd: rootDir },
  );
  requireValue(status === "", "Repository must be clean before final release freeze.");

  const packageJson = JSON.parse(
    await readFile(join(rootDir, "package.json"), "utf8"),
  );
  requireValue(
    typeof packageJson.license === "string" && packageJson.license !== "UNLICENSED",
    "A public submission requires an explicit local open-source license.",
  );
  const licenseStats = await lstat(join(rootDir, "LICENSE"));
  requireValue(
    licenseStats.isFile() && !licenseStats.isSymbolicLink(),
    "LICENSE must be a real regular file.",
  );
  requireValue(
    (await readFile(join(rootDir, "LICENSE"))).length > 0,
    "LICENSE must not be empty.",
  );

  const template = JSON.parse(
    await readFile(
      join(
        rootDir,
        "submission",
        "release",
        "final-release-template.json",
      ),
      "utf8",
    ),
  );
  const localAnchors = await verifyLocalAnchors(template, rootDir);
  commandRunner("npm", ["run", "verify:release"], {
    cwd: rootDir,
    failureMessage: "The complete local release verifier failed.",
  });
  const statusAfterVerification = commandRunner(
    "git",
    ["status", "--porcelain=v1", "--untracked-files=all"],
    { cwd: rootDir },
  );
  requireValue(
    statusAfterVerification === "",
    "Release verification changed tracked or unignored repository files.",
  );

  const repositoryVerification = await verifyPublicRepository({
    repository,
    commit,
    localLicense: packageJson.license,
    fetchImpl,
    commandRunner,
    rootDir,
  });
  const deploymentVerification = await verifyDeployment({
    deploymentUrl,
    expectedManifest: template.v2_manifest_sha256,
    expectedStaticManifest: localAnchors.staticClientManifestSha256,
    expectedStaticFileCount: localAnchors.staticClientFileCount,
    fetchImpl,
    rootDir,
  });
  const videoVerification = await verifyVideo({
    video,
    videoFile,
    fetchImpl,
    commandRunner,
  });

  const record = Object.freeze({
    ...template,
    kind: "witnesspatch_final_release_fingerprint",
    status: "frozen",
    submitted_commit: commit,
    repository_url: repository.normalized,
    deployment_url: deploymentUrl,
    video_url: video.normalized,
    video_sha256: videoVerification.sha256,
    feedback_session_id: feedbackSessionId,
    verified_at: now().toISOString(),
    verification: {
      repository: repositoryVerification,
      deployment: deploymentVerification,
      video: {
        ...videoVerification,
        public_visibility_confirmed_by_entrant: options.videoPublicConfirmed,
        narration: {
          mode: narrationMode,
          founder_voice_confirmed_by_entrant:
            options.founderVoiceConfirmed === true,
          ai_generated_voice_confirmed_by_entrant:
            options.aiNarrationConfirmed === true,
          ai_voice_publicly_disclosed_confirmed_by_entrant:
            options.aiNarrationDisclosedConfirmed === true,
          complete_human_review_confirmed_by_entrant:
            options.narrationHumanReviewedConfirmed === true,
        },
      },
      feedback: {
        returned_by_codex_feedback_confirmed_by_entrant:
          options.feedbackConfirmed,
      },
      local_release_verifier: "pass",
      repository_clean: true,
    },
    boundary:
      "This receipt binds one clean commit, its successful public Verify workflow run, public repository, byte-verified judge-facing static deployment, local video bytes, reachable YouTube record, and entrant-confirmed /feedback, visibility, and narration-mode facts. For AI narration, disclosure and complete human review are entrant confirmations, not machine-verified facts. It does not prove that YouTube serves the same bytes as the local video, clinical validity, adoption, or judge outcome.",
  });
  const bytes = `${JSON.stringify(record, null, 2)}\n`;
  const digest = sha256(bytes);
  const targetDirectory = join(rootDir, "output", "release");
  const targetPath = join(targetDirectory, "final-release.json");
  const digestPath = join(targetDirectory, "final-release.sha256");
  const temporaryPath = `${targetPath}.tmp-${process.pid}`;
  const temporaryDigestPath = `${digestPath}.tmp-${process.pid}`;
  await mkdir(targetDirectory, { recursive: true });
  await writeFile(temporaryPath, bytes, { encoding: "utf8", mode: 0o600 });
  await writeFile(
    temporaryDigestPath,
    `${digest}  final-release.json\n`,
    { encoding: "utf8", mode: 0o600 },
  );
  await rename(temporaryPath, targetPath);
  await rename(temporaryDigestPath, digestPath);
  return Object.freeze({ record, digest, outputPath: targetPath, digestPath });
}

function formatSuccess(result) {
  return [
    "WITNESSPATCH FINAL RELEASE FREEZE PASS",
    `commit=${result.record.submitted_commit}`,
    `repository=${result.record.repository_url}`,
    `deployment=${result.record.deployment_url}`,
    `video=${result.record.video_url}`,
    `video_sha256=${result.record.video_sha256}`,
    `receipt_sha256=${result.digest}`,
    `receipt=${result.outputPath}`,
  ].join("\n");
}

async function main() {
  try {
    const options = parseFreezeArguments(process.argv.slice(2));
    const result = await freezeFinalRelease({ options });
    process.stdout.write(`${formatSuccess(result)}\n`);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown final-release freeze error.";
    process.stderr.write(`WITNESSPATCH FINAL RELEASE FREEZE FAIL: ${message}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
