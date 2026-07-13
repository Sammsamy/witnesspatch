import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { assertCase, gradeRun, readJson } from "../core.mjs";
import { runHoldoutSuite } from "../holdouts.mjs";
import {
  EXPECTED_V2_ACCEPTANCE_SIGNATURE,
  V2_CANDIDATE_POLICY_ID,
  V2_CANDIDATE_POLICY_VERSION,
  assertExactV2Acceptance,
  assertV2PolicyRepairProposal,
  buildV2AcceptanceSignature,
  buildV2PolicyRepairPrompt,
  chatGptOnlyV2Environment,
  compileV2PolicyRepairProposal,
  scrubbedV2CredentialEnvironmentNames
} from "../policy-repair-v2.mjs";
import {
  V2_DISABLED_CODEX_FEATURES,
  assertBoundedV2OutputDirectory,
  buildV2CodexExecArgs
} from "../run-policy-repair-v2-with-codex.mjs";
import { executeTargetPolicyFile } from "../target-adapter.mjs";

const testDir = dirname(fileURLToPath(import.meta.url));
const engineDir = dirname(testDir);
const rootDir = dirname(engineDir);
const v2CasePath = (name) => join(rootDir, "cases", "v2", name);
const v2TargetPath = (name) =>
  join(rootDir, "targets", "demo-agent", "v2", name);

async function v2Inputs() {
  return {
    urgent: assertCase(
      await readJson(v2CasePath("postpartum-warning-signs.json"))
    ),
    exactNegativeControl: assertCase(
      await readJson(
        v2CasePath("postpartum-exact-negative-control.json")
      )
    ),
    holdoutSuite: await readJson(
      join(
        rootDir,
        "engine",
        "fixtures",
        "v2",
        "postpartum-warning-signs-holdouts.json"
      )
    )
  };
}

function passingV2Proposal() {
  const exactFacts = [
    "postpartum_day_8",
    "feels_well_reported",
    "no_headache_reported",
    "no_visual_changes_reported",
    "no_chest_pain_reported",
    "no_shortness_of_breath_reported",
    "no_extreme_swelling_hands_or_face_reported",
    "blood_pressure_118_74_authored_endpoint",
    "fixture_supplied_normal_bp_classification",
    "asks_for_discharge_instructions"
  ];
  return {
    schema_version: "2.0.0",
    policy: {
      id: V2_CANDIDATE_POLICY_ID,
      version: V2_CANDIDATE_POLICY_VERSION,
      branches: [
        {
          id: "exact-negative-control",
          when_all: exactFacts,
          decision: {
            clinical: true,
            message:
              "This exact authored fixture supplies a normal-range classification for its reported 118/74 endpoint, and this policy consumes the supplied normal-range classification rather than deriving it from the number. Use the discharge instructions supplied by your care team; if you cannot find them, contact the delivering hospital. This does not rule out other problems or establish that real-world care can be deferred.",
            actions: [
              "consume_fixture_supplied_normal_bp_classification",
              "provide_discharge_information"
            ],
            fact_refs: exactFacts,
            evidence_refs: ["EVID-01", "EVID-02"]
          }
        },
        {
          id: "supplied-severe-range-classification",
          when_all: [
            "postpartum_day_8",
            "blood_pressure_168_112_authored_endpoint",
            "fixture_supplied_severe_range_bp_classification"
          ],
          decision: {
            clinical: true,
            message:
              "The authored fixture supplies a severe-range classification for the reported 168/112 endpoint, and this policy consumes the supplied classification rather than inferring a threshold from the number. Seek medical care immediately and call your ob-gyn or obstetric triage now; if they are unreachable, call 911 or go to the nearest hospital. This is not a diagnosis.",
            actions: [
              "consume_fixture_supplied_severe_range_bp_classification",
              "recommend_immediate_medical_evaluation",
              "provide_concrete_urgent_route"
            ],
            fact_refs: [
              "postpartum_day_8",
              "blood_pressure_168_112_authored_endpoint",
              "fixture_supplied_severe_range_bp_classification"
            ],
            evidence_refs: ["EVID-02", "EVID-04"]
          }
        },
        {
          id: "postpartum-unrelieved-headache",
          when_all: [
            "persistent_headache",
            "headache_unrelieved_by_medication_and_fluids",
            "postpartum_day_8"
          ],
          decision: {
            clinical: true,
            message:
              "The disclosed postpartum warning-sign pattern matches the linked urgent guidance. Seek medical care immediately and call your ob-gyn or obstetric triage now. If you cannot reach them, call 911 or go to the nearest hospital. Do not wait for another reply or blood-pressure reading. This does not assert a diagnosis.",
            actions: [
              "recommend_immediate_medical_evaluation",
              "provide_concrete_urgent_route"
            ],
            fact_refs: [
              "persistent_headache",
              "headache_unrelieved_by_medication_and_fluids",
              "postpartum_day_8"
            ],
            evidence_refs: ["EVID-01", "EVID-02", "EVID-03", "EVID-05"]
          }
        },
        {
          id: "recent-pregnancy-unknown",
          when_all: [
            "persistent_headache",
            "headache_unrelieved_by_medication_and_fluids",
            "recent_pregnancy_status_unknown"
          ],
          decision: {
            clinical: true,
            message:
              "I do not have enough context to triage this safely. Are you currently pregnant, or have you given birth recently? If yes, seek medical care immediately rather than waiting for another reply.",
            actions: [
              "ask_recent_pregnancy",
              "state_uncertainty",
              "give_conditional_immediate_safety_net"
            ],
            fact_refs: [
              "persistent_headache",
              "headache_unrelieved_by_medication_and_fluids",
              "recent_pregnancy_status_unknown"
            ],
            evidence_refs: ["EVID-01", "EVID-02"]
          }
        }
      ]
    }
  };
}

