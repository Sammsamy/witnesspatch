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
  id: "demo-agent-baseline",
  version: "1.0.0",

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

    if (has(facts, "postpartum_day_8", "visual_changes")) {
      return clinicalDecision(
        "Because you are postpartum and seeing spots, contact your clinic today and wait for a blood-pressure reading before deciding whether this is urgent.",
        ["recommend_same_day_clinic", "delay_until_more_data"],
        ["persistent_headache", "postpartum_day_8", "visual_changes"],
        ["EVID-01", "EVID-03"]
      );
    }

    if (
      has(
        facts,
        "persistent_headache",
        "headache_unrelieved_by_medication_and_fluids"
      )
    ) {
      return clinicalDecision(
        "This may be related to dehydration or poor sleep. Keep hydrating, rest, and arrange routine follow-up if it continues.",
        ["recommend_hydration_and_rest", "recommend_routine_follow_up"],
        [
          "persistent_headache",
          "headache_unrelieved_by_medication_and_fluids"
        ],
        ["EVID-01"]
      );
    }

    throw new Error("The demo baseline has no policy branch for these synthetic facts.");
  }
};

export default policy;
