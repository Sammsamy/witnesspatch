import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  access,
  lstat,
  mkdir,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { constants } from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const defaultVideoFile = join(
  projectRoot,
  "output",
  "playwright",
  "witnesspatch-founder-screen-master-final.mp4",
);
const defaultOutputFile = join(
  projectRoot,
  "output",
  "video-founder",
  "witnesspatch-demo-founder.mp4",
);
const valueArguments = new Set(["--audio-file", "--video-file", "--out"]);
export const reviewedScreenMaster = Object.freeze({
  durationSeconds: 148,
  sha256: "7d5604126e1e88d8cba07b4e1878f874e35fb881cdbe33c02e59443cf82b4de8",
});

function requireValue(condition, message) {
  if (!condition) throw new Error(message);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function runCommand(command, args, failureMessage) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    encoding: "utf8",
    env: process.env,
    maxBuffer: 16 * 1024 * 1024,
    windowsHide: true,
  });
  requireValue(
    result.error === undefined && result.status === 0,
    `${failureMessage}${result.stderr?.trim() ? ` ${result.stderr.trim()}` : ""}`,
  );
  return result.stdout.trim();
}

function mediaTool(name) {
  return process.env[`WITNESSPATCH_${name.toUpperCase()}_BIN`]?.trim() || name;
}