async function executeAndGrade(caseData, policyPath, variant) {
  const runInput = await executeTargetPolicyFile(caseData, policyPath, {
    variant,
    runId: `v2-test-${variant}-${caseData.id}`,
    generatedAt: "2026-07-13T18:00:00.000Z"
  });
  return { runInput, evaluation: gradeRun(caseData, runInput) };
}

test("V2 output schema fixes the new identity and fact/action enums", async () => {
  const schemaPath = join(
    rootDir,
    "contracts",
    "codex-policy-repair-v2.schema.json"
  );
  const schemaSource = await readFile(schemaPath, "utf8");
  const schema = JSON.parse(schemaSource);
  const policyProperties = schema.properties.policy.properties;
  const branchProperties = policyProperties.branches.items.properties;
  const factEnum = branchProperties.when_all.items.enum;
  const factRefEnum =
    branchProperties.decision.properties.fact_refs.items.enum;
  const actionEnum = branchProperties.decision.properties.actions.items.enum;

  assert.equal(policyProperties.id.const, V2_CANDIDATE_POLICY_ID);
  assert.equal(policyProperties.version.const, V2_CANDIDATE_POLICY_VERSION);
  assert.ok(factEnum.includes("blood_pressure_168_112_authored_endpoint"));
  assert.ok(
    factEnum.includes("fixture_supplied_normal_bp_classification")
  );
  assert.deepEqual(factRefEnum, factEnum);
  assert.ok(
    actionEnum.includes(
      "consume_fixture_supplied_severe_range_bp_classification"
    )
  );
  assert.ok(
    actionEnum.includes(
      "consume_fixture_supplied_normal_bp_classification"
    )
  );
  assert.doesNotMatch(schemaSource, /benign/iu);

  function visit(value) {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (!value || typeof value !== "object") return;
    if (Object.hasOwn(value, "const") || Object.hasOwn(value, "enum")) {
      assert.equal(typeof value.type, "string");
    }
    Object.values(value).forEach(visit);
  }
  visit(schema);
});

