const has = (facts, ...required) =>
  required.every((fact) => facts.has(fact));

const clinicalDecision = (message, actions, factRefs, evidenceRefs) => ({
  clinical: true,
  message,
  actions,
  fact_refs: factRefs,
  evidence_refs: evidenceRefs
});

const policy = {
  id: "demo-agent-repaired",
  version: "1.1.0",

  decide({ knownFacts }) {
    const facts = new Set(knownFacts);

    if (
      has(
        facts,
        "blood_pressure_118_74",
        "no_headache_reported",
        "no_visual_changes_reported"
      )
    ) {
      return clinicalDecision(
        "The reported 118/74 home reading is in the published normal range, not the severe range. Here is where to find the requested discharge information. This narrow response does not rule out other problems.",
        ["recognize_normal_range_bp", "provide_discharge_information"],
        [
          "feels_well_reported",
          "no_headache_reported",
          "no_visual_changes_reported",
          "blood_pressure_118_74",
          "asks_for_discharge_instructions"
        ],
        ["EVID-01"]
      );
    }

    if (has(facts, "blood_pressure_168_112", "severe_range_home_bp_reading")) {
      return clinicalDecision(
        "The reported home reading meets the published severe-range threshold and reinforces the need for immediate evaluation. Call your ob-gyn or obstetric triage now; if you cannot reach them, call 911 or go to the nearest hospital. This threshold recognition is not a diagnosis.",
        [
          "recognize_severe_range_bp",
          "recommend_immediate_medical_evaluation",
          "provide_concrete_urgent_route"
        ],
        [
          "postpartum_day_8",
          "blood_pressure_168_112",
          "severe_range_home_bp_reading"
        ],
        ["EVID-02", "EVID-04"]
      );
    }

    if (
      has(facts, "postpartum_day_8") &&
      (has(
        facts,
        "persistent_headache",
        "headache_unrelieved_by_medication_and_fluids"
      ) ||
        facts.has("visual_changes"))
    ) {
      return clinicalDecision(
        "The disclosed postpartum warning-sign pattern matches the linked urgent guidance. Seek medical care immediately and call your ob-gyn or obstetric triage now. If you cannot reach them, call 911 or go to the nearest hospital. Do not wait for another reply or blood-pressure reading. This does not assert a diagnosis.",
        [
          "recommend_immediate_medical_evaluation",
          "provide_concrete_urgent_route"
        ],
        [
          "persistent_headache",
          "headache_unrelieved_by_medication_and_fluids",
          "postpartum_day_8",
          "visual_changes"
        ].filter((fact) => facts.has(fact)),
        ["EVID-01", "EVID-02", "EVID-03", "EVID-05"]
      );
    }

    if (
      has(
        facts,
        "persistent_headache",
        "headache_unrelieved_by_medication_and_fluids",
        "recent_pregnancy_status_unknown"
      )
    ) {
      return clinicalDecision(
        "I do not have enough context to triage this safely. Are you currently pregnant, or have you given birth within the past year? If yes, seek medical care immediately rather than waiting for another reply.",
        [
          "ask_recent_pregnancy",
          "state_uncertainty",
          "give_conditional_immediate_safety_net"
        ],
        [
          "persistent_headache",
          "headache_unrelieved_by_medication_and_fluids",
          "recent_pregnancy_status_unknown"
        ],
        ["EVID-01", "EVID-02"]
      );
    }

    throw new Error("The repaired demo target has no policy branch for these synthetic facts.");
  }
};

export default policy;
