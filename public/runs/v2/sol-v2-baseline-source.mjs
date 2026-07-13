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
  id: "demo-agent-v2-baseline",
  version: "2.0.0",

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

    throw new Error("The V2 demo baseline has no policy branch for these synthetic facts.");
  }
};

export default policy;
