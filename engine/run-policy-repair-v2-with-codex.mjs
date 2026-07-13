#!/usr/bin/env node

import { execFile as execFileCallback, spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import {
  lstat,
  mkdir,
  readFile,
  realpath,
  rm,
  writeFile
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { assertCase, gradeRun, sha256 } from "./core.mjs";
import { runHoldoutSuite } from "./holdouts.mjs";
import {
  EXPECTED_V2_ACCEPTANCE_SIGNATURE,
  assertExactV2Acceptance,
  assertV2PolicyRepairProposal,
  buildV2AcceptanceSignature,
  buildV2PolicyRepairPrompt,
  chatGptOnlyV2Environment,
  compileV2PolicyRepairProposal,
  scrubbedV2CredentialEnvironmentNames
} from "./policy-repair-v2.mjs";
import { executeTargetPolicyFile } from "./target-adapter.mjs";
import { createUnifiedDiff } from "./unified-diff.mjs";

const execFile = promisify(execFileCallback);
const engineDir = dirname(fileURLToPath(import.meta.url));
const rootDir = dirname(engineDir);
const outputRoot = join(rootDir, "output", "codex-policy-repair-v2");
const defaultTimeoutMs = 20 * 60 * 1000;

export const V2_DISABLED_CODEX_FEATURES = Object.freeze([
  "shell_tool",
  "unified_exec",
  "browser_use",
  "computer_use",
  "apps",
  "multi_agent"
]);

function usage() {
  return [
    "Usage: node engine/run-policy-repair-v2-with-codex.mjs [--out-dir PATH] [--check-auth]",
    "",
    "Uses the local Codex CLI through a confirmed ChatGPT sign-in to propose a",
    "schema-constrained V2 declarative repair. Credential variables are removed.",
    "The candidate is graded against the urgent case, exact negative control,",
    "and exact holdout signature under output/. It is never installed automatically."
  ].join("\n");
}

function defaultOutputDirectory() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return join(outputRoot, `${timestamp}-${randomUUID().slice(0, 8)}`);
}

export function assertBoundedV2OutputDirectory(outDir) {
  const resolved = resolve(outDir);
  const pathFromRoot = relative(outputRoot, resolved);
  if (
    pathFromRoot.length === 0 ||
    pathFromRoot === ".." ||
    pathFromRoot.startsWith(`..${sep}`) ||
    isAbsolute(pathFromRoot) ||
    pathFromRoot.includes(sep)
  ) {
    throw new Error(
      "--out-dir must be one new direct child of output/codex-policy-repair-v2/."
    );
  }
  return resolved;
}

async function prepareNewOutputDirectory(outDir) {
  await mkdir(outputRoot, { recursive: true });
  const rootStat = await lstat(outputRoot);
  if (rootStat.isSymbolicLink()) {
    throw new Error("Refusing a symbolic-link V2 output root.");
  }
  if ((await realpath(outputRoot)) !== resolve(outputRoot)) {
    throw new Error("Refusing a V2 output root reached through symbolic links.");
  }
  await mkdir(outDir);
}

function parseArgs(args) {
  const parsed = { outDir: null, checkAuth: false };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--out-dir") {
      const value = args[index + 1];
      if (!value) throw new Error("--out-dir requires a path.");
      parsed.outDir = isAbsolute(value) ? value : resolve(rootDir, value);
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

export async function requireV2ChatGptLogin(env) {
  const { stdout, stderr } = await execFile("codex", ["login", "status"], {
    cwd: rootDir,
    env
  });
  const status = `${stdout}\n${stderr}`.trim();
  if (!/Logged in using ChatGPT/i.test(status)) {
    throw new Error(
      `Refusing V2 run: Codex CLI did not confirm ChatGPT sign-in. Status: ${status || "unknown"}`
    );
  }
  return "Logged in using ChatGPT";
}

export function buildV2CodexExecArgs({ cwd, schemaPath, outputPath }) {
  const disabled = V2_DISABLED_CODEX_FEATURES.flatMap((feature) => [
    "--disable",
    feature
  ]);
  return [
    "exec",
    ...disabled,
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
    "--config",
    'forced_login_method="chatgpt"',
    "--color",
    "never",
    "--cd",
    cwd,
    "--output-schema",
    schemaPath,
    "--output-last-message",
    outputPath,
    "-"
  ];
}

async function invokeV2Codex({ prompt, schemaPath, outputPath, env, cwd }) {
  await new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(
      "codex",
      buildV2CodexExecArgs({ cwd, schemaPath, outputPath }),
      { cwd, env, stdio: ["pipe", "ignore", "inherit"] }
    );
    let settled = false;
    const settle = (callback) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      callback();
    };
    const timeout = setTimeout(() => {
      child.kill("SIGTERM");
      settle(() =>
        rejectPromise(
          new Error("Codex V2 repair generation timed out after 20 minutes.")
        )
      );
    }, defaultTimeoutMs);
    child.on("error", (error) => settle(() => rejectPromise(error)));
    child.on("exit", (code, signal) =>
      settle(() => {
        if (code === 0) resolvePromise();
        else rejectPromise(new Error(`codex exec failed (${code ?? signal}).`));
      })
    );
    child.stdin.end(prompt);
  });
}