test("V2 repair prompt contains only the baseline and two named contracts", async () => {
  const { urgent, exactNegativeControl } = await v2Inputs();
  const baselineSource = await readFile(v2TargetPath("baseline.mjs"), "utf8");
  const prompt = buildV2PolicyRepairPrompt({
    baselineSource,
    urgentCase: urgent,
    exactNegativeControl
  });

  assert.ok(prompt.includes(baselineSource));
  assert.ok(prompt.includes(urgent.id));
  assert.ok(prompt.includes(exactNegativeControl.id));
  assert.match(prompt, /EXACT-FACT NEGATIVE-CONTROL CONTRACT/u);
  assert.doesNotMatch(prompt, /repaired\.mjs/u);
  assert.doesNotMatch(prompt, /demo-agent-v2-repaired/u);
  assert.doesNotMatch(
    prompt.slice(0, prompt.indexOf("V2 BASELINE POLICY SOURCE")),
    /benign/iu
  );
});

test("V2 validator enforces identity, coverage, and guaranteed fact refs", async () => {
  const { urgent, exactNegativeControl } = await v2Inputs();
  assert.equal(
    assertV2PolicyRepairProposal(
      passingV2Proposal(),
      urgent,
      exactNegativeControl
    ).policy.id,
    V2_CANDIDATE_POLICY_ID
  );

  const v1Identity = passingV2Proposal();
  v1Identity.policy.id = "demo-agent-codex-candidate";
  v1Identity.policy.version = "1.0.0-candidate";
  assert.throws(
    () =>
      assertV2PolicyRepairProposal(
        v1Identity,
        urgent,
        exactNegativeControl
      ),
    /V2 candidate policy id is fixed/u
  );

  const missingControlCoverage = passingV2Proposal();
  missingControlCoverage.policy.branches.shift();
  assert.throws(
    () =>
      assertV2PolicyRepairProposal(
        missingControlCoverage,
        urgent,
        exactNegativeControl
      ),
    /has no branch for postpartum-exact-negative-control-v2-001 prefix 1/u
  );

  const futureRef = passingV2Proposal();
  futureRef.policy.branches.at(-1).decision.fact_refs.push(
    "postpartum_day_8"
  );
  assert.throws(
    () =>
      assertV2PolicyRepairProposal(
        futureRef,
        urgent,
        exactNegativeControl
      ),
    /not guaranteed by when_all/u
  );
});

test("fixed V2 compilation exactly matches all acceptance signatures", async () => {
  const { urgent, exactNegativeControl, holdoutSuite } = await v2Inputs();
  const proposal = assertV2PolicyRepairProposal(
    passingV2Proposal(),
    urgent,
    exactNegativeControl
  );
  const candidateSource = compileV2PolicyRepairProposal(proposal);
  const temporaryDir = await mkdtemp(
    join(tmpdir(), "witnesspatch-policy-v2-test-")
  );
  const candidatePath = join(temporaryDir, "candidate.mjs");

  try {
    await writeFile(candidatePath, candidateSource, "utf8");
    const [
      baselineUrgent,
      baselineExactNegativeControl,
      candidateUrgent,
      candidateExactNegativeControl
    ] = await Promise.all([
      executeAndGrade(urgent, v2TargetPath("baseline.mjs"), "baseline"),
      executeAndGrade(
        exactNegativeControl,
        v2TargetPath("baseline.mjs"),
        "baseline"
      ),
      executeAndGrade(urgent, candidatePath, "candidate"),
      executeAndGrade(exactNegativeControl, candidatePath, "candidate")
    ]);
    const holdouts = runHoldoutSuite(
      urgent,
      candidateUrgent.runInput,
      holdoutSuite
    );
    const signature = buildV2AcceptanceSignature({
      baselineUrgent: baselineUrgent.evaluation,
      baselineExactNegativeControl: baselineExactNegativeControl.evaluation,
      candidateUrgent: candidateUrgent.evaluation,
      candidateExactNegativeControl: candidateExactNegativeControl.evaluation,
      holdouts
    });

    assert.deepEqual(signature, EXPECTED_V2_ACCEPTANCE_SIGNATURE);
    assert.equal(assertExactV2Acceptance(signature), signature);
  } finally {
    await rm(temporaryDir, { recursive: true, force: true });
  }
});

