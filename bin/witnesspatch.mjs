#!/usr/bin/env node

import { randomUUID } from "node:crypto";
import {
  lstat,
  mkdir,
  readFile,
  realpath,
  rename,
  rm,
  writeFile
} from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";

import {
  assertCase,
  buildRunArtifact,
  readJson,
  sha256
} from "../engine/core.mjs";
import {
  compileWitnessBundle,
  NoCompilableFailureError
} from "../engine/compile-witness.mjs";

function usage() {
  return [
    "Usage: witnesspatch evaluate --case PATH --candidate PATH [--out PATH]",
    "       witnesspatch compile --case PATH --run PATH --out-dir PATH [--rule ID]",
    "",
    "Re-grades a JSON run input or evaluated artifact against a fully synthetic",
    "case. The deterministic evaluator never imports policy code or invokes a model.",
    "",
    "compile emits an atomic, hash-listed static-trace witness bundle and a red",
    "contract regression. It never imports or reruns a target and never invokes a model.",
    "",
    "Exit codes: evaluate: 0 pass, 1 valid fail, 2 invalid input or usage.",
    "            compile: 0 compiled, 1 nothing to compile, 2 invalid input or usage."
  ].join("\n");
}

function parseArguments(args) {
  if (args.length === 1 && (args[0] === "--help" || args[0] === "-h")) {
    return { help: true };
  }
  if (args[0] !== "evaluate" && args[0] !== "compile") {
    const received = args[0] === undefined ? "no subcommand" : `subcommand ${args[0]}`;
    throw new Error(`Expected evaluate or compile; received ${received}. Use --help for usage.`);
  }

  const subcommand = args[0];
  const parsed = {
    help: false,
    subcommand,
    casePath: null,
    candidatePath: null,
    runPath: null,
    outPath: null,
    outDir: null,
    targetRuleId: null
  };
  const optionNames =
    subcommand === "evaluate"
      ? new Map([
          ["--case", "casePath"],
          ["--candidate", "candidatePath"],
          ["--out", "outPath"]
        ])
      : new Map([
          ["--case", "casePath"],
          ["--run", "runPath"],
          ["--out-dir", "outDir"],
          ["--rule", "targetRuleId"]
        ]);

  for (let index = 1; index < args.length; index += 1) {
    const option = args[index];
    const field = optionNames.get(option);
    if (!field) {
      throw new Error(`Unknown argument ${option}. Use --help for usage.`);
    }
    if (parsed[field] !== null) {
      throw new Error(`${option} may be supplied only once.`);
    }
    const value = args[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(
        `${option} requires ${option === "--rule" ? "an ID" : "a path"}.`
      );
    }
    parsed[field] = value;
    index += 1;
  }

  if (
    subcommand === "evaluate" &&
    (!parsed.casePath || !parsed.candidatePath)
  ) {
    throw new Error("evaluate requires both --case and --candidate.");
  }
  if (
    subcommand === "compile" &&
    (!parsed.casePath || !parsed.runPath || !parsed.outDir)
  ) {
    throw new Error("compile requires --case, --run, and --out-dir.");
  }
  return parsed;
}

async function writeAtomic(path, contents) {
  await mkdir(dirname(path), { recursive: true });
  const temporaryPath = resolve(
    dirname(path),
    `.${basename(path)}.${process.pid}.${randomUUID()}.tmp`
  );
  try {
    await writeFile(temporaryPath, contents, {
      encoding: "utf8",
      flag: "wx",
      mode: 0o600
    });
    await rename(temporaryPath, path);
  } finally {
    await rm(temporaryPath, { force: true });
  }
}

async function canonicalOutputPath(path) {
  const resolved = resolve(path);
  await mkdir(dirname(resolved), { recursive: true });
  const canonicalParent = await realpath(dirname(resolved));
  return join(canonicalParent, basename(resolved));
}

