function decisionFor(candidate, stepId) {
  const decision = candidate.decisions.find((item) => item.step_id === stepId);
  if (!decision) {
    throw new Error(`Holdout mutation references unknown decision ${stepId}.`);
  }
  return decision;
}

function addUnique(values, value) {
  return values.includes(value) ? values : [...values, value];
}

function applyMutation(candidate, mutation) {
  const decision = decisionFor(candidate, mutation.step_id);
  switch (mutation.op) {
    case "add_action":
      decision.actions = addUnique(decision.actions, mutation.value);
      break;
    case "remove_action":
      decision.actions = decision.actions.filter((value) => value !== mutation.value);
      break;
    case "add_fact_ref":
      decision.fact_refs = addUnique(decision.fact_refs, mutation.value);
      break;
    case "clear_evidence_refs":
      decision.evidence_refs = [];
      break;
    case "replace_evidence_refs":
      decision.evidence_refs = [...mutation.values];
      break;
    case "replace_message":
      decision.message = mutation.value;
      break;
    default:
      throw new Error(`Unsupported holdout mutation ${mutation.op}.`);
  }
}

export function runHoldoutSuiteKernel(
  caseData,
  baseCandidate,
  suite,
  paired = {},
  grade
) {
  const ids = new Set();
  const checks = suite.checks.map((check) => {
    if (ids.has(check.id)) {
      throw new Error(`Duplicate holdout id ${check.id}.`);
    }
    ids.add(check.id);

    if (check.kind === "rule_trigger_isolation") {
      const targetRule = caseData.rules.find(
        (rule) => rule.id === check.target_rule_id
      );
      const competingRule = caseData.rules.find(
        (rule) => rule.id === check.competing_rule_id
      );
      if (!targetRule || !competingRule) {
        throw new Error(`${check.id} references an unknown isolation rule.`);
      }
      const facts = new Set(check.included_fact_ids);
      const targetTriggered = targetRule.when_all_facts.every((fact) =>
        facts.has(fact)
      );
      const competingTriggered = competingRule.when_all_facts.every((fact) =>
        facts.has(fact)
      );
      const factMinutes = new Map(
        caseData.timeline.flatMap((step) =>
          step.facts_revealed.map((fact) => [fact, step.at_minute])
        )
      );
      const triggerAt = targetTriggered
        ? Math.max(
            ...targetRule.when_all_facts.map((fact) => factMinutes.get(fact))
          )
        : null;
      const decision = baseCandidate.decisions.find(
        (item) => item.at_minute === triggerAt
      );
      const actions = decision?.actions ?? [];
      const missingActions = targetRule.required_actions.filter(
        (action) => !actions.includes(action)
      );
      const forbiddenActions = targetRule.forbidden_actions.filter((action) =>
        actions.includes(action)
      );
      const targetActionsPass =
        missingActions.length === 0 && forbiddenActions.length === 0;
      const expectationMatched =
        targetTriggered === check.expected.target_triggered &&
        competingTriggered === check.expected.competing_triggered &&
        targetActionsPass === check.expected.target_actions_pass &&
        triggerAt === check.expected.trigger_at_minute;

      return {
        id: check.id,
        kind: check.kind,
        title: check.title,
        expectation_matched: expectationMatched,
        included_fact_ids: check.included_fact_ids,
        target_rule_id: check.target_rule_id,
        competing_rule_id: check.competing_rule_id,
        expected: check.expected,
        actual: {
          target_triggered: targetTriggered,
          competing_triggered: competingTriggered,
          target_actions_pass: targetActionsPass,
          trigger_at_minute: triggerAt,
          observed_actions: actions,
          missing_actions: missingActions,
          forbidden_actions_observed: forbiddenActions
        },
        limitation:
          "This isolates an encoded software trigger over synthetic fact IDs; it is not a clinical sufficiency claim."
      };
    }

    if (check.kind === "paired_near_neighbor") {
      if (
        !paired.nearNeighborCase ||
        !paired.nearNeighborSafe ||
        !paired.nearNeighborOverfit
      ) {
        throw new Error(`${check.id} requires paired near-neighbor inputs.`);
      }
      const safeEvaluation = grade(
        paired.nearNeighborCase,
        paired.nearNeighborSafe
      );
      const overfitEvaluation = grade(
        paired.nearNeighborCase,
        paired.nearNeighborOverfit
      );
      const overfitFailedIds = overfitEvaluation.results
        .filter((result) => !result.passed)
        .map((result) => result.id);
      const expectationMatched =
        safeEvaluation.status === check.expected.safe_status &&
        safeEvaluation.score === check.expected.safe_score &&
        overfitEvaluation.status === check.expected.overfit_status &&
        overfitEvaluation.score === check.expected.overfit_score &&
        JSON.stringify([...overfitFailedIds].sort()) ===
          JSON.stringify([...check.expected.overfit_failed_ids].sort());

      return {
        id: check.id,
        kind: check.kind,
        title: check.title,
        expectation_matched: expectationMatched,
        expected: check.expected,
        actual: {
          safe_run_id: paired.nearNeighborSafe.run_id,
          safe_status: safeEvaluation.status,
          safe_score: safeEvaluation.score,
          overfit_run_id: paired.nearNeighborOverfit.run_id,
          overfit_status: overfitEvaluation.status,
          overfit_score: overfitEvaluation.score,
          overfit_failed_ids: overfitFailedIds
        },
        limitation:
          "This is a narrow normal-reading software assertion. It does not decide whether real-world care can be deferred."
      };
    }

    const candidate = structuredClone(baseCandidate);
    candidate.run_id = `${baseCandidate.run_id}-${check.id.toLowerCase()}`;
    candidate.variant = "candidate";
    for (const mutation of check.mutations ?? []) {
      applyMutation(candidate, mutation);
    }

    const evaluation = grade(caseData, candidate);
    const failedIds = evaluation.results
      .filter((result) => !result.passed)
      .map((result) => result.id);
    const expectedFailed = [...check.expected.failed_ids].sort();
    const actualFailed = [...failedIds].sort();
    const expectationMatched =
      evaluation.status === check.expected.status &&
      evaluation.score === check.expected.score &&
      JSON.stringify(actualFailed) === JSON.stringify(expectedFailed);

    return {
      id: check.id,
      title: check.title,
      expectation_matched: expectationMatched,
      mutations: check.mutations ?? [],
      expected: check.expected,
      actual: {
        status: evaluation.status,
        score: evaluation.score,
        failed_ids: failedIds,
        time_to_safe_action_minutes:
          evaluation.metrics.time_to_safe_action_minutes,
        future_fact_violations: evaluation.metrics.future_fact_violations
      }
    };
  });
  const passed = checks.filter((check) => check.expectation_matched).length;

  return {
    schema_version: "1.0.0",
    suite_id: suite.suite_id,
    title: suite.title,
    description: suite.description,
    case_id: caseData.id,
    source_run_id: baseCandidate.run_id,
    provenance: {
      generation_mode: "deterministic_mutation_suite",
      contains_real_patient_data: false,
      clinician_validation: "pending",
      api_key_required: false,
      interpretation: "A passing check means the grader matched the declared software assertion. Source linkage is mechanical. Message/action and future-fact text checks use case-locked lexical markers, not full semantic verification. No check is clinical validation."
    },
    status: passed === checks.length ? "pass" : "fail",
    passed,
    total: checks.length,
    checks
  };
}
