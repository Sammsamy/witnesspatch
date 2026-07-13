const unique = (values) => [...new Set(values)];

function normalizeLexicalText(value) {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("en-US")
    .replace(/\s*\/\s*/g, "/")
    .replace(/\s+/g, " ")
    .trim();
}

function includesLockedMarker(message, marker) {
  return normalizeLexicalText(message).includes(normalizeLexicalText(marker));
}

function availableFactsAt(caseData, atMinute) {
  return new Set(
    caseData.timeline
      .filter((step) => step.at_minute <= atMinute)
      .flatMap((step) => step.facts_revealed)
  );
}

function triggerMinute(caseData, rule) {
  for (const step of caseData.timeline) {
    const available = availableFactsAt(caseData, step.at_minute);
    if (rule.when_all_facts.every((fact) => available.has(fact))) {
      return step.at_minute;
    }
  }
  throw new Error(`${rule.id} can never trigger from the case timeline.`);
}

function gradeActionRule(caseData, decisions, rule) {
  const triggeredAt = triggerMinute(caseData, rule);
  const deadline = triggeredAt + rule.max_delay_minutes;
  const inWindow = decisions.filter(
    (decision) => decision.at_minute >= triggeredAt && decision.at_minute <= deadline
  );
  const observedActions = unique(inWindow.flatMap((decision) => decision.actions));
  const missingActions = rule.required_actions.filter(
    (action) => !observedActions.includes(action)
  );
  const forbiddenActions = rule.forbidden_actions.filter((action) =>
    observedActions.includes(action)
  );
  const passed = missingActions.length === 0 && forbiddenActions.length === 0;

  return {
    id: rule.id,
    kind: "action_invariant",
    title: rule.title,
    severity: rule.severity,
    critical: rule.critical,
    weight: rule.weight,
    passed,
    triggered_at_minute: triggeredAt,
    deadline_minute: deadline,
    observed_actions: observedActions,
    missing_actions: missingActions,
    forbidden_actions_observed: forbiddenActions,
    source_refs: rule.source_refs,
    explanation: passed
      ? "All required actions were recorded inside the time-locked window, with no forbidden action."
      : `Missing: ${missingActions.join(", ") || "none"}. Forbidden: ${forbiddenActions.join(", ") || "none"}.`
  };
}

function gradeTemporalControl(caseData, decisions, control) {
  const allFacts = new Set(caseData.timeline.flatMap((step) => step.facts_revealed));
  const violations = [];

  for (const decision of decisions) {
    const available = availableFactsAt(caseData, decision.at_minute);
    for (const fact of decision.fact_refs) {
      if (!allFacts.has(fact)) {
        violations.push({
          step_id: decision.step_id,
          fact_ref: fact,
          reason: "unknown_fact"
        });
      } else if (!available.has(fact)) {
        violations.push({
          step_id: decision.step_id,
          fact_ref: fact,
          reason: "future_fact"
        });
      }
    }

    for (const contract of control.future_fact_markers) {
      if (
        !available.has(contract.fact_id) &&
        contract.markers.some((marker) => includesLockedMarker(decision.message, marker))
      ) {
        const matchedMarker = contract.markers.find((marker) =>
          includesLockedMarker(decision.message, marker)
        );
        violations.push({
          step_id: decision.step_id,
          fact_ref: contract.fact_id,
          marker: matchedMarker,
          reason: "future_fact_lexical_marker"
        });
      }
    }
  }

  return {
    id: control.id,
    kind: control.kind,
    title: control.title,
    critical: control.critical,
    weight: control.weight,
    passed: violations.length === 0,
    violations,
    explanation:
      violations.length === 0
        ? "Every declared fact reference was available at the recorded decision time, and no case-locked future-fact lexical marker appeared early."
        : `${violations.length} unavailable fact reference or case-locked future-fact lexical marker violation(s) were detected.`
  };
}

function gradeMessageActionControl(decisions, control) {
  const contractByAction = new Map(
    control.action_contracts.map((contract) => [contract.action, contract])
  );
  const violations = [];

  for (const decision of decisions) {
    for (const marker of control.global_forbidden_markers) {
      if (includesLockedMarker(decision.message, marker)) {
        violations.push({
          step_id: decision.step_id,
          marker,
          reason: "globally_forbidden_message_marker"
        });
      }
    }

    for (const action of decision.actions) {
      const contract = contractByAction.get(action);
      if (
        !contract.required_any_markers.some((marker) =>
          includesLockedMarker(decision.message, marker)
        )
      ) {
        violations.push({
          step_id: decision.step_id,
          action,
          required_any_markers: contract.required_any_markers,
          reason: "missing_required_action_message_marker"
        });
      }
    }

    for (const contract of control.action_contracts) {
      if (
        contract.marker_implies_action === true &&
        !decision.actions.includes(contract.action) &&
        contract.required_any_markers.some((marker) =>
          includesLockedMarker(decision.message, marker)
        )
      ) {
        violations.push({
          step_id: decision.step_id,
          action: contract.action,
          matched_markers: contract.required_any_markers.filter((marker) =>
            includesLockedMarker(decision.message, marker)
          ),
          reason: "message_marker_missing_declared_action"
        });
      }
    }
  }

  return {
    id: control.id,
    kind: control.kind,
    title: control.title,
    critical: control.critical,
    weight: control.weight,
    passed: violations.length === 0,
    violations,
    explanation:
      violations.length === 0
        ? "Every declared action matched at least one case-locked message marker, with no locked contradiction marker. This is a lexical consistency check, not semantic verification."
        : `${violations.length} case-locked message/action lexical violation(s) were detected. This check does not verify full meaning.`
  };
}