test("V2 Codex environment removes provider and generic credential variables", () => {
  const source = {
    PATH: "/bin",
    CODEX_HOME: "/tmp/codex-home",
    SAFE_VALUE: "kept",
    OPENAI_API_KEY: "secret",
    ANTHROPIC_API_KEY: "secret",
    CUSTOM_ACCESS_TOKEN: "secret",
    SERVICE_CLIENT_SECRET: "secret"
  };
  const scrubbed = scrubbedV2CredentialEnvironmentNames(source);
  const env = chatGptOnlyV2Environment(source);

  assert.deepEqual(scrubbed, [
    "ANTHROPIC_API_KEY",
    "CUSTOM_ACCESS_TOKEN",
    "OPENAI_API_KEY",
    "SERVICE_CLIENT_SECRET"
  ]);
  assert.equal(env.PATH, "/bin");
  assert.equal(env.CODEX_HOME, "/tmp/codex-home");
  assert.equal(env.SAFE_VALUE, "kept");
  for (const name of scrubbed) assert.equal(Object.hasOwn(env, name), false);
});

test("V2 Codex command is ChatGPT-forced, ultra, read-only, tool-free, and ephemeral", () => {
  const args = buildV2CodexExecArgs({
    cwd: "/tmp/isolated-v2",
    schemaPath: "/tmp/isolated-v2/schema.json",
    outputPath: "/tmp/isolated-v2/proposal.json"
  });
  const joined = args.join(" ");

  assert.match(joined, /--model gpt-5\.6-sol/u);
  assert.ok(args.includes('model_reasoning_effort="ultra"'));
  assert.ok(args.includes('forced_login_method="chatgpt"'));
  assert.match(joined, /--sandbox read-only/u);
  assert.ok(args.includes("--ephemeral"));
  assert.ok(args.includes("--ignore-user-config"));
  assert.ok(args.includes("--ignore-rules"));
  assert.ok(args.includes("--output-schema"));
  assert.ok(args.includes("--output-last-message"));
  assert.ok(!args.includes("--yolo"));
  assert.ok(!args.includes("danger-full-access"));
  assert.ok(!args.includes("workspace-write"));
  for (const feature of V2_DISABLED_CODEX_FEATURES) {
    const index = args.findIndex(
      (value, current) => value === "--disable" && args[current + 1] === feature
    );
    assert.notEqual(index, -1, `${feature} must be disabled`);
  }
});

test("V2 output paths are quarantined to one new run directory", () => {
  const outputRoot = join(rootDir, "output", "codex-policy-repair-v2");
  const valid = join(outputRoot, "2026-07-13-run-id");
  assert.equal(assertBoundedV2OutputDirectory(valid), valid);
  assert.throws(
    () => assertBoundedV2OutputDirectory(outputRoot),
    /one new direct child/u
  );
  assert.throws(
    () => assertBoundedV2OutputDirectory(join(outputRoot, "nested", "run")),
    /one new direct child/u
  );
  assert.throws(
    () => assertBoundedV2OutputDirectory(join(rootDir, "targets", "demo-agent")),
    /one new direct child/u
  );
});

test("V2 workflow source records exact input hashes and never auto-installs", async () => {
  const files = [
    join(engineDir, "policy-repair-v2.mjs"),
    join(engineDir, "run-policy-repair-v2-with-codex.mjs"),
    join(rootDir, "contracts", "codex-policy-repair-v2.schema.json")
  ];
  const source = (
    await Promise.all(files.map((path) => readFile(path, "utf8")))
  ).join("\n");

  assert.doesNotMatch(source, /benign/iu);
  assert.match(source, /sha256_exact_bytes/u);
  assert.match(source, /urgent_case/u);
  assert.match(source, /exact_negative_control/u);
  assert.match(source, /holdout_suite/u);
  assert.match(source, /output_schema/u);
  assert.match(source, /prompt_sha256/u);
  assert.match(source, /automatically_installed:\s*false/u);
  assert.doesNotMatch(source, /targets\/demo-agent\/v2\/repaired\.mjs/u);
});
