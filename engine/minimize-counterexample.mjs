import { unique } from "./private-utils.mjs";

function availableAt(caseData, facts, minute) {
  const allowed = new Set(facts);
  return new Set(
    caseData.timeline
      .filter((step) => step.at_minute <= minute)
      .flatMap((step) => step.facts_revealed)
      .filter((fact) => allowed.has(fact))
  );
}

function failureForFacts(caseData, candidate, rule, facts) {
  let triggeredAt = null;
  for (const step of caseData.timeline) {
    const available = availableAt(caseData, facts, step.at_minute);
    if (rule.when_all_facts.every((fact) => available.has(fact))) {
      triggeredAt = step.at_minute;
      break;
    }
  }
  if (triggeredAt === null) {
    return { reproduces: false, reason: "rule_not_triggered" };
  }

  const deadline = triggeredAt + rule.max_delay_minutes;
  const observedActions = unique(
    candidate.decisions
      .filter(
        (decision) =>
          decision.at_minute >= triggeredAt && decision.at_minute <= deadline
      )
      .flatMap((decision) => decision.actions)
  );
  const missingActions = rule.required_actions.filter(
    (action) => !observedActions.includes(action)
  );
  const forbiddenActions = rule.forbidden_actions.filter((action) =>
    observedActions.includes(action)
  );

  return {
    reproduces: missingActions.length > 0 || forbiddenActions.length > 0,
    reason:
      missingActions.length > 0 || forbiddenActions.length > 0
        ? "invariant_failed"
        : "invariant_passed",
    triggered_at_minute: triggeredAt,
    observed_actions: observedActions,
    missing_actions: missingActions,
    forbidden_actions_observed: forbiddenActions
  };
}

function chunks(values, count) {
  const size = Math.ceil(values.length / count);
  const result = [];
  for (let index = 0; index < values.length; index += size) {
    result.push(values.slice(index, index + size));
  }
  return result;
}

function deltaDebug(values, predicate) {
  let current = [...values];
  let granularity = 2;
  const trace = [];

  while (current.length >= 2) {
    const partitions = chunks(current, granularity);
    let reduced = false;

    for (const partition of partitions) {
      const removed = new Set(partition);
      const complement = current.filter((value) => !removed.has(value));
      const result = predicate(complement);
      trace.push({
        granularity,
        attempted_removal: partition,
        remaining_count: complement.length,
        reproduced: result.reproduces
      });
      if (result.reproduces) {
        current = complement;
        granularity = Math.max(granularity - 1, 2);
        reduced = true;
        break;
      }
    }

    if (!reduced) {
      if (granularity >= current.length) {
        break;
      }
      granularity = Math.min(current.length, granularity * 2);
    }
  }

  return { minimal: current, trace };
}

function combinations(values, size) {
  const output = [];
  const visit = (start, selected) => {
    if (selected.length === size) {
      output.push([...selected]);
      return;
    }
    for (let index = start; index < values.length; index += 1) {
      selected.push(values[index]);
      visit(index + 1, selected);
      selected.pop();
    }
  };
  visit(0, []);
  return output;
}

export function minimizeCounterexample(
  caseData,
  candidate,
  targetRuleId = "INV-02",
  options = {}
) {
  const rule = caseData.rules.find((item) => item.id === targetRuleId);
  if (!rule) {
    throw new Error(`Unknown minimization target ${targetRuleId}.`);
  }
  const allFacts = caseData.timeline.flatMap((step) => step.facts_revealed);
  const predicate = (facts) =>
    failureForFacts(caseData, candidate, rule, facts);
  const fullTraceResult = predicate(allFacts);
  if (!fullTraceResult.reproduces) {
    throw new Error(`${targetRuleId} does not fail in the starting candidate.`);
  }
  const failureDeadline = fullTraceResult.triggered_at_minute + rule.max_delay_minutes;
  const startingFacts =
    options.startingFactScope === "failure_prefix"
      ? caseData.timeline
          .filter((step) => step.at_minute <= failureDeadline)
          .flatMap((step) => step.facts_revealed)
      : allFacts;
  const startingResult = predicate(startingFacts);
  if (!startingResult.reproduces) {
    throw new Error(`${targetRuleId} does not fail in the starting candidate.`);
  }

  const { minimal, trace } = deltaDebug(startingFacts, predicate);
  const minimalResult = predicate(minimal);
  const removalChecks = minimal.map((fact) => {
    const remaining = minimal.filter((value) => value !== fact);
    const result = predicate(remaining);
    return {
      removed_fact: fact,
      remaining_facts: remaining,
      reproduced: result.reproduces,
      reason: result.reason
    };
  });
  let smallerSubsetsChecked = 0;
  let smallerReproducer = null;
  for (let size = 0; size < minimal.length; size += 1) {
    for (const subset of combinations(startingFacts, size)) {
      smallerSubsetsChecked += 1;
      if (predicate(subset).reproduces) {
        smallerReproducer = subset;
        break;
      }
    }
    if (smallerReproducer) {
      break;
    }
  }

  return {
    schema_version: "1.0.0",
    counterexample_id:
      options.counterexampleId ?? "counterexample-pws-001",
    generated_at:
      options.generatedAt ?? "2026-07-13T06:23:00.000Z",
    case_id: caseData.id,
    source_run_id: candidate.run_id,
    target_rule_id: rule.id,
    target_rule_title: rule.title,
    minimality_label: "oracle-minimal",
    minimality_scope:
      options.minimalityScope ??
      "Encoded INV-02 action predicate over synthetic fact identifiers",
    clinical_minimality_claimed: false,
    provenance: {
      generation_mode: "deterministic_delta_debugging",
      ...(options.startingFactScope
        ? {
            starting_fact_scope:
              options.startingFactScope === "failure_prefix"
                ? "facts revealed through the selected rule failure deadline"
                : "all facts in the synthetic timeline"
          }
        : {}),
      contains_real_patient_data: false,
      clinician_validation: "pending",
      api_key_required: false,
      interpretation: "This is oracle-minimal for one encoded software rule over synthetic fact identifiers. It is not clinically minimal and is not a medical claim."
    },
    starting_fact_count: startingFacts.length,
    starting_fact_ids: startingFacts,
    minimal_fact_count: minimal.length,
    minimal_fact_ids: minimal,
    removed_fact_ids: startingFacts.filter((fact) => !minimal.includes(fact)),
    failure: {
      critical: rule.critical,
      triggered_at_minute: minimalResult.triggered_at_minute,
      missing_actions: minimalResult.missing_actions,
      forbidden_actions_observed:
        minimalResult.forbidden_actions_observed
    },
    verification: {
      algorithm: "ddmin-complement-reduction",
      oracle_predicate_reproduced: minimalResult.reproduces,
      oracle_one_minimal: removalChecks.every((check) => !check.reproduced),
      oracle_cardinality_minimal: smallerReproducer === null,
      smaller_subsets_checked: smallerSubsetsChecked,
      smaller_reproducer: smallerReproducer,
      removal_checks: removalChecks,
      reduction_trace: trace
    }
  };
}
