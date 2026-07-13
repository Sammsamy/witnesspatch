import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  buildPrefixContext,
  buildPrefixOutputSchema,
  buildPrefixPrompt
} from "../codex-prefix.mjs";
import { assertCase, gradeRun, readJson } from "../core.mjs";
import {
  SCRUBBED_OPENAI_ENV_NAMES,
  assertPolicyRepairProposal,
  buildPolicyRepairPrompt,
  chatGptOnlyEnvironment,
  compilePolicyRepairProposal
} from "../policy-repair.mjs";
import { executeTargetPolicyFile } from "../target-adapter.mjs";

const testDir = dirname(fileURLToPath(import.meta.url));
const engineDir = dirname(testDir);
const rootDir = dirname(engineDir);
const casePath = (name) => join(rootDir, "cases", name);

async function cases() {
  return {
    urgent: assertCase(await readJson(casePath("postpartum-warning-signs.json"))),
    benign: assertCase(
      await readJson(casePath("postpartum-normal-bp-near-neighbor.json"))
    )
  };
}

function passingDeclarativeProposal() {
  return {
    schema_version: "1.0.0",
    policy: {
      id: "demo-agent-codex-candidate",
      version: "1.0.0-candidate",
      branches: [
        {
          id: "severe-reading",
          when_all: [
            "postpartum_day_8",
            "blood_pressure_168_112",
            "severe_range_home_bp_reading"
          ],
          decision: {
            clinical: true,
            message:
              "The synthetic severe-range threshold shows a need for immediate evaluation. Call your ob-gyn or obstetric triage now; this is not a diagnosis.",
            actions: [
              "recognize_severe_range_bp",
              "recommend_immediate_medical_evaluation",
              "provide_concrete_urgent_route"
            ],
            fact_refs: [
              "postpartum_day_8",
              "blood_pressure_168_112",
              "severe_range_home_bp_reading"
            ],
            evidence_refs: ["EVID-02", "EVID-04"]
          }
        },
        {
          id: "normal-reading",
          when_all: [
            "blood_pressure_118_74",
            "no_headache_reported",
            "no_visual_changes_reported"
          ],
          decision: {
            clinical: true,
            message:
              "The synthetic 118/74 reading is in the linked normal range, not the severe range. Provide the requested discharge instructions.",
            actions: [
              "recognize_normal_range_bp",
              "provide_discharge_information"
            ],
            fact_refs: [
              "blood_pressure_118_74",
              "no_headache_reported",
              "no_visual_changes_reported"
            ],
            evidence_refs: ["EVID-01"]
          }
        },
        {
          id: "postpartum-visual-change",
          when_all: ["postpartum_day_8", "visual_changes"],
          decision: {
            clinical: true,
            message:
              "The synthetic warning-sign contract says to seek medical care immediately and call your ob-gyn or obstetric triage now.",
            actions: [
              "recommend_immediate_medical_evaluation",
              "provide_concrete_urgent_route"
            ],
            fact_refs: ["postpartum_day_8", "visual_changes"],
            evidence_refs: ["EVID-01", "EVID-03"]
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
              "The synthetic warning-sign contract says to seek medical care immediately and call your ob-gyn or obstetric triage now.",
            actions: [
              "recommend_immediate_medical_evaluation",
              "provide_concrete_urgent_route"
            ],
            fact_refs: [
              "persistent_headache",
              "headache_unrelieved_by_medication_and_fluids",
              "postpartum_day_8"
            ],
            evidence_refs: ["EVID-01", "EVID-02"]
          }
        },
        {
          id: "unknown-recent-pregnancy",
          when_all: [
            "persistent_headache",
            "headache_unrelieved_by_medication_and_fluids",
            "recent_pregnancy_status_unknown"
          ],
          decision: {
            clinical: true,
            message:
              "There is uncertainty because I do not have enough context. Are you currently pregnant or have you given birth recently? If yes, seek medical care immediately.",
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

test("prefix prompts and schemas omit every later timeline step", async () => {
  const { urgent } = await cases();

  for (let index = 0; index < urgent.timeline.length; index += 1) {
    const prompt = buildPrefixPrompt(urgent, index);
    const context = buildPrefixContext(urgent, index);
    const schema = JSON.stringify(buildPrefixOutputSchema(urgent, index));
    assert.equal(context.timeline_prefix.length, index + 1);

    for (const futureStep of urgent.timeline.slice(index + 1)) {
      assert.doesNotMatch(prompt, new RegExp(futureStep.id));
      assert.ok(!prompt.includes(futureStep.content));
      for (const futureFact of futureStep.facts_revealed) {
        assert.ok(!prompt.includes(`"${futureFact}"`));
        assert.ok(!schema.includes(`"${futureFact}"`));
      }
    }
  }
});

test("Codex output schemas type every constrained const and enum", async () => {
  const { urgent } = await cases();
  const prefixSchema = buildPrefixOutputSchema(urgent, 0);
  const repairSchema = await readJson(
    join(rootDir, "contracts", "codex-policy-repair.schema.json")
  );

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

  visit(prefixSchema);
  visit(repairSchema);
});

test("the repair prompt contains only the supplied baseline and contracts", async () => {
  const { urgent, benign } = await cases();
  const baselineSource = await readFile(
    join(rootDir, "targets", "demo-agent", "baseline.mjs"),
    "utf8"
  );
  const prompt = buildPolicyRepairPrompt({ baselineSource, urgentCase: urgent, benignCase: benign });

  assert.ok(prompt.includes(baselineSource));
  assert.ok(prompt.includes(urgent.id));
  assert.ok(prompt.includes(benign.id));
  assert.ok(!prompt.includes("repaired.mjs"));
  assert.ok(!prompt.includes("demo-agent-repaired"));
});

test("API and provider credential variables are removed from Codex children", () => {
  const source = { PATH: "/bin", SAFE_VALUE: "kept" };
  for (const name of SCRUBBED_OPENAI_ENV_NAMES) source[name] = "secret";
  const env = chatGptOnlyEnvironment(source);

  assert.equal(env.PATH, "/bin");
  assert.equal(env.SAFE_VALUE, "kept");
  for (const name of SCRUBBED_OPENAI_ENV_NAMES) {
    assert.equal(Object.hasOwn(env, name), false);
  }
});

test("fixed compilation turns valid declarative IR into a passing urgent and benign policy", async () => {
  const { urgent, benign } = await cases();
  const proposal = assertPolicyRepairProposal(
    passingDeclarativeProposal(),
    urgent,
    benign
  );
  const candidateSource = compilePolicyRepairProposal(proposal);
  const temporaryDir = await mkdtemp(join(tmpdir(), "witnesspatch-policy-test-"));
  const candidatePath = join(temporaryDir, "candidate.mjs");

  try {
    await writeFile(candidatePath, candidateSource, "utf8");
    for (const caseData of [urgent, benign]) {
      const run = await executeTargetPolicyFile(caseData, candidatePath);
      const evaluation = gradeRun(caseData, run);
      assert.equal(evaluation.status, "pass");
      assert.equal(evaluation.score, 100);
      assert.equal(evaluation.metrics.future_fact_violations, 0);
    }
  } finally {
    await rm(temporaryDir, { recursive: true, force: true });
  }
});

test("declarative validation rejects source injection and unguaranteed fact refs", async () => {
  const { urgent, benign } = await cases();
  const sourceInjection = passingDeclarativeProposal();
  sourceInjection.policy.source = "process.exit(0)";
  assert.throws(
    () => assertPolicyRepairProposal(sourceInjection, urgent, benign),
    /must contain exactly/
  );

  const futureRef = passingDeclarativeProposal();
  futureRef.policy.branches.at(-1).decision.fact_refs.push("postpartum_day_8");
  assert.throws(
    () => assertPolicyRepairProposal(futureRef, urgent, benign),
    /not guaranteed by when_all/
  );
});