async function canonicalExistingOutputTarget(path) {
  try {
    return await realpath(path);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

async function existingPathDetails(path) {
  try {
    return await lstat(path);
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

async function writeBundleAtomic(requestedDirectory, files) {
  const resolved = resolve(requestedDirectory);
  await mkdir(dirname(resolved), { recursive: true });
  const canonicalParent = await realpath(dirname(resolved));
  const outputDirectory = join(canonicalParent, basename(resolved));
  if (await existingPathDetails(outputDirectory)) {
    throw new Error("--out-dir must name a new path; existing paths are never replaced.");
  }

  const temporaryDirectory = join(
    canonicalParent,
    `.${basename(resolved)}.${process.pid}.${randomUUID()}.tmp`
  );
  await mkdir(temporaryDirectory, { mode: 0o700 });
  try {
    for (const [name, contents] of files) {
      if (name !== basename(name)) {
        throw new Error(`Unsafe compiled bundle file name ${name}.`);
      }
      await writeFile(join(temporaryDirectory, name), contents, {
        encoding: "utf8",
        flag: "wx",
        mode: 0o600
      });
    }
    await rename(temporaryDirectory, outputDirectory);
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
  return outputDirectory;
}

function escapeControlCharacters(value) {
  return String(value).replace(/[\u0000-\u001f\u007f-\u009f]/g, (character) =>
    `\\u${character.codePointAt(0).toString(16).padStart(4, "0")}`
  );
}

function terminalField(value) {
  return JSON.stringify(escapeControlCharacters(value));
}

function safeErrorMessage(error) {
  return escapeControlCharacters(error instanceof Error ? error.message : String(error))
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 1000);
}

async function main() {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) {
      process.stdout.write(`${usage()}\n`);
      return 0;
    }

    if (options.subcommand === "compile") {
      const [casePath, runPath] = await Promise.all([
        realpath(resolve(options.casePath)),
        realpath(resolve(options.runPath))
      ]);
      const [caseBytes, runBytes] = await Promise.all([
        readFile(casePath),
        readFile(runPath)
      ]);
      const caseInput = JSON.parse(caseBytes.toString("utf8"));
      const runInput = JSON.parse(runBytes.toString("utf8"));
      const bundle = compileWitnessBundle(caseInput, runInput, {
        targetRuleId: options.targetRuleId,
        inputCaseSha256: sha256(caseBytes),
        inputRunSha256: sha256(runBytes)
      });
      const outputDirectory = await writeBundleAtomic(
        options.outDir,
        bundle.files
      );
      const summary = {
        ...bundle.receipt,
        output_directory: outputDirectory,
        output_file_count: bundle.files.size,
        manifest_sha256: sha256(bundle.files.get("manifest.json"))
      };
      process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
      process.stderr.write(
        `WITNESSPATCH COMPILED bundle=${terminalField(bundle.bundleId)} rule=${terminalField(bundle.targetRuleId)} files=${terminalField(bundle.files.size)}\n`
      );
      return 0;
    }

    const [casePath, candidatePath] = await Promise.all([
      realpath(resolve(options.casePath)),
      realpath(resolve(options.candidatePath))
    ]);

    const [caseInput, candidateInput] = await Promise.all([
      readJson(casePath),
      readJson(candidatePath)
    ]);
    const caseData = assertCase(caseInput);
    const artifact = buildRunArtifact(caseData, candidateInput);
    const serialized = `${JSON.stringify(artifact, null, 2)}\n`;

    if (options.outPath) {
      const outPath = await canonicalOutputPath(options.outPath);
      const existingOutputTarget = await canonicalExistingOutputTarget(outPath);
      if (
        outPath === casePath ||
        outPath === candidatePath ||
        existingOutputTarget === casePath ||
        existingOutputTarget === candidatePath
      ) {
        throw new Error("--out must not overwrite the case or candidate input.");
      }
      await writeAtomic(outPath, serialized);
    }

    process.stdout.write(serialized);
    const criticalFailures =
      artifact.evaluation.critical_failures.length > 0
        ? artifact.evaluation.critical_failures.join(",")
        : "none";
    process.stderr.write(
      `WITNESSPATCH ${artifact.evaluation.status.toUpperCase()} ${artifact.evaluation.score}/100 case=${terminalField(artifact.case_id)} run=${terminalField(artifact.run_id)} critical=${terminalField(criticalFailures)}\n`
    );
    return artifact.evaluation.status === "pass" ? 0 : 1;
  } catch (error) {
    if (error instanceof NoCompilableFailureError) {
      process.stderr.write(
        `WITNESSPATCH NOTHING_TO_COMPILE ${safeErrorMessage(error)}\n`
      );
      return 1;
    }
    process.stderr.write(`WITNESSPATCH ERROR ${safeErrorMessage(error)}\n`);
    return 2;
  }
}

process.exitCode = await main();
