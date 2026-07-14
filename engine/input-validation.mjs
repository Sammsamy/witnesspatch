import { assertCaseSchema } from "./schema-validator.mjs";

const isObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

function requireValue(condition, message) {
  if (!condition) throw new Error(message);
}

const unique = (values) => [...new Set(values)];
const ALLOWED_METRIC_TAGS = new Set(["safe_action_trigger"]);
const REQUIRED_CONTROL_KINDS = Object.freeze([
  "temporal_integrity",
  "source_linkage",
  "message_action_consistency"
]);
const LOWER_SNAKE_CASE = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/;
const RUN_VARIANTS = new Set(["baseline", "repaired", "candidate"]);
const PROVENANCE_VERIFICATIONS = new Set([
  "unverified_input_declaration",
  "hash_listed_by_external_manifest"
]);
const ALLOWED_RUN_PROVENANCE_KEYS = new Set([
  "generated_at",
  "generation_mode",
  "model_invocation_logged",
  "contains_real_patient_data",
  "clinician_validation",
  "api_key_required",
  "model_config_requested",
  "reasoning_effort_requested",
  "honesty_note",
  "target_policy_id",
  "target_policy_version",
  "codex_cli_version",
  "auth_status",
  "raw_completion_sha256",
  "step_completion_sha256",
  "timeline_prefix_invocations",
  "future_steps_present_in_prompts",
  "isolated_working_directory",
  "model_tools_disabled"
]);
const RFC3339_DATE_TIME =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/u;
const REPAIR_REVIEW_STATUS =
  "This case passes deterministic evaluation; declared regression assertions and physician validation remain pending.";

