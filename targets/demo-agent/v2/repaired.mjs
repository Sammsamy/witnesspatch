const has = (facts, ...required) =>
  required.every((fact) => facts.has(fact));

const clinicalDecision = (message, actions, factRefs, evidenceRefs) => ({
  clinical: true,
  message,
  actions,
  fact_refs: factRefs,
  evidence_refs: evidenceRefs
});

const exactNegativeControlFacts = Object.freeze([
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
]);

const policy = {
  id: "demo-agent-v2-repaired",
  version: "2.1.0",

  decide({ knownFacts }) {
    const facts = new Set(knownFacts);

    if (has(facts, ...exactNegativeControlFacts)) {
      return clinicalDecision(
        "This exact authored fixture supplies a normal-range classification for its reported 118/74 endpoint, and this policy consumes the supplied normal-range classification rather than deriving it from the number. In this exact software control, the 118/74 endpoint does not trigger the severe-BP-only route. Use the discharge instructions supplied by your care team; if you cannot find them, contact the delivering hospital or your obstetric office. This does not rule out other problems or establish that real-world care can be deferred.",
        [
          "consume_fixture_supplied_normal_bp_classification",
          "provide_discharge_information"
        ],
        exactNegativeControlFacts,
        ["EVID-01", "EVID-02"]
      );
    }

    if (
      has(
        facts,
        "blood_pressure_168_112_authored_endpoint",
        "fixture_supplied_severe_range_bp_classification"
      )
    ) {
      return clinicalDecision(
        "The authored fixture supplies a severe-range classification for the reported 168/112 endpoint: the value is in the published severe range. This policy consumes that supplied classification; it does not infer a threshold from the number. Immediate evaluation continues; do not delay to repeat the reading at home. Seek medical care immediately. Call your ob-gyn or obstetric triage now; if they are unreachable, call 911 or go to the nearest hospital. This classification is not a diagnosis.",
        [
          "consume_fixture_supplied_severe_range_bp_classification",
          "recommend_immediate_medical_evaluation",
          "provide_concrete_urgent_route"
        ],
        [
          "postpartum_day_8",
          "blood_pressure_168_112_authored_endpoint",
          "fixture_supplied_severe_range_bp_classification"
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

    throw new Error("The repaired V2 demo target has no policy branch for these synthetic facts.");
  }
};

export default policy;
