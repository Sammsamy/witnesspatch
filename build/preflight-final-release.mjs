import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  verifyCleanRepositoryState,
  verifyLocalVideoFile,
  verifyReleaseFoundation,
} from "./freeze-final-release.mjs";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SHA256_PATTERN = /^[0-9a-f]{64}$/u;

function requireValue(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

export function resolvePreflightPath(rootDir, value, description) {
  requireValue(
    typeof value === "string" && value && !isAbsolute(value),
    `${description} must be a repository-relative path.`,
  );
  const path = resolve(rootDir, value);
  const fromRoot = relative(resolve(rootDir), path);
  requireValue(
    fromRoot && fromRoot !== ".." && !fromRoot.startsWith(`..${process.platform === "win32" ? "\\" : "/"}`),
    `${description} must stay inside the repository.`,
  );
  return path;
}

export function validateFinalPreflightManifest(value) {
  requireValue(
    value &&
      value.schema_version === "1.0.0" &&
      value.kind === "witnesspatch_final_release_preflight",
    "Final release preflight manifest is invalid.",
  );
  requireValue(
    value.status === "ready_for_review",
    "Final release preflight is superseded or not ready for review.",
  );
  requireValue(
    typeof value.repository_url === "string" &&
      typeof value.deployment_url === "string",
    "Final release preflight manifest is missing public endpoints.",
  );
  const candidate = value.video_candidate;
  requireValue(
    candidate &&
      candidate.id === "ai-piper-ljspeech-v1" &&
      candidate.narration_mode === "ai_generated_voice",
    "Final release preflight must identify the reviewed AI-narrated candidate.",
  );
  for (const [field, digest] of [
    ["video candidate", candidate.sha256],
    ["captions", candidate.captions_sha256],
    ["YouTube description", candidate.youtube_description_sha256],
  ]) {
    requireValue(SHA256_PATTERN.test(digest), `Invalid ${field} SHA-256.`);
  }
  requireValue(
    Number.isSafeInteger(candidate.byte_length) && candidate.byte_length > 0,
    "Final video candidate byte length is invalid.",
  );
  requireValue(
    Number.isFinite(candidate.duration_seconds) &&
      candidate.duration_seconds > 0 &&
      candidate.duration_seconds < 180,
    "Final video candidate duration is invalid.",
  );
  requireValue(
    candidate.video?.codec === "h264" &&
      candidate.video.width === 1400 &&
      candidate.video.height === 900 &&
      candidate.audio?.codec === "aac" &&
      candidate.audio.sample_rate_hz === 48_000 &&
      candidate.audio.channels === 2,
    "Final video candidate must declare the reviewed H.264/AAC delivery profile.",
  );
  requireValue(
    candidate.entrant_complete_review === "pending" &&
      candidate.public_youtube_upload === "pending",
    "Preflight may not claim entrant review or a public YouTube upload.",
  );
  return Object.freeze(value);
}

function requireVideoMatchesCandidate(video, candidate) {
  requireValue(
    video.sha256 === candidate.sha256 &&
      video.byte_length === candidate.byte_length,
    "Local final video bytes do not match the tracked preflight candidate.",
  );
  requireValue(
    Math.abs(video.duration_seconds - candidate.duration_seconds) < 0.001,
    "Local final video duration does not match the tracked preflight candidate.",
  );
  requireValue(
    video.video.codec === candidate.video.codec &&
      video.video.width === candidate.video.width &&
      video.video.height === candidate.video.height &&
      video.audio.codec === candidate.audio.codec &&
      video.audio.sampleRateHz === candidate.audio.sample_rate_hz &&
      video.audio.channels === candidate.audio.channels,
    "Local final video delivery profile does not match the tracked preflight candidate.",
  );
}

export async function preflightFinalRelease({
  rootDir = projectRoot,
  fetchImpl = fetch,
  commandRunner,
  now = () => new Date(),
} = {}) {
  const initialState = verifyCleanRepositoryState({ rootDir, commandRunner });
  const manifestPath = resolve(
    rootDir,
    "submission",
    "release",
    "final-preflight.json",
  );
  const manifestBytes = await readFile(manifestPath);
  const manifest = validateFinalPreflightManifest(
    JSON.parse(manifestBytes.toString("utf8")),
  );
  const candidate = manifest.video_candidate;
  const videoPath = resolvePreflightPath(
    rootDir,
    candidate.local_path,
    "Video candidate path",
  );
  const captionsPath = resolvePreflightPath(
    rootDir,
    candidate.captions_path,
    "Captions path",
  );
  const descriptionPath = resolvePreflightPath(
    rootDir,
    candidate.youtube_description_path,
    "YouTube description path",
  );

  const foundation = await verifyReleaseFoundation({
    repositoryUrl: manifest.repository_url,
    deploymentUrl: manifest.deployment_url,
    rootDir,
    fetchImpl,
    commandRunner,
    expectedCommit: initialState.commit,
  });
  const [initialVideo, captionsBytes, descriptionBytes] = await Promise.all([
    verifyLocalVideoFile({ videoFile: videoPath, commandRunner }),
    readFile(captionsPath),
    readFile(descriptionPath),
  ]);
  requireVideoMatchesCandidate(initialVideo, candidate);
  requireValue(
    sha256(captionsBytes) === candidate.captions_sha256,
    "Final captions changed after review packaging.",
  );
  requireValue(
    sha256(descriptionBytes) === candidate.youtube_description_sha256,
    "Prepared YouTube description changed after review packaging.",
  );
  const captions = captionsBytes.toString("utf8");
  const description = descriptionBytes.toString("utf8");
  requireValue(
    captions.includes("This demo uses AI narration") &&
      description.includes("This video uses synthetic narration") &&
      description.includes("No voice cloning was performed") &&
      description.includes("No physician review") &&
      description.includes("No clinical validation claim"),
    "AI narration or clinical-boundary disclosure is missing from the prepared release text.",
  );
  const finalVideo = await verifyLocalVideoFile({
    videoFile: videoPath,
    commandRunner,
  });
  requireVideoMatchesCandidate(finalVideo, candidate);
  requireValue(
    finalVideo.sha256 === initialVideo.sha256 &&
      finalVideo.byte_length === initialVideo.byte_length,
    "Local final video changed between preflight verification phases.",
  );
  verifyCleanRepositoryState({
    rootDir,
    commandRunner,
    expectedCommit: initialState.commit,
  });
  const [terminalVideoBytes, terminalManifestBytes] = await Promise.all([
    readFile(videoPath),
    readFile(manifestPath),
  ]);
  requireValue(
    sha256(terminalVideoBytes) === candidate.sha256 &&
      terminalVideoBytes.length === candidate.byte_length,
    "Local final video changed at the end of preflight verification.",
  );
  requireValue(
    sha256(terminalManifestBytes) === sha256(manifestBytes),
    "Tracked final preflight manifest changed during verification.",
  );
  return Object.freeze({
    schema_version: "1.0.0",
    kind: "witnesspatch_final_release_preflight_result",
    status: "pass",
    verified_at: now().toISOString(),
    commit: foundation.commit,
    repository_url: foundation.repository.normalized,
    repository_ci_url: foundation.repositoryVerification.remote_ci.html_url,
    deployment_url: foundation.deploymentUrl,
    deployment_public_files_byte_verified:
      foundation.deploymentVerification.public_files_byte_verified,
    local_video: finalVideo,
    captions_sha256: candidate.captions_sha256,
    youtube_description_sha256: candidate.youtube_description_sha256,
    remaining_human_gates: Object.freeze([
      "Entrant watches and listens to the complete reviewed candidate.",
      "Entrant authorizes and completes the public YouTube upload.",
      "Entrant completes Codex /feedback and supplies its returned Session ID.",
      "Run release:freeze with the public URL, Session ID, and explicit confirmations.",
    ]),
    boundary:
      "This preflight proves the clean public tip, exact successful CI, byte-matched deployment, machine-readable local video profile and bytes, captions, and prepared description. It does not claim entrant audition, public video availability, YouTube/local byte equality, /feedback completion, or final Devpost submission.",
  });
}

function formatSuccess(result) {
  return [
    "WITNESSPATCH FINAL RELEASE PREFLIGHT PASS",
    `commit=${result.commit}`,
    `ci=${result.repository_ci_url}`,
    `deployment=${result.deployment_url}`,
    `deployment_files=${result.deployment_public_files_byte_verified}`,
    `video_sha256=${result.local_video.sha256}`,
    `video_duration_seconds=${result.local_video.duration_seconds}`,
    `captions_sha256=${result.captions_sha256}`,
    `youtube_description_sha256=${result.youtube_description_sha256}`,
    "remaining=entrant audition + public YouTube URL + Codex /feedback Session ID + final freeze",
  ].join("\n");
}

async function main() {
  try {
    const result = await preflightFinalRelease();
    process.stdout.write(`${formatSuccess(result)}\n`);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown final-release preflight error.";
    process.stderr.write(`WITNESSPATCH FINAL RELEASE PREFLIGHT FAIL: ${message}\n`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