export const MAX_TIMELINE_INTEGER = Number.MAX_SAFE_INTEGER;
// These shared semantic limits bound lexical scans before either the Node or
// browser grader runs while leaving ample headroom above retained fixtures.
export const MAX_TOTAL_DECISION_MESSAGE_CHARACTERS = 256 * 1024;
export const MAX_TOTAL_LEXICAL_MARKERS = 2_048;
export const MAX_TOTAL_LEXICAL_MARKER_CHARACTERS = 256 * 1024;
export const MAX_MESSAGE_MARKER_COMPARISON_PRODUCT = 16 * 1024 * 1024;

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (isObject(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function normalizeLexicalText(value) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("en-US")
    .replace(/\s*\/\s*/g, "/")
    .replace(/\s+/g, " ")
    .trim();
}

function assertMarkerList(markers, label) {
  requireValue(Array.isArray(markers) && markers.length > 0, `${label} needs markers.`);
  requireValue(
    markers.every((marker) => typeof marker === "string" && marker.trim().length >= 5),
    `${label} markers must be strings of at least five characters.`
  );
  requireValue(
    unique(markers.map(normalizeLexicalText)).length === markers.length,
    `${label} markers must be unique after lexical normalization.`
  );
}

function assertExactKeys(value, expectedKeys, label) {
  requireValue(isObject(value), `${label} must be an object.`);
  requireValue(
    stableStringify(Object.keys(value).sort()) ===
      stableStringify([...expectedKeys].sort()),
    `${label} must contain exactly: ${[...expectedKeys].sort().join(", ")}.`
  );
}

function assertNonEmptyString(value, label) {
  requireValue(
    typeof value === "string" && value.trim().length > 0,
    `${label} must be a non-empty string.`
  );
}

function lexicalMarkers(caseData) {
  return caseData.controls.flatMap((control) => [
    ...(control.future_fact_markers ?? []).flatMap(
      (contract) => contract.markers
    ),
    ...(control.global_forbidden_markers ?? []),
    ...(control.action_contracts ?? []).flatMap(
      (contract) => contract.required_any_markers
    )
  ]);
}

function assertLexicalWorkBudget(caseData) {
  const markers = lexicalMarkers(caseData);
  requireValue(
    markers.length <= MAX_TOTAL_LEXICAL_MARKERS,
    `Cases may declare at most ${MAX_TOTAL_LEXICAL_MARKERS} lexical markers, got ${markers.length}.`
  );
  const characters = markers.reduce(
    (total, marker) => total + marker.length,
    0
  );
  requireValue(
    characters <= MAX_TOTAL_LEXICAL_MARKER_CHARACTERS,
    `Case lexical markers may contain at most ${MAX_TOTAL_LEXICAL_MARKER_CHARACTERS} total characters, got ${characters}.`
  );
  return { count: markers.length, characters };
}

function ruleTriggerMinute(caseData, rule) {
  const available = new Set();
  for (const step of caseData.timeline) {
    for (const fact of step.facts_revealed) available.add(fact);
    if (rule.when_all_facts.every((fact) => available.has(fact))) {
      return step.at_minute;
    }
  }
  throw new Error(`${rule.id} can never trigger from the case timeline.`);
}

export function assertCaseInput(caseData) {
  requireValue(isObject(caseData), "Case must be a JSON object.");
  requireValue(caseData.schema_version === "1.0.0", "Unsupported case schema version.");
  requireValue(
    caseData.status === "synthetic_source_linked_physician_validation_pending",
    "Case status must disclose that physician validation is pending."
  );
  requireValue(
    caseData.provenance?.contains_real_patient_data === false,
    "Cases must explicitly declare that they contain no real patient data."
  );
  requireValue(
    caseData.provenance?.clinician_validation === "pending",
    "Reference case must not claim clinician validation before review."
  );
  assertCaseSchema(caseData);
  requireValue(Array.isArray(caseData.timeline) && caseData.timeline.length > 0, "Timeline is required.");
  requireValue(Array.isArray(caseData.evidence) && caseData.evidence.length > 0, "Evidence is required.");
  requireValue(Array.isArray(caseData.rules) && caseData.rules.length > 0, "Rules are required.");
  requireValue(Array.isArray(caseData.controls) && caseData.controls.length > 0, "Controls are required.");
  requireValue(
    Array.isArray(caseData.action_vocabulary) && caseData.action_vocabulary.length > 0,
    "Action vocabulary is required."
  );
  assertLexicalWorkBudget(caseData);

  const stepIds = caseData.timeline.map((step) => step.id);
  const evidenceIds = caseData.evidence.map((item) => item.id);
  const ruleIds = caseData.rules.map((rule) => rule.id);
  const controlIds = caseData.controls.map((control) => control.id);
  const actions = new Set(caseData.action_vocabulary);
  const evidence = new Set(evidenceIds);
  requireValue(unique(stepIds).length === stepIds.length, "Timeline step ids must be unique.");
  requireValue(unique(evidenceIds).length === evidenceIds.length, "Evidence ids must be unique.");
  requireValue(unique(ruleIds).length === ruleIds.length, "Rule ids must be unique.");
  requireValue(unique(controlIds).length === controlIds.length, "Control ids must be unique.");
  requireValue(
    unique(caseData.action_vocabulary).length === caseData.action_vocabulary.length,
    "Action vocabulary entries must be unique."
  );

  let previousMinute = -1;
  const introducedFacts = new Set();
  for (const step of caseData.timeline) {
    requireValue(
      typeof step.actor === "string" && LOWER_SNAKE_CASE.test(step.actor),
      `Step ${step.id} actor must be lower_snake_case.`
    );
    requireValue(
      typeof step.channel === "string" && LOWER_SNAKE_CASE.test(step.channel),
      `Step ${step.id} channel must be lower_snake_case.`
    );
    requireValue(
      Number.isSafeInteger(step.at_minute) &&
        step.at_minute >= 0 &&
        step.at_minute <= MAX_TIMELINE_INTEGER,
      `Step ${step.id} needs a nonnegative safe-integer at_minute.`
    );
    requireValue(step.at_minute > previousMinute, "Timeline minutes must be strictly increasing.");
    previousMinute = step.at_minute;
    requireValue(
      Array.isArray(step.facts_revealed) && step.facts_revealed.length > 0,
      `Step ${step.id} must reveal at least one fact.`
    );
    for (const fact of step.facts_revealed) {
      requireValue(!introducedFacts.has(fact), `Fact ${fact} is introduced more than once.`);
      introducedFacts.add(fact);
    }
  }

  for (const rule of caseData.rules) {
    requireValue(
      Number.isSafeInteger(rule.max_delay_minutes) &&
        rule.max_delay_minutes >= 0 &&
        rule.max_delay_minutes <= MAX_TIMELINE_INTEGER,
      `${rule.id} max_delay_minutes must be a nonnegative safe integer.`
    );
    const metricTags = rule.metric_tags ?? [];
    requireValue(Array.isArray(metricTags), `${rule.id} metric_tags must be an array.`);
    requireValue(unique(metricTags).length === metricTags.length, `${rule.id} metric_tags must be unique.`);
    for (const tag of metricTags) {
      requireValue(ALLOWED_METRIC_TAGS.has(tag), `${rule.id} uses unsupported metric tag ${tag}.`);
    }
    for (const fact of rule.when_all_facts) {
      requireValue(introducedFacts.has(fact), `${rule.id} references unknown fact ${fact}.`);
    }
    for (const action of [...rule.required_actions, ...rule.forbidden_actions]) {
      requireValue(actions.has(action), `${rule.id} references unknown action ${action}.`);
    }
    for (const source of rule.source_refs) {
      requireValue(evidence.has(source), `${rule.id} references unknown evidence ${source}.`);
    }
    const triggeredAt = ruleTriggerMinute(caseData, rule);
    requireValue(
      triggeredAt <= MAX_TIMELINE_INTEGER - rule.max_delay_minutes,
      `${rule.id} deadline exceeds the maximum safe integer.`
    );
  }

  const latencyConfig = caseData.metrics?.safe_action_latency;
  const taggedLatencyRules = caseData.rules.filter((rule) =>
    (rule.metric_tags ?? []).includes("safe_action_trigger")
  );
  if (latencyConfig) {
    requireValue(isObject(caseData.metrics) && isObject(latencyConfig), "safe_action_latency must be an object.");
    requireValue(
      latencyConfig.trigger_rule_tag === "safe_action_trigger",
      "safe_action_latency must use the supported safe_action_trigger rule tag."
    );
    requireValue(actions.has(latencyConfig.action), `safe_action_latency references unknown action ${latencyConfig.action}.`);
    requireValue(taggedLatencyRules.length > 0, "safe_action_latency requires at least one tagged trigger rule.");
    for (const rule of taggedLatencyRules) {
      requireValue(
        rule.required_actions.includes(latencyConfig.action),
        `${rule.id} must require the configured safe-action latency action.`
      );
    }
  } else {
    requireValue(taggedLatencyRules.length === 0, "safe_action_trigger tags require a safe_action_latency configuration.");
  }

  const controlKinds = caseData.controls.map((control) => control.kind);
  requireValue(unique(controlKinds).length === controlKinds.length, "Control kinds must be unique.");
  requireValue(
    controlKinds.length === REQUIRED_CONTROL_KINDS.length &&
      REQUIRED_CONTROL_KINDS.every((kind) => controlKinds.includes(kind)),
    `Cases must define exactly one of each required control kind: ${REQUIRED_CONTROL_KINDS.join(", ")}.`
  );
  for (const control of caseData.controls) {
    if (control.kind === "temporal_integrity") {
      requireValue(
        Array.isArray(control.future_fact_markers) && control.future_fact_markers.length > 0,
        `${control.id} needs case-locked future_fact_markers.`
      );
      const normalizedMarkers = [];
      const markedFacts = new Set();
      for (const contract of control.future_fact_markers) {
        requireValue(
          isObject(contract) && introducedFacts.has(contract.fact_id),
          `${control.id} references unknown marked fact ${contract?.fact_id}.`
        );
        requireValue(!markedFacts.has(contract.fact_id), `${control.id} repeats marked fact ${contract.fact_id}.`);
        markedFacts.add(contract.fact_id);
        assertMarkerList(contract.markers, `${control.id} marker contract for ${contract.fact_id}`);
        normalizedMarkers.push(...contract.markers.map(normalizeLexicalText));
      }
      requireValue(
        unique(normalizedMarkers).length === normalizedMarkers.length,
        `${control.id} future-fact markers must be globally unique.`
      );
    }
    if (control.kind === "message_action_consistency") {
      assertMarkerList(control.global_forbidden_markers, `${control.id} global forbidden marker list`);
      requireValue(
        Array.isArray(control.action_contracts) && control.action_contracts.length > 0,
        `${control.id} needs action_contracts.`
      );
      const contractedActions = new Set();
      for (const contract of control.action_contracts) {
        requireValue(
          isObject(contract) && actions.has(contract.action),
          `${control.id} references unknown contracted action ${contract?.action}.`
        );
        requireValue(!contractedActions.has(contract.action), `${control.id} repeats contracted action ${contract.action}.`);
        contractedActions.add(contract.action);
        assertMarkerList(contract.required_any_markers, `${control.id} marker contract for ${contract.action}`);
      }
      requireValue(
        contractedActions.size === actions.size &&
          caseData.action_vocabulary.every((action) => contractedActions.has(action)),
        `${control.id} must define a lexical contract for every action vocabulary entry.`
      );
    }
  }
  const totalWeight = [...caseData.rules, ...caseData.controls].reduce(
    (total, item) => total + item.weight,
    0
  );
  requireValue(totalWeight === 100, `Rule and control weights must total 100, got ${totalWeight}.`);
  requireValue(
    Number.isInteger(caseData.pass_threshold) && caseData.pass_threshold >= 1 && caseData.pass_threshold <= 100,
    "Pass threshold must be an integer from 1 to 100."
  );
  return caseData;
}

export function assertCandidateInput(caseData, candidate) {
  requireValue(isObject(candidate), "Candidate must be a JSON object.");
  requireValue(Array.isArray(candidate.decisions) && candidate.decisions.length > 0, "Candidate must contain decisions.");
  requireValue(
    candidate.decisions.length === caseData.timeline.length,
    `Candidate must contain exactly one decision for each of the ${caseData.timeline.length} timeline steps.`
  );
  const stepById = new Map(caseData.timeline.map((step) => [step.id, step]));
  const actions = new Set(caseData.action_vocabulary);
  const seenSteps = new Set();
  let totalMessageCharacters = 0;
  for (const [index, decision] of candidate.decisions.entries()) {
    const expectedStep = caseData.timeline[index];
    requireValue(
      decision.step_id === expectedStep.id,
      `Decision ${index + 1} must correspond to ${expectedStep.id}; decisions must follow timeline order.`
    );
    const step = stepById.get(decision.step_id);
    requireValue(step, `Decision references unknown step ${decision.step_id}.`);
    requireValue(!seenSteps.has(decision.step_id), `Duplicate decision for ${decision.step_id}.`);
    seenSteps.add(decision.step_id);
    requireValue(
      Number.isSafeInteger(decision.at_minute) && decision.at_minute >= 0,
      `Decision ${decision.step_id} needs a nonnegative safe-integer at_minute.`
    );
    requireValue(decision.at_minute === step.at_minute, `Decision ${decision.step_id} must use the step's time lock (${step.at_minute}).`);
    requireValue(decision.clinical === true, `${decision.step_id} must set clinical to true; healthcare decisions cannot self-exempt from source linkage.`);
    requireValue(typeof decision.message === "string" && decision.message.length > 0, `${decision.step_id} needs a message.`);
    totalMessageCharacters += decision.message.length;
    requireValue(
      totalMessageCharacters <= MAX_TOTAL_DECISION_MESSAGE_CHARACTERS,
      `Run decision messages may contain at most ${MAX_TOTAL_DECISION_MESSAGE_CHARACTERS} total characters.`
    );
    requireValue(Array.isArray(decision.actions) && decision.actions.length > 0, `${decision.step_id} needs actions.`);
    requireValue(Array.isArray(decision.fact_refs), `${decision.step_id} needs fact_refs.`);
    requireValue(Array.isArray(decision.evidence_refs), `${decision.step_id} needs evidence_refs.`);
    requireValue(unique(decision.actions).length === decision.actions.length, `${decision.step_id} has duplicate actions.`);
    requireValue(unique(decision.fact_refs).length === decision.fact_refs.length, `${decision.step_id} has duplicate fact_refs.`);
    requireValue(unique(decision.evidence_refs).length === decision.evidence_refs.length, `${decision.step_id} has duplicate evidence_refs.`);
    for (const action of decision.actions) {
      requireValue(actions.has(action), `${decision.step_id} uses unknown action ${action}.`);
    }
  }
  const lexicalWork = assertLexicalWorkBudget(caseData);
  requireValue(
    lexicalWork.count === 0 ||
      totalMessageCharacters <=
        Math.floor(
          MAX_MESSAGE_MARKER_COMPARISON_PRODUCT / lexicalWork.count
        ),
    `Run exceeds the ${MAX_MESSAGE_MARKER_COMPARISON_PRODUCT} character-marker lexical comparison budget.`
  );
  return candidate;
}

function assertRepairMetadata(runInput) {
  const hasRepair = runInput.repair !== undefined;
  requireValue((runInput.variant === "repaired") === hasRepair, "Only repaired runs may declare repair metadata, and every repaired run must declare it.");
  if (!hasRepair) return;
  const repair = runInput.repair;
  assertExactKeys(
    repair,
    ["parent_run_id", "failure_summary", "policy_diff", "regression_assertions", "review_status"],
    "Repair metadata"
  );
  assertNonEmptyString(repair.parent_run_id, "Repair parent_run_id");
  requireValue(repair.parent_run_id !== runInput.run_id, "Repair parent_run_id must differ from the repaired run_id.");
  assertNonEmptyString(repair.failure_summary, "Repair failure_summary");
  assertExactKeys(repair.policy_diff, ["before", "after"], "Repair policy_diff");
  assertNonEmptyString(repair.policy_diff.before, "Repair policy_diff.before");
  assertNonEmptyString(repair.policy_diff.after, "Repair policy_diff.after");
  requireValue(
    normalizeLexicalText(repair.policy_diff.before) !== normalizeLexicalText(repair.policy_diff.after),
    "Repair policy_diff.before and policy_diff.after must differ after lexical normalization."
  );
  requireValue(
    Array.isArray(repair.regression_assertions) &&
      repair.regression_assertions.length > 0 &&
      repair.regression_assertions.every((assertion) => typeof assertion === "string" && assertion.trim().length > 0) &&
      unique(repair.regression_assertions).length === repair.regression_assertions.length,
    "Repair regression_assertions must be a non-empty array of unique strings."
  );
  requireValue(
    repair.review_status === REPAIR_REVIEW_STATUS,
    `Repair review_status must be exactly: ${REPAIR_REVIEW_STATUS}`
  );
}

export function assertRunInputAgainstFingerprint(
  caseData,
  runInput,
  expectedCaseFingerprint
) {
  assertCaseInput(caseData);
  assertCandidateInput(caseData, runInput);
  requireValue(typeof runInput.run_id === "string" && runInput.run_id.trim().length > 0, "Run input needs a non-empty run_id.");
  requireValue(RUN_VARIANTS.has(runInput.variant), "Run input variant must be baseline, repaired, or candidate.");
  requireValue(isObject(runInput.provenance), "Run input provenance is required.");
  const unknownProvenanceKeys = Object.keys(runInput.provenance)
    .filter((key) => !ALLOWED_RUN_PROVENANCE_KEYS.has(key))
    .sort();
  requireValue(unknownProvenanceKeys.length === 0, `Run provenance contains unknown keys: ${unknownProvenanceKeys.join(", ")}.`);
  requireValue(
    typeof runInput.provenance.generated_at === "string" &&
      RFC3339_DATE_TIME.test(runInput.provenance.generated_at) &&
      Number.isFinite(Date.parse(runInput.provenance.generated_at)),
    "Run provenance generated_at must be a valid RFC 3339 date-time."
  );
  requireValue(
    typeof runInput.provenance.generation_mode === "string" && runInput.provenance.generation_mode.trim().length > 0,
    "Run provenance needs generation_mode."
  );
  requireValue(typeof runInput.provenance.model_invocation_logged === "boolean", "Run provenance needs model_invocation_logged boolean.");
  requireValue(runInput.provenance.contains_real_patient_data === false, "Run inputs must explicitly declare that they contain no real patient data.");
  requireValue(runInput.provenance.clinician_validation === "pending", "Run inputs must keep clinician_validation pending.");
  requireValue(typeof runInput.provenance.api_key_required === "boolean", "Run provenance needs api_key_required boolean.");
  assertRepairMetadata(runInput);

  if (runInput.schema_version !== undefined) {
    requireValue(runInput.schema_version === "1.0.0", "Unsupported evaluated artifact schema version.");
  }
  const hasCaseId = runInput.case_id !== undefined;
  const hasCaseHash = runInput.case_sha256 !== undefined;
  requireValue(hasCaseId === hasCaseHash, "Embedded artifact identity must include both case_id and case_sha256.");
  const hasEvaluation = runInput.evaluation !== undefined;
  const hasAuditLog = runInput.audit_log !== undefined;
  const hasProvenanceVerification = runInput.provenance_verification !== undefined;
  if (hasProvenanceVerification) {
    requireValue(PROVENANCE_VERIFICATIONS.has(runInput.provenance_verification), "Artifact provenance_verification is not recognized.");
  }
  if (hasEvaluation || hasAuditLog || hasProvenanceVerification) {
    requireValue(
      runInput.schema_version !== undefined &&
        hasCaseId &&
        hasCaseHash &&
        hasProvenanceVerification &&
        hasEvaluation &&
        hasAuditLog,
      "Artifact-shaped inputs must include schema_version, case_id, case_sha256, provenance_verification, evaluation, and audit_log."
    );
  }
  if (runInput.case_id !== undefined) {
    requireValue(runInput.case_id === caseData.id, `Embedded case_id ${runInput.case_id} does not match supplied case ${caseData.id}.`);
  }
  if (runInput.case_sha256 !== undefined) {
    const resolvedCaseFingerprint =
      typeof expectedCaseFingerprint === "function"
        ? expectedCaseFingerprint()
        : expectedCaseFingerprint;
    requireValue(runInput.case_sha256 === resolvedCaseFingerprint, "Embedded case_sha256 does not match the supplied case.");
  }
  return runInput;
}