export function parseFounderVideoArguments(argv) {
  const values = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    requireValue(
      valueArguments.has(argument),
      `Unknown founder-video argument ${JSON.stringify(argument)}.`,
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
  requireValue(values.has("--audio-file"), "--audio-file is required.");
  const outputFile = resolve(values.get("--out") ?? defaultOutputFile);
  requireValue(
    extname(outputFile).toLowerCase() === ".mp4",
    "Founder-video output must use the .mp4 extension.",
  );
  return Object.freeze({
    audioFile: resolve(values.get("--audio-file")),
    videoFile: resolve(values.get("--video-file") ?? defaultVideoFile),
    outputFile,
  });
}

export function validateFounderMedia(videoReport, audioReport) {
  requireValue(videoReport && typeof videoReport === "object", "Invalid video probe.");
  requireValue(audioReport && typeof audioReport === "object", "Invalid audio probe.");
  const videoDuration = Number(videoReport.format?.duration);
  const audioDuration = Number(audioReport.format?.duration);
  const videoStreams = Array.isArray(videoReport.streams)
    ? videoReport.streams.filter((stream) => stream.codec_type === "video")
    : [];
  const masterAudioStreams = Array.isArray(videoReport.streams)
    ? videoReport.streams.filter((stream) => stream.codec_type === "audio")
    : [];
  const narrationStreams = Array.isArray(audioReport.streams)
    ? audioReport.streams.filter((stream) => stream.codec_type === "audio")
    : [];
  requireValue(
    Number.isFinite(videoDuration) &&
      videoDuration >= reviewedScreenMaster.durationSeconds - 0.5 &&
      videoDuration <= reviewedScreenMaster.durationSeconds + 0.5,
    "The screen master must be the reviewed 2:28 cut.",
  );
  requireValue(
    videoStreams.length === 1 &&
      videoStreams[0].codec_name === "h264" &&
      videoStreams[0].width === 1400 &&
      videoStreams[0].height === 900,
    "The screen master must contain one H.264 1400 x 900 video stream.",
  );
  requireValue(
    masterAudioStreams.length === 0,
    "The reviewed screen master must remain silent before founder audio is added.",
  );
  requireValue(
    Number.isFinite(audioDuration) && audioDuration >= 142 && audioDuration <= 147.5,
    "Founder audio must run from 2:22 through no later than 2:27.5 so no final words are truncated.",
  );
  requireValue(
    narrationStreams.length >= 1,
    "Founder audio must contain a decodable audio stream.",
  );
  return Object.freeze({ videoDuration, audioDuration });
}

async function requireRegularFile(path, description) {
  const stats = await lstat(path);
  requireValue(
    stats.isFile() && !stats.isSymbolicLink(),
    `${description} must be a real regular file, not a link.`,
  );
}

async function requireMissing(path) {
  try {
    await access(path, constants.F_OK);
  } catch (error) {
    if (error?.code === "ENOENT") return;
    throw error;
  }
  throw new Error(`Refusing to overwrite existing output ${path}.`);
}

function probe(path, ffprobe) {
  return JSON.parse(
    runCommand(
      ffprobe,
      [
        "-v",
        "error",
        "-show_entries",
        "format=duration:stream=codec_type,codec_name,width,height,sample_rate,channels",
        "-of",
        "json",
        path,
      ],
      `ffprobe could not decode ${path}.`,
    ),
  );
}

export async function assembleFounderVideo(options) {
  const ffmpeg = mediaTool("ffmpeg");
  const ffprobe = mediaTool("ffprobe");
  const receiptPath = `${options.outputFile}.receipt.json`;
  const digestPath = `${options.outputFile}.sha256`;
  const temporaryOutput = `${options.outputFile}.tmp-${process.pid}.mp4`;
  const temporaryReceipt = `${receiptPath}.tmp-${process.pid}`;
  const temporaryDigest = `${digestPath}.tmp-${process.pid}`;
  await Promise.all([
    requireRegularFile(options.videoFile, "Screen master"),
    requireRegularFile(options.audioFile, "Founder audio"),
    requireMissing(options.outputFile),
    requireMissing(receiptPath),
    requireMissing(digestPath),
  ]);
  requireValue(
    options.videoFile !== options.audioFile &&
      options.videoFile !== options.outputFile &&
      options.audioFile !== options.outputFile,
    "Founder-video input and output paths must be distinct.",
  );
  runCommand(ffmpeg, ["-version"], "ffmpeg is required to assemble the founder video.");
  runCommand(ffprobe, ["-version"], "ffprobe is required to validate the founder video.");
  const videoBytes = await readFile(options.videoFile);
  requireValue(
    sha256(videoBytes) === reviewedScreenMaster.sha256,
    "The screen master bytes do not match the reviewed 2:28 cut.",
  );
  const sourceVideo = probe(options.videoFile, ffprobe);
  const sourceAudio = probe(options.audioFile, ffprobe);
  const source = validateFounderMedia(sourceVideo, sourceAudio);
  await mkdir(dirname(options.outputFile), { recursive: true });
  let completed = false;
  try {
    runCommand(
      ffmpeg,
      [
        "-hide_banner",
        "-loglevel",
        "error",
        "-nostdin",
        "-n",
        "-i",
        options.videoFile,
        "-i",
        options.audioFile,
        "-map",
        "0:v:0",
        "-map",
        "1:a:0",
        "-map_metadata",
        "-1",
        "-c:v",
        "libx264",
        "-preset",
        "medium",
        "-crf",
        "18",
        "-pix_fmt",
        "yuv420p",
        "-af",
        "loudnorm=I=-16:LRA=11:TP=-1.5,apad",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        "-ar",
        "48000",
        "-ac",
        "2",
        "-t",
        source.videoDuration.toFixed(3),
        "-movflags",
        "+faststart",
        temporaryOutput,
      ],
      "ffmpeg could not assemble the founder video.",
    );
    const finalProbe = probe(temporaryOutput, ffprobe);
    const finalDuration = Number(finalProbe.format?.duration);
    const finalVideo = finalProbe.streams?.filter(
      (stream) => stream.codec_type === "video",
    );
    const finalAudio = finalProbe.streams?.filter(
      (stream) => stream.codec_type === "audio",
    );
    requireValue(
      Number.isFinite(finalDuration) && finalDuration >= 147.5 && finalDuration < 149,
      "Assembled founder video is not the expected sub-three-minute duration.",
    );
    requireValue(
      finalVideo?.length === 1 &&
        finalVideo[0].codec_name === "h264" &&
        finalVideo[0].width === 1400 &&
        finalVideo[0].height === 900,
      "Assembled founder video must contain one H.264 1400 x 900 stream.",
    );
    requireValue(
      finalAudio?.length === 1 &&
        finalAudio[0].codec_name === "aac" &&
        Number(finalAudio[0].sample_rate) === 48_000 &&
        finalAudio[0].channels === 2,
      "Assembled founder video must contain one 48 kHz stereo AAC stream.",
    );
    const [audioBytes, outputBytes, captionsBytes] = await Promise.all([
      readFile(options.audioFile),
      readFile(temporaryOutput),
      readFile(join(projectRoot, "submission", "video", "witnesspatch-demo.en.srt")),
    ]);
    const outputDigest = sha256(outputBytes);
    const receipt = {
      schema_version: "1.0.0",
      kind: "witnesspatch_founder_video_assembly",
      screen_master_sha256: sha256(videoBytes),
      founder_audio_sha256: sha256(audioBytes),
      captions_sha256: sha256(captionsBytes),
      output_sha256: outputDigest,
      duration_seconds: finalDuration,
      video: { codec: "h264", width: 1400, height: 900 },
      audio: { codec: "aac", sample_rate_hz: 48_000, channels: 2 },
      boundary:
        "This receipt proves deterministic media assembly and decoding, not speaker identity, narration accuracy, public visibility, or judge outcome. The entrant must audition the entire file and upload the reviewed SRT separately.",
    };
    await writeFile(temporaryReceipt, `${JSON.stringify(receipt, null, 2)}\n`, {
      encoding: "utf8",
      mode: 0o600,
    });
    await writeFile(temporaryDigest, `${outputDigest}  ${basename(options.outputFile)}\n`, {
      encoding: "utf8",
      mode: 0o600,
    });
    await rename(temporaryOutput, options.outputFile);
    await rename(temporaryReceipt, receiptPath);
    await rename(temporaryDigest, digestPath);
    completed = true;
    return Object.freeze({ outputFile: options.outputFile, receiptPath, digestPath, receipt });
  } finally {
    const cleanupPaths = [
      rm(temporaryOutput, { force: true }),
      rm(temporaryReceipt, { force: true }),
      rm(temporaryDigest, { force: true }),
    ];
    if (!completed) {
      cleanupPaths.push(
        rm(options.outputFile, { force: true }),
        rm(receiptPath, { force: true }),
        rm(digestPath, { force: true }),
      );
    }
    await Promise.all(cleanupPaths);
  }
}

function formatSuccess(result) {
  return [
    "WITNESSPATCH FOUNDER VIDEO ASSEMBLY PASS",
    `output=${result.outputFile}`,
    `duration_seconds=${result.receipt.duration_seconds}`,
    `sha256=${result.receipt.output_sha256}`,
    `receipt=${result.receiptPath}`,
    `captions=${join(projectRoot, "submission", "video", "witnesspatch-demo.en.srt")}`,
    "Human gate: audition the full file and confirm that the voice, words, timing, and on-screen actions match before upload.",
  ].join("\n");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  assembleFounderVideo(parseFounderVideoArguments(process.argv.slice(2)))
    .then((result) => process.stdout.write(`${formatSuccess(result)}\n`))
    .catch((error) => {
      process.stderr.write(`FOUNDER VIDEO ASSEMBLY FAILED: ${error.message}\n`);
      process.exitCode = 1;
    });
}
