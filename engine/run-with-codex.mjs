#!/usr/bin/env node

import { execFile as execFileCallback, spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

import {
  buildPrefixOutputSchema,
  buildPrefixPrompt
} from "./codex-prefix.mjs";
import { buildRunArtifact, readJson, sha256 } from "./core.mjs";
import { chatGptOnlyEnvironment } from "./policy-repair.mjs";

const execFile = promisify(execFileCallback);
const engineDir = dirname(fileURLToPath(import.meta.url));
const rootDir = dirname(engineDir);

function usage() {
  return [
    "Usage: node engine/run-with-codex.mjs [--out PATH] [--check-auth]",
    "",
    "Runs the synthetic case through the local Codex CLI only when the CLI reports",
    "ChatGPT sign-in. Each invocation receives one timeline prefix, never the future",
    "steps. OpenAI API credential variables are removed from the child environment.",
    "The deployed web app never invokes this script."
  ].join("\n");
}

function parseArgs(args) {
  const parsed = {
    out: join(rootDir, "output", "codex", "candidate-local.json"),
    checkAuth: false
  };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--out") {
      const value = args[index + 1];
      if (!value) throw new Error("--out requires a path.");
      parsed.out = isAbsolute(value) ? value : resolve(rootDir, value);
      index += 1;
    } else if (arg === "--check-auth") {
      parsed.checkAuth = true;
    } else if (arg === "--help" || arg === "-h") {
      process.stdout.write(`${usage()}\n`);
      process.exit(0);
    } else {
      throw new Error(`Unknown argument ${arg}.\n${usage()}`);
    }
  }
  return parsed;
}

async function requireChatGptLogin(env) {
  const { stdout, stderr } = await execFile("codex", ["login", "status"], {
    cwd: rootDir,
    env
  });
  const status = `${stdout}\n${stderr}`.trim();
  if (!/Logged in using ChatGPT/i.test(status)) {
    throw new Error(
      `Refusing to run: Codex CLI did not confirm ChatGPT sign-in. Status: ${status || "unknown"}`
    );
  }
  return "Logged in using ChatGPT";
}

async function runCodexStep(prompt, schemaPath, outputPath, env, cwd) {
  await new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(
      "codex",
      [
        "exec",
        "--disable",
        "shell_tool",
        "--disable",
        "unified_exec",
        "--disable",
        "browser_use",
        "--disable",
        "computer_use",
        "--disable",
        "apps",
        "--disable",
        "multi_agent",
        "--ephemeral",
        "--ignore-user-config",
        "--ignore-rules",
        "--skip-git-repo-check",
        "--sandbox",
        "read-only",
        "--model",
        "gpt-5.6-sol",
        "--config",
        'model_reasoning_effort="ultra"',
        "--color",
        "never",
        "--cd",
        cwd,
        "--output-schema",
        schemaPath,
        "--output-last-message",
        outputPath,
        "-"
      ],
      { cwd, env, stdio: ["pipe", "ignore", "inherit"] }
    );
    child.on("error", rejectPromise);
    child.on("exit", (code, signal) => {
      if (code === 0) resolvePromise();
      else rejectPromise(new Error(`codex exec failed (${code ?? signal}).`));
    });
    child.stdin.end(prompt);
  });
}

export async function runCandidateWithCodex(options = {}) {
  const env = chatGptOnlyEnvironment();
  const authStatus = await requireChatGptLogin(env);
  if (options.checkAuth) {
    return { auth_status: authStatus, api_key_removed: true };
  }

  const caseData = await readJson(
    join(rootDir, "cases", "postpartum-warning-signs.json")
  );
  const temporaryDir = join(tmpdir(), `witnesspatch-${randomUUID()}`);
  await mkdir(temporaryDir, { recursive: true });

  try {
    const decisions = [];
    const rawOutputs = [];
    for (let index = 0; index < caseData.timeline.length; index += 1) {
      const schemaPath = join(temporaryDir, `step-${index + 1}-schema.json`);
      const rawOutputPath = join(temporaryDir, `step-${index + 1}-candidate.json`);
      await writeFile(
        schemaPath,
        `${JSON.stringify(buildPrefixOutputSchema(caseData, index), null, 2)}\n`,
        "utf8"
      );
      await runCodexStep(
        buildPrefixPrompt(caseData, index),
        schemaPath,
        rawOutputPath,
        env,
        temporaryDir
      );
      const rawOutput = await readFile(rawOutputPath, "utf8");
      const parsed = JSON.parse(rawOutput);
      rawOutputs.push(rawOutput);
      decisions.push(parsed.decision);
    }

    const { stdout: version } = await execFile("codex", ["--version"], {
      cwd: rootDir,
      env
    });
    const runInput = {
      run_id: `run-pws-candidate-${Date.now()}`,
      variant: "candidate",
      provenance: {
        generated_at: new Date().toISOString(),
        generation_mode: "local_codex_cli_chatgpt_subscription_prefix_only",
        model_config_requested: "gpt-5.6-sol",
        reasoning_effort_requested: "ultra",
        model_invocation_logged: true,
        codex_cli_version: version.trim(),
        auth_status: authStatus,
        raw_completion_sha256: sha256(rawOutputs.join("\n")),
        step_completion_sha256: rawOutputs.map((output) => sha256(output)),
        timeline_prefix_invocations: rawOutputs.length,
        future_steps_present_in_prompts: false,
        isolated_working_directory: true,
        model_tools_disabled: [
          "shell_tool",
          "unified_exec",
          "browser_use",
          "computer_use",
          "apps",
          "multi_agent"
        ],
        contains_real_patient_data: false,
        clinician_validation: "pending",
        api_key_required: false
      },
      decisions
    };
    const artifact = buildRunArtifact(caseData, runInput);
    const outputPath =
      options.out ?? join(rootDir, "output", "codex", "candidate-local.json");
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
    return { output_path: outputPath, artifact };
  } finally {
    await rm(temporaryDir, { recursive: true, force: true });
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2));
  const result = await runCandidateWithCodex(args);
  if (args.checkAuth) {
    process.stdout.write(`Ready: ${result.auth_status}; API-key environment removed.\n`);
  } else {
    process.stdout.write(
      `Wrote ${result.output_path}: ${result.artifact.evaluation.status} (${result.artifact.evaluation.score}/100).\n`
    );
  }
}