async function executeAndGrade(caseData, policyPath, variant) {
  const runInput = await executeTargetPolicyFile(caseData, policyPath, {
    variant,
    runId: `target-v2-${variant}-${caseData.id}-${randomUUID()}`,
    generatedAt: new Date().toISOString()
  });
  return { runInput, evaluation: gradeRun(caseData, runInput) };
}

function safeErrorMessage(error) {
  const message = error instanceof Error ? error.message : String(error);
  return message.replaceAll(rootDir, "<repo>").slice(0, 1600);
}

function exactInputRecord(path, bytes) {
  return {
    path: relative(rootDir, path),
    sha256: sha256(bytes),
    byte_length: bytes.byteLength
  };
}

export async function runV2PolicyRepairWithCodex(options = {}) {
  const sourceEnvironment = options.sourceEnvironment ?? process.env;
  const scrubbedNames = scrubbedV2CredentialEnvironmentNames(sourceEnvironment);
  const env = chatGptOnlyV2Environment(sourceEnvironment);
  const authStatus = await requireV2ChatGptLogin(env);
  if (options.checkAuth) {
    return {
      auth_status: authStatus,
      credential_environment_scrubbed: scrubbedNames
    };
  }

  const outDir = assertBoundedV2OutputDirectory(
    options.outDir ?? defaultOutputDirectory()
  );
  const temporaryDir = join(tmpdir(), `witnesspatch-repair-v2-${randomUUID()}`);
  const receiptPath = join(outDir, "receipt.json");
  await prepareNewOutputDirectory(outDir);
  await mkdir(temporaryDir);

  const baselinePath = join(
    rootDir,
    "targets",
    "demo-agent",
    "v2",
    "baseline.mjs"
  );
  const urgentPath = join(
    rootDir,
    "cases",
    "v2",
    "postpartum-warning-signs.json"
  );
  const exactNegativeControlPath = join(
    rootDir,
    "cases",
    "v2",
    "postpartum-exact-negative-control.json"
  );
  const holdoutPath = join(
    rootDir,
    "engine",
    "fixtures",
    "v2",
    "postpartum-warning-signs-holdouts.json"
  );
  const sourceSchemaPath = join(
    rootDir,
    "contracts",
    "codex-policy-repair-v2.schema.json"
  );
  const isolatedSchemaPath = join(temporaryDir, "output-schema.json");
  const rawOutputPath = join(temporaryDir, "proposal.json");
  const proposalPath = join(outDir, "proposal.json");
  const candidatePath = join(outDir, "candidate.mjs");
  const patchPath = join(outDir, "candidate.patch");
  const startedAt = new Date().toISOString();
  let rawOutput = null;
  let inputScope = null;

  try {
    const [
      baselineBytes,
      urgentBytes,
      exactNegativeControlBytes,
      holdoutBytes,
      schemaBytes
    ] = await Promise.all([
      readFile(baselinePath),
      readFile(urgentPath),
      readFile(exactNegativeControlPath),
      readFile(holdoutPath),
      readFile(sourceSchemaPath)
    ]);
    const baselineSource = baselineBytes.toString("utf8");
    const urgentCase = assertCase(JSON.parse(urgentBytes.toString("utf8")));
    const exactNegativeControl = assertCase(
      JSON.parse(exactNegativeControlBytes.toString("utf8"))
    );
    const holdoutSuite = JSON.parse(holdoutBytes.toString("utf8"));
    await writeFile(isolatedSchemaPath, schemaBytes, { flag: "wx" });

    const prompt = buildV2PolicyRepairPrompt({
      baselineSource,
      urgentCase,
      exactNegativeControl
    });
    inputScope = {
      hash_algorithm: "sha256_exact_bytes",
      baseline: exactInputRecord(baselinePath, baselineBytes),
      urgent_case: exactInputRecord(urgentPath, urgentBytes),
      exact_negative_control: exactInputRecord(
        exactNegativeControlPath,
        exactNegativeControlBytes
      ),
      holdout_suite: exactInputRecord(holdoutPath, holdoutBytes),
      output_schema: exactInputRecord(sourceSchemaPath, schemaBytes),
      prompt_sha256: sha256(prompt),
      checked_in_repaired_policy_supplied: false,
      holdout_suite_supplied_to_model: false,
      isolated_model_directory_contains_repaired_policy: false
    };

    await invokeV2Codex({
      prompt,
      schemaPath: isolatedSchemaPath,
      outputPath: rawOutputPath,
      env,
      cwd: temporaryDir
    });

    rawOutput = await readFile(rawOutputPath, "utf8");
    const proposal = assertV2PolicyRepairProposal(
      JSON.parse(rawOutput),
      urgentCase,
      exactNegativeControl
    );
    const candidateSource = compileV2PolicyRepairProposal(proposal);
    await Promise.all([
      writeFile(proposalPath, rawOutput, { encoding: "utf8", flag: "wx" }),
      writeFile(candidatePath, candidateSource, {
        encoding: "utf8",
        flag: "wx"
      })
    ]);

    const [
      baselineUrgent,
      baselineExactNegativeControl,
      candidateUrgent,
      candidateExactNegativeControl
    ] = await Promise.all([
      executeAndGrade(urgentCase, baselinePath, "baseline"),
      executeAndGrade(exactNegativeControl, baselinePath, "baseline"),
      executeAndGrade(urgentCase, candidatePath, "candidate"),
      executeAndGrade(exactNegativeControl, candidatePath, "candidate")
    ]);
    const holdouts = runHoldoutSuite(
      urgentCase,
      candidateUrgent.runInput,
      holdoutSuite
    );
    const observedSignature = buildV2AcceptanceSignature({
      baselineUrgent: baselineUrgent.evaluation,
      baselineExactNegativeControl: baselineExactNegativeControl.evaluation,
      candidateUrgent: candidateUrgent.evaluation,
      candidateExactNegativeControl: candidateExactNegativeControl.evaluation,
      holdouts
    });
    let signatureError = null;
    try {
      assertExactV2Acceptance(observedSignature);
    } catch (error) {
      signatureError = error;
    }

    const patch = createUnifiedDiff({
      oldText: baselineSource,
      newText: candidateSource,
      oldLabel: "a/targets/demo-agent/v2/baseline.mjs",
      newLabel: "b/output/codex-policy-repair-v2/candidate.mjs"
    });
    await writeFile(patchPath, patch, { encoding: "utf8", flag: "wx" });
    const { stdout: versionOutput } = await execFile("codex", ["--version"], {
      cwd: rootDir,
      env
    });
    const receipt = {
      schema_version: "2.0.0",
      status: signatureError ? "rejected_candidate" : "validated_candidate",
      generated_at: new Date().toISOString(),
      started_at: startedAt,
      generation: {
        mode: "local_codex_cli_chatgpt_subscription",
        auth_status: authStatus,
        api_key_required: false,
        credential_environment_scrubbed: scrubbedNames,
        requested_model: "gpt-5.6-sol",
        requested_reasoning_effort: "ultra",
        forced_login_method: "chatgpt",
        codex_cli_version: versionOutput.trim(),
        ephemeral: true,
        sandbox: "read-only",
        isolated_working_directory: true,
        ignored_user_config: true,
        ignored_exec_rules: true,
        model_tools_disabled: [...V2_DISABLED_CODEX_FEATURES],
        hidden_reasoning_captured: false
      },
      input_scope: inputScope,
      candidate: {
        representation:
          "schema_constrained_v2_declarative_ir_compiled_by_fixed_code",
        policy_id: proposal.policy.id,
        policy_version: proposal.policy.version,
        automatically_installed: false,
        proposal_sha256: sha256(rawOutput),
        candidate_source_sha256: sha256(candidateSource),
        patch_sha256: sha256(patch),
        files: {
          proposal: relative(rootDir, proposalPath),
          source: relative(rootDir, candidatePath),
          patch: relative(rootDir, patchPath)
        }
      },
      deterministic_validation: {
        acceptance_rule:
          "The baseline and candidate must exactly match the versioned urgent, exact-negative-control, and four-check holdout signature.",
        exact_signature_match: signatureError === null,
        expected_signature: EXPECTED_V2_ACCEPTANCE_SIGNATURE,
        observed_signature: observedSignature
      },
      safety: {
        contains_real_patient_data: false,
        clinician_validation: "pending",
        intended_use: "developer_safety_regression_demo_only",
        model_is_final_grader: false,
        exact_negative_control_limitation:
          "The exact negative control rejects one always-escalate mutation only; it does not establish patient safety or that care can be deferred.",
        bp_scope_limitation:
          "Only two authored endpoint fixtures are tested. The grader consumes supplied classifications and does not infer numeric thresholds.",
        limitation:
          "Passing these synthetic software contracts is not clinical validation or evidence of real-world safety."
      }
    };
    await writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, {
      encoding: "utf8",
      flag: "wx"
    });
    if (signatureError) {
      throw new Error(
        `Generated V2 candidate failed exact deterministic acceptance. Receipt: ${relative(rootDir, receiptPath)}. ${signatureError.message}`
      );
    }
    return { out_dir: outDir, receipt };
  } catch (error) {
    try {
      const existingReceipt = await readFile(receiptPath, "utf8").catch(
        () => null
      );
      if (!existingReceipt) {
        const rejected = {
          schema_version: "2.0.0",
          status: "generation_or_validation_error",
          generated_at: new Date().toISOString(),
          started_at: startedAt,
          error: safeErrorMessage(error),
          generation: {
            mode: "local_codex_cli_chatgpt_subscription",
            auth_status: authStatus,
            api_key_required: false,
            credential_environment_scrubbed: scrubbedNames,
            requested_model: "gpt-5.6-sol",
            requested_reasoning_effort: "ultra",
            forced_login_method: "chatgpt",
            ephemeral: true,
            sandbox: "read-only",
            isolated_working_directory: true,
            ignored_user_config: true,
            ignored_exec_rules: true,
            model_tools_disabled: [...V2_DISABLED_CODEX_FEATURES],
            hidden_reasoning_captured: false
          },
          input_scope: inputScope,
          candidate: {
            automatically_installed: false,
            raw_completion_sha256: rawOutput ? sha256(rawOutput) : null
          },
          safety: {
            contains_real_patient_data: false,
            clinician_validation: "pending",
            model_is_final_grader: false
          }
        };
        await writeFile(receiptPath, `${JSON.stringify(rejected, null, 2)}\n`, {
          encoding: "utf8",
          flag: "wx"
        });
      }
    } catch {
      // Preserve the original failure if even the sanitized receipt cannot be written.
    }
    throw error;
  } finally {
    await rm(temporaryDir, { recursive: true, force: true });
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const args = parseArgs(process.argv.slice(2));
    const result = await runV2PolicyRepairWithCodex(args);
    if (args.checkAuth) {
      process.stdout.write(
        `Ready: ${result.auth_status}; credential environment will be scrubbed.\n`
      );
    } else {
      process.stdout.write(
        `Validated V2 Codex repair candidate in ${relative(rootDir, result.out_dir)}. It was not installed.\n`
      );
    }
  } catch (error) {
    process.stderr.write(`${safeErrorMessage(error)}\n`);
    process.exitCode = 1;
  }
}