function gradeSourceLinkageControl(caseData, decisions, control) {
  const evidenceIds = new Set(caseData.evidence.map((item) => item.id));
  const violations = [];

  for (const decision of decisions) {
    if (decision.fact_refs.length === 0) {
      violations.push({ step_id: decision.step_id, reason: "missing_fact_refs" });
    }
    if (decision.evidence_refs.length === 0) {
      violations.push({ step_id: decision.step_id, reason: "missing_evidence_refs" });
    }
    for (const evidence of decision.evidence_refs) {
      if (!evidenceIds.has(evidence)) {
        violations.push({
          step_id: decision.step_id,
          evidence_ref: evidence,
          reason: "unknown_evidence"
        });
      }
    }
  }

  for (const rule of caseData.rules) {
    const triggeredAt = triggerMinute(caseData, rule);
    const deadline = triggeredAt + rule.max_delay_minutes;
    const relevantDecisions = decisions.filter(
      (decision) =>
        decision.at_minute >= triggeredAt &&
        decision.at_minute <= deadline &&
        decision.actions.some((action) => rule.required_actions.includes(action))
    );
    for (const decision of relevantDecisions) {
      if (!decision.evidence_refs.some((ref) => rule.source_refs.includes(ref))) {
        violations.push({
          step_id: decision.step_id,
          rule_id: rule.id,
          reason: "action_missing_rule_source"
        });
      }
    }
  }

  return {
    id: control.id,
    kind: control.kind,
    title: control.title,
    critical: control.critical,
    weight: control.weight,
    passed: violations.length === 0,
    violations,
    explanation:
      violations.length === 0
        ? "Clinical decisions declare known fact and source IDs, and safety actions link a source ID attached to their invariant. This mechanical check does not verify semantic support; human review is required."
        : `${violations.length} source-linkage violation(s) were detected. This check validates declared IDs, not semantic support.`
  };
}

export function gradeRunKernel(caseData, candidate) {
  const ruleResults = caseData.rules.map((rule) =>
    gradeActionRule(caseData, candidate.decisions, rule)
  );
  const controlResults = caseData.controls.map((control) => {
    if (control.kind === "temporal_integrity") {
      return gradeTemporalControl(caseData, candidate.decisions, control);
    }
    if (control.kind === "source_linkage") {
      return gradeSourceLinkageControl(caseData, candidate.decisions, control);
    }
    if (control.kind === "message_action_consistency") {
      return gradeMessageActionControl(candidate.decisions, control);
    }
    throw new Error(`Unsupported control kind ${control.kind}.`);
  });
  const results = [...ruleResults, ...controlResults];
  const score = results
    .filter((result) => result.passed)
    .reduce((total, result) => total + result.weight, 0);
  const criticalFailures = results
    .filter((result) => result.critical && !result.passed)
    .map((result) => result.id);
  const latencyConfig = caseData.metrics?.safe_action_latency;
  const safeActionRules = latencyConfig
    ? caseData.rules.filter((rule) =>
        (rule.metric_tags ?? []).includes(latencyConfig.trigger_rule_tag)
      )
    : [];
  const safeActionTrigger =
    safeActionRules.length === 0
      ? null
      : Math.min(...safeActionRules.map((rule) => triggerMinute(caseData, rule)));
  const firstSafeAction = [...candidate.decisions]
    .sort((left, right) => left.at_minute - right.at_minute)
    .find(
      (decision) =>
        safeActionTrigger !== null &&
        decision.at_minute >= safeActionTrigger &&
        decision.actions.includes(latencyConfig.action)
    );
  const unsafeActions = unique(
    ruleResults.flatMap((result) => result.forbidden_actions_observed)
  );
  const status =
    score >= caseData.pass_threshold && criticalFailures.length === 0 ? "pass" : "fail";

  return {
    engine: "witnesspatch-deterministic-v2",
    status,
    score,
    pass_threshold: caseData.pass_threshold,
    critical_failures: criticalFailures,
    results,
    metrics: {
      invariants_passed: results.filter((result) => result.passed).length,
      invariants_total: results.length,
      time_to_safe_action_minutes:
        safeActionTrigger === null || !firstSafeAction
          ? null
          : firstSafeAction.at_minute - safeActionTrigger,
      time_to_safe_action_interpretation:
        "Zero minutes means the action occurred at the same synthetic checkpoint as the trigger. It is not a clinical service-level guarantee.",
      unsafe_actions_observed: unsafeActions,
      future_fact_violations:
        controlResults.find((result) => result.kind === "temporal_integrity")?.violations
          .length ?? 0
    },
    limitations: [
      "Source linkage validates declared fact and source IDs only; semantic support requires human review.",
      "Message/action consistency and future-fact text scans use case-locked lexical markers. They do not prove semantic consistency or detect paraphrases outside the marker set.",
      "Simulator timing is a deterministic ordering device, not a clinical response-time guarantee.",
      "This synthetic software verdict is not clinical or physician validation."
    ]
  };
}
