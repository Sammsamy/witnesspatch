const OBSERVATION_LABEL =
  "One observed authored-fixture-to-validated-candidate wall-clock run";

export const WORKFLOW_OPERATIONAL_EVIDENCE_NOT_MEASURED = Object.freeze([
  "authentication_duration",
  "cache_warmth_or_cache_effects",
  "model_only_latency",
  "network_latency",
  "cold_start_latency",
  "warm_start_latency",
  "repeat_run_distribution",
  "post_capture_holdout_execution_duration",
  "throughput",
  "cost",
  "production_performance",
  "clinical_safety_or_effectiveness"
]);

export const WORKFLOW_OPERATIONAL_EVIDENCE_CLAIM_BOUNDARY =
  "This artifact reports one observed system-wall-clock interval for one authored-fixture-to-validated-candidate run. It is not a benchmark, speed threshold, latency SLA, throughput or cost measurement, production-performance guarantee, or clinical-safety evidence.";

const isRecord = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

function requireValue(condition, message) {
  if (!condition) throw new Error(message);
}

function assertExactKeys(value, expectedKeys, label) {
  requireValue(isRecord(value), `${label} must be an object.`);
  const actualKeys = Object.keys(value).sort();
  const sortedExpected = [...expectedKeys].sort();
  requireValue(
    actualKeys.length === sortedExpected.length &&
      actualKeys.every((key, index) => key === sortedExpected[index]),
    `${label} must contain exactly: ${sortedExpected.join(", ")}.`
  );
}

function timestampToMilliseconds(value, label) {
  requireValue(
    typeof value === "string" &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value),
    `${label} must be a canonical UTC timestamp with millisecond precision.`
  );
  const milliseconds = Date.parse(value);
  requireValue(
    Number.isFinite(milliseconds) && new Date(milliseconds).toISOString() === value,
    `${label} is not a valid timestamp.`
  );
  return milliseconds;
}

function assertPassingCandidateOutcome(value, label) {
  assertExactKeys(
    value,
    ["status", "score", "critical_failures", "future_fact_violations"],
    label
  );
  requireValue(value.status === "pass", `${label} status must be pass.`);
  requireValue(value.score === 100, `${label} score must be 100.`);
  requireValue(
    Array.isArray(value.critical_failures) && value.critical_failures.length === 0,
    `${label} must have zero critical failures.`
  );
  requireValue(
    value.future_fact_violations === 0,
    `${label} must have zero future-fact violations.`
  );
  return value;
}

function copyPassingCandidateOutcome(value, label) {
  assertPassingCandidateOutcome(value, label);
  return {
    status: value.status,
    score: value.score,
    critical_failures: [...value.critical_failures],
    future_fact_violations: value.future_fact_violations
  };
}

function assertPassingHoldoutSummary(passed, total) {
  requireValue(
    Number.isInteger(passed) && passed >= 0,
    "Holdouts passed must be a nonnegative integer."
  );
  requireValue(
    Number.isInteger(total) && total > 0,
    "Holdouts total must be a positive integer."
  );
  requireValue(passed === total, "Every supplied holdout must pass.");
}

function assertReceiptBasis(receipt) {
  requireValue(isRecord(receipt), "Repair receipt must be an object.");
  requireValue(
    receipt.schema_version === "1.0.0",
    "Repair receipt schema version must be 1.0.0."
  );
  requireValue(
    receipt.status === "validated_candidate",
    "Repair receipt must describe a validated candidate."
  );
  requireValue(isRecord(receipt.generation), "Repair receipt generation is required.");
  requireValue(
    receipt.generation.mode === "local_codex_cli_chatgpt_subscription",
    "Repair receipt must come from the local ChatGPT-subscription workflow."
  );
  requireValue(
    receipt.generation.auth_status === "Logged in using ChatGPT",
    "Repair receipt must confirm the preexisting ChatGPT session."
  );
  requireValue(
    receipt.generation.api_key_required === false,
    "Repair receipt must confirm that no API key was required."
  );
  requireValue(
    isRecord(receipt.deterministic_validation),
    "Repair receipt deterministic validation is required."
  );

  const startedAtMs = timestampToMilliseconds(
    receipt.started_at,
    "Repair receipt started_at"
  );
  const validatedCandidateAtMs = timestampToMilliseconds(
    receipt.generated_at,
    "Repair receipt generated_at"
  );
  requireValue(
    validatedCandidateAtMs >= startedAtMs,
    "Repair receipt generated_at must not precede started_at."
  );

  const urgent = copyPassingCandidateOutcome(
    receipt.deterministic_validation.candidate_urgent,
    "Repair receipt urgent candidate"
  );
  const benign = copyPassingCandidateOutcome(
    receipt.deterministic_validation.candidate_benign,
    "Repair receipt benign candidate"
  );

  return {
    startedAtMs,
    validatedCandidateAtMs,
    urgent,
    benign
  };
}

