import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { gradeRun, stableStringify } from "./core.mjs";
import { runHoldoutSuite } from "./holdouts.mjs";
import {
  EXPECTED_V2_ACCEPTANCE_SIGNATURE,
  assertExactV2Acceptance,
  assertV2PolicyRepairProposal,
  buildV2AcceptanceSignature,
  buildV2PolicyRepairPrompt,
  compileV2PolicyRepairProposal
} from "./policy-repair-v2.mjs";
import { assertCodexPolicyRepairV2Schema } from "./schema-validator.mjs";
import { executeTargetPolicyFile } from "./target-adapter.mjs";

const CAPTURE_PREFIX =
  "output/codex-policy-repair-v2/2026-07-13T17-49-55-290Z-cdc6f9e9";
const EXPECTED_DISABLED_TOOLS = Object.freeze([
  "shell_tool",
  "unified_exec",
  "browser_use",
  "computer_use",
  "apps",
  "multi_agent"
]);

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function assertByteRecord(record, path, bytes, label) {
  assert.equal(record.path, path, `${label} receipt path mismatch.`);
  assert.equal(record.sha256, sha256(bytes), `${label} receipt hash mismatch.`);
  assert.equal(
    record.byte_length,
    bytes.length,
    `${label} receipt byte length mismatch.`
  );
}

function makeUnifiedDiff(baselinePath, candidatePath) {
  const diff = spawnSync(
    "diff",
    [
      "-u",
      "--label",
      "a/targets/demo-agent/v2/baseline.mjs",
      baselinePath,
      "--label",
      "b/output/codex-policy-repair-v2/candidate.mjs",
      candidatePath
    ],
    { encoding: null }
  );
  assert.ok(
    [0, 1].includes(diff.status),
    `Unable to reproduce Sol V2 patch: ${diff.stderr?.toString("utf8") || "diff failed"}`
  );
  return diff.stdout;
}

async function executeAndGrade(caseData, policyPath, runId) {
  const runInput = await executeTargetPolicyFile(caseData, policyPath, {
    runId,
    generatedAt: "2026-07-13T17:58:03.407Z"
  });
  return { runInput, evaluation: gradeRun(caseData, runInput) };
}

