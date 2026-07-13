import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { assertCase } from "./core.mjs";

const requireValue = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const frozenCopy = (values) => Object.freeze([...values]);

function assertPolicy(policy, source = "target policy") {
  requireValue(
    policy !== null && typeof policy === "object",
    `${source} must export a policy object.`
  );
  requireValue(
    typeof policy.id === "string" && policy.id.length > 0,
    `${source} needs a non-empty id.`
  );
  requireValue(
    typeof policy.decide === "function",
    `${source} needs a decide(context) function.`
  );
  return policy;
}

function assertPolicyDecision(policy, step, output) {
  requireValue(
    output !== null && typeof output === "object" && !Array.isArray(output),
    `${policy.id} returned no decision for ${step.id}.`
  );
  requireValue(
    typeof output.message === "string" && output.message.length > 0,
    `${policy.id} returned an empty message for ${step.id}.`
  );

  for (const field of ["actions", "fact_refs", "evidence_refs"]) {
    requireValue(
      Array.isArray(output[field]),
      `${policy.id} must return ${field} as an array for ${step.id}.`
    );
  }

  requireValue(
    output.actions.length > 0,
    `${policy.id} returned no actions for ${step.id}.`
  );
  return output;
}

export async function loadTargetPolicy(policyPath) {
  const policyUrl =
    policyPath instanceof URL
      ? policyPath
      : pathToFileURL(resolve(String(policyPath)));
  const policyModule = await import(policyUrl.href);
  return assertPolicy(
    policyModule.default ?? policyModule.policy,
    policyUrl.pathname
  );
}

export function executeTargetPolicy(caseData, policy, options = {}) {
  assertCase(caseData);
  assertPolicy(policy);

  const actionVocabulary = new Set(caseData.action_vocabulary);
  const evidenceIds = new Set(caseData.evidence.map((item) => item.id));
  const knownFacts = [];
  const knownFactSet = new Set();

  const decisions = caseData.timeline.map((step) => {
    for (const fact of step.facts_revealed) {
      knownFacts.push(fact);
      knownFactSet.add(fact);
    }

    const context = Object.freeze({
      stepId: step.id,
      atMinute: step.at_minute,
      actor: step.actor,
      channel: step.channel,
      content: step.content,
      newFacts: frozenCopy(step.facts_revealed),
      knownFacts: frozenCopy(knownFacts),
      actionVocabulary: frozenCopy(caseData.action_vocabulary),
      evidenceIds: frozenCopy(caseData.evidence.map((item) => item.id))
    });
    const output = assertPolicyDecision(policy, step, policy.decide(context));

    for (const action of output.actions) {
      requireValue(
        actionVocabulary.has(action),
        `${policy.id} returned action ${action}, which is not allowed by ${caseData.id}.`
      );
    }
    for (const factRef of output.fact_refs) {
      requireValue(
        knownFactSet.has(factRef),
        `${policy.id} referenced unavailable fact ${factRef} at ${step.id}.`
      );
    }
    for (const evidenceRef of output.evidence_refs) {
      requireValue(
        evidenceIds.has(evidenceRef),
        `${policy.id} referenced unknown evidence ${evidenceRef} at ${step.id}.`
      );
    }

    return {
      step_id: step.id,
      at_minute: step.at_minute,
      clinical: output.clinical ?? true,
      message: output.message,
      actions: [...output.actions],
      fact_refs: [...output.fact_refs],
      evidence_refs: [...output.evidence_refs]
    };
  });

  return {
    run_id: options.runId ?? `target-${policy.id}-${caseData.id}`,
    variant: options.variant ?? "candidate",
    provenance: {
      generated_at: options.generatedAt ?? "2026-07-13T12:00:00.000Z",
      generation_mode: "deterministic_executable_demo_target",
      target_policy_id: policy.id,
      target_policy_version: policy.version ?? "unversioned",
      model_invocation_logged: false,
      honesty_note:
        "This artifact was produced by executing a local deterministic demo policy against a fully synthetic fixture. It is not a live model completion or a clinical verdict.",
      contains_real_patient_data: false,
      clinician_validation: "pending",
      api_key_required: false
    },
    decisions
  };
}

export async function executeTargetPolicyFile(
  caseData,
  policyPath,
  options = {}
) {
  const policy = await loadTargetPolicy(policyPath);
  return executeTargetPolicy(caseData, policy, options);
}