export function buildWorkflowOperationalEvidence({
  repairReceipt,
  holdoutsPassed,
  holdoutsTotal
}) {
  const basis = assertReceiptBasis(repairReceipt);
  assertPassingHoldoutSummary(holdoutsPassed, holdoutsTotal);

  return assertWorkflowOperationalEvidence({
    schema_version: "1.0.0",
    evidence_kind: "bounded_operational_observation",
    observation: {
      label: OBSERVATION_LABEL,
      sample_size: 1,
      started_at: repairReceipt.started_at,
      validated_candidate_at: repairReceipt.generated_at,
      observed_wall_clock_ms:
        basis.validatedCandidateAtMs - basis.startedAtMs,
      clock: {
        source: "system_wall_clock",
        monotonic: false,
        derivation: "validated_candidate_at minus started_at"
      },
      authentication: {
        state_at_start: "preexisting_chatgpt_session",
        included_in_observed_interval: false
      },
      cache_state: "unknown"
    },
    candidate_outcomes: {
      urgent: basis.urgent,
      benign: basis.benign
    },
    holdouts: {
      passed: holdoutsPassed,
      total: holdoutsTotal,
      all_passed: true,
      included_in_observed_interval: false
    },
    not_measured: [...WORKFLOW_OPERATIONAL_EVIDENCE_NOT_MEASURED],
    claim_boundary: WORKFLOW_OPERATIONAL_EVIDENCE_CLAIM_BOUNDARY
  });
}

export function assertWorkflowOperationalEvidence(evidence) {
  assertExactKeys(
    evidence,
    [
      "schema_version",
      "evidence_kind",
      "observation",
      "candidate_outcomes",
      "holdouts",
      "not_measured",
      "claim_boundary"
    ],
    "Workflow operational evidence"
  );
  requireValue(
    evidence.schema_version === "1.0.0",
    "Workflow operational evidence schema version must be 1.0.0."
  );
  requireValue(
    evidence.evidence_kind === "bounded_operational_observation",
    "Workflow operational evidence kind is invalid."
  );

  assertExactKeys(
    evidence.observation,
    [
      "label",
      "sample_size",
      "started_at",
      "validated_candidate_at",
      "observed_wall_clock_ms",
      "clock",
      "authentication",
      "cache_state"
    ],
    "Workflow observation"
  );
  requireValue(
    evidence.observation.label === OBSERVATION_LABEL,
    "Workflow observation label is invalid."
  );
  requireValue(
    evidence.observation.sample_size === 1,
    "Workflow observation sample size must be one."
  );
  const startedAtMs = timestampToMilliseconds(
    evidence.observation.started_at,
    "Workflow observation started_at"
  );
  const validatedCandidateAtMs = timestampToMilliseconds(
    evidence.observation.validated_candidate_at,
    "Workflow observation validated_candidate_at"
  );
  requireValue(
    validatedCandidateAtMs >= startedAtMs,
    "Workflow observation validated_candidate_at must not precede started_at."
  );
  requireValue(
    Number.isSafeInteger(evidence.observation.observed_wall_clock_ms) &&
      evidence.observation.observed_wall_clock_ms ===
        validatedCandidateAtMs - startedAtMs,
    "Workflow observation wall-clock duration must equal its timestamp difference."
  );

  assertExactKeys(
    evidence.observation.clock,
    ["source", "monotonic", "derivation"],
    "Workflow observation clock"
  );
  requireValue(
    evidence.observation.clock.source === "system_wall_clock",
    "Workflow observation must identify the system wall clock."
  );
  requireValue(
    evidence.observation.clock.monotonic === false,
    "System wall-clock timestamps must not be labeled monotonic."
  );
  requireValue(
    evidence.observation.clock.derivation ===
      "validated_candidate_at minus started_at",
    "Workflow observation clock derivation is invalid."
  );

  assertExactKeys(
    evidence.observation.authentication,
    ["state_at_start", "included_in_observed_interval"],
    "Workflow observation authentication"
  );
  requireValue(
    evidence.observation.authentication.state_at_start ===
      "preexisting_chatgpt_session",
    "Workflow observation authentication must be labeled preexisting."
  );
  requireValue(
    evidence.observation.authentication.included_in_observed_interval === false,
    "Authentication duration must be outside the observed interval."
  );
  requireValue(
    evidence.observation.cache_state === "unknown",
    "Workflow observation cache state must remain unknown."
  );

  assertExactKeys(
    evidence.candidate_outcomes,
    ["urgent", "benign"],
    "Workflow candidate outcomes"
  );
  assertPassingCandidateOutcome(
    evidence.candidate_outcomes.urgent,
    "Workflow urgent candidate"
  );
  assertPassingCandidateOutcome(
    evidence.candidate_outcomes.benign,
    "Workflow benign candidate"
  );

  assertExactKeys(
    evidence.holdouts,
    ["passed", "total", "all_passed", "included_in_observed_interval"],
    "Workflow holdouts"
  );
  assertPassingHoldoutSummary(
    evidence.holdouts.passed,
    evidence.holdouts.total
  );
  requireValue(
    evidence.holdouts.all_passed === true,
    "Workflow holdouts must be labeled all passed."
  );
  requireValue(
    evidence.holdouts.included_in_observed_interval === false,
    "Post-capture holdout execution must remain outside the observed interval."
  );

  requireValue(
    Array.isArray(evidence.not_measured) &&
      evidence.not_measured.length ===
        WORKFLOW_OPERATIONAL_EVIDENCE_NOT_MEASURED.length &&
      evidence.not_measured.every(
        (value, index) =>
          value === WORKFLOW_OPERATIONAL_EVIDENCE_NOT_MEASURED[index]
      ),
    "Workflow operational evidence not_measured boundary is invalid."
  );
  requireValue(
    evidence.claim_boundary === WORKFLOW_OPERATIONAL_EVIDENCE_CLAIM_BOUNDARY,
    "Workflow operational evidence claim boundary is invalid."
  );

  return evidence;
}