export async function verifyV2SolProof({
  rootDir,
  runDir,
  urgentCase,
  exactNegativeCase,
  manifestGeneratedAt
}) {
  const publicPaths = {
    receipt: join(runDir, "sol-v2-receipt.json"),
    proposal: join(runDir, "sol-v2-proposal.json"),
    candidate: join(runDir, "sol-v2-candidate.mjs"),
    patch: join(runDir, "sol-v2-candidate.patch"),
    prompt: join(runDir, "sol-v2-prompt.txt"),
    baseline: join(runDir, "sol-v2-baseline-source.mjs"),
    urgent: join(runDir, "postpartum-warning-signs-case.json"),
    exactNegative: join(
      runDir,
      "postpartum-exact-negative-control-case.json"
    ),
    holdouts: join(runDir, "sol-v2-holdout-definition.json"),
    schema: join(runDir, "sol-v2-output-schema.json")
  };
  const proofPaths = {
    receipt: join(rootDir, "proof", "v2", "sol-v2-receipt.json"),
    proposal: join(rootDir, "proof", "v2", "sol-v2-proposal.json"),
    candidate: join(rootDir, "proof", "v2", "sol-v2-candidate.mjs"),
    patch: join(rootDir, "proof", "v2", "sol-v2-candidate.patch"),
    prompt: join(rootDir, "proof", "v2", "sol-v2-prompt.txt")
  };
  const sourcePaths = {
    baseline: join(rootDir, "targets", "demo-agent", "v2", "baseline.mjs"),
    urgent: join(rootDir, "cases", "v2", "postpartum-warning-signs.json"),
    exactNegative: join(
      rootDir,
      "cases",
      "v2",
      "postpartum-exact-negative-control.json"
    ),
    holdouts: join(
      rootDir,
      "engine",
      "fixtures",
      "v2",
      "postpartum-warning-signs-holdouts.json"
    ),
    schema: join(
      rootDir,
      "contracts",
      "codex-policy-repair-v2.schema.json"
    )
  };
  const publicBytes = Object.fromEntries(
    await Promise.all(
      Object.entries(publicPaths).map(async ([id, path]) => [id, await readFile(path)])
    )
  );
  const proofBytes = Object.fromEntries(
    await Promise.all(
      Object.entries(proofPaths).map(async ([id, path]) => [id, await readFile(path)])
    )
  );
  const sourceBytes = Object.fromEntries(
    await Promise.all(
      Object.entries(sourcePaths).map(async ([id, path]) => [id, await readFile(path)])
    )
  );

  for (const id of Object.keys(proofPaths)) {
    assert.deepEqual(
      publicBytes[id],
      proofBytes[id],
      `Public Sol V2 ${id} differs from retained proof/v2 bytes.`
    );
  }
  for (const id of Object.keys(sourcePaths)) {
    assert.deepEqual(
      publicBytes[id],
      sourceBytes[id],
      `Public Sol V2 ${id} input differs from exact checked-in source bytes.`
    );
  }

  const receipt = JSON.parse(publicBytes.receipt.toString("utf8"));
  const proposal = JSON.parse(publicBytes.proposal.toString("utf8"));
  const holdoutDefinition = JSON.parse(publicBytes.holdouts.toString("utf8"));

  assert.equal(receipt.schema_version, "2.0.0");
  assert.equal(receipt.status, "validated_candidate");
  assert.equal(receipt.started_at, "2026-07-13T17:49:55.322Z");
  assert.equal(receipt.generated_at, "2026-07-13T17:51:40.867Z");
  assert.ok(Date.parse(receipt.started_at) >= Date.parse("2026-07-13T16:00:00.000Z"));
  assert.ok(Date.parse(receipt.generated_at) >= Date.parse(receipt.started_at));
  assert.ok(Date.parse(manifestGeneratedAt) > Date.parse(receipt.generated_at));

  assert.equal(receipt.generation.mode, "local_codex_cli_chatgpt_subscription");
  assert.equal(receipt.generation.auth_status, "Logged in using ChatGPT");
  assert.equal(receipt.generation.api_key_required, false);
  assert.deepEqual(receipt.generation.credential_environment_scrubbed, []);
  assert.equal(receipt.generation.requested_model, "gpt-5.6-sol");
  assert.equal(receipt.generation.requested_reasoning_effort, "ultra");
  assert.equal(receipt.generation.forced_login_method, "chatgpt");
  assert.match(receipt.generation.codex_cli_version, /^codex-cli /u);
  assert.equal(receipt.generation.ephemeral, true);
  assert.equal(receipt.generation.sandbox, "read-only");
  assert.equal(receipt.generation.isolated_working_directory, true);
  assert.equal(receipt.generation.ignored_user_config, true);
  assert.equal(receipt.generation.ignored_exec_rules, true);
  assert.deepEqual(receipt.generation.model_tools_disabled, EXPECTED_DISABLED_TOOLS);
  assert.equal(receipt.generation.hidden_reasoning_captured, false);

  assert.equal(receipt.input_scope.hash_algorithm, "sha256_exact_bytes");
  assertByteRecord(
    receipt.input_scope.baseline,
    "targets/demo-agent/v2/baseline.mjs",
    publicBytes.baseline,
    "Baseline"
  );
  assertByteRecord(
    receipt.input_scope.urgent_case,
    "cases/v2/postpartum-warning-signs.json",
    publicBytes.urgent,
    "Urgent case"
  );
  assertByteRecord(
    receipt.input_scope.exact_negative_control,
    "cases/v2/postpartum-exact-negative-control.json",
    publicBytes.exactNegative,
    "Exact negative control"
  );
  assertByteRecord(
    receipt.input_scope.holdout_suite,
    "engine/fixtures/v2/postpartum-warning-signs-holdouts.json",
    publicBytes.holdouts,
    "Holdout suite"
  );
  assertByteRecord(
    receipt.input_scope.output_schema,
    "contracts/codex-policy-repair-v2.schema.json",
    publicBytes.schema,
    "Output schema"
  );
  assert.equal(receipt.input_scope.checked_in_repaired_policy_supplied, false);
  assert.equal(receipt.input_scope.holdout_suite_supplied_to_model, false);
  assert.equal(
    receipt.input_scope.isolated_model_directory_contains_repaired_policy,
    false
  );

  const reconstructedPrompt = Buffer.from(
    buildV2PolicyRepairPrompt({
      baselineSource: publicBytes.baseline.toString("utf8"),
      urgentCase,
      exactNegativeControl: exactNegativeCase
    }),
    "utf8"
  );
  assert.deepEqual(publicBytes.prompt, reconstructedPrompt);
  assert.equal(receipt.input_scope.prompt_sha256, sha256(reconstructedPrompt));

  assertCodexPolicyRepairV2Schema(proposal);
  assertV2PolicyRepairProposal(proposal, urgentCase, exactNegativeCase);
  assert.equal(
    receipt.candidate.representation,
    "schema_constrained_v2_declarative_ir_compiled_by_fixed_code"
  );
  assert.equal(receipt.candidate.policy_id, "demo-agent-v2-codex-candidate");
  assert.equal(receipt.candidate.policy_version, "2.0.0-candidate");
  assert.equal(receipt.candidate.automatically_installed, false);
  assert.equal(receipt.candidate.proposal_sha256, sha256(publicBytes.proposal));
  assert.equal(
    receipt.candidate.candidate_source_sha256,
    sha256(publicBytes.candidate)
  );
  assert.equal(receipt.candidate.patch_sha256, sha256(publicBytes.patch));
  assert.deepEqual(receipt.candidate.files, {
    proposal: `${CAPTURE_PREFIX}/proposal.json`,
    source: `${CAPTURE_PREFIX}/candidate.mjs`,
    patch: `${CAPTURE_PREFIX}/candidate.patch`
  });
  assert.deepEqual(
    publicBytes.candidate,
    Buffer.from(compileV2PolicyRepairProposal(proposal), "utf8")
  );
  assert.deepEqual(
    publicBytes.patch,
    makeUnifiedDiff(publicPaths.baseline, publicPaths.candidate)
  );

  const [
    baselineUrgent,
    baselineExactNegativeControl,
    candidateUrgent,
    candidateExactNegativeControl
  ] = await Promise.all([
    executeAndGrade(urgentCase, publicPaths.baseline, "proof-baseline-urgent"),
    executeAndGrade(
      exactNegativeCase,
      publicPaths.baseline,
      "proof-baseline-exact-negative"
    ),
    executeAndGrade(urgentCase, publicPaths.candidate, "proof-candidate-urgent"),
    executeAndGrade(
      exactNegativeCase,
      publicPaths.candidate,
      "proof-candidate-exact-negative"
    )
  ]);
  const holdouts = runHoldoutSuite(
    urgentCase,
    candidateUrgent.runInput,
    holdoutDefinition
  );
  const observedSignature = buildV2AcceptanceSignature({
    baselineUrgent: baselineUrgent.evaluation,
    baselineExactNegativeControl: baselineExactNegativeControl.evaluation,
    candidateUrgent: candidateUrgent.evaluation,
    candidateExactNegativeControl: candidateExactNegativeControl.evaluation,
    holdouts
  });
  assertExactV2Acceptance(observedSignature);
  assert.equal(receipt.deterministic_validation.exact_signature_match, true);
  assert.equal(
    stableStringify(receipt.deterministic_validation.expected_signature),
    stableStringify(EXPECTED_V2_ACCEPTANCE_SIGNATURE)
  );
  assert.equal(
    stableStringify(receipt.deterministic_validation.observed_signature),
    stableStringify(observedSignature)
  );
  assert.equal(holdouts.status, "pass");
  assert.equal(holdouts.passed, 4);
  assert.equal(holdouts.total, 4);
  assert.equal(receipt.safety.contains_real_patient_data, false);
  assert.equal(receipt.safety.clinician_validation, "pending");
  assert.equal(receipt.safety.model_is_final_grader, false);

  return { receipt, proposal, observedSignature };
}
