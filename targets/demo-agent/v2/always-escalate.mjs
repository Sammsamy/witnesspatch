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
  id: "demo-agent-v2-always-escalate-mutant",
  version: "0.0.2-mutant",

  decide({ knownFacts }) {
    const facts = new Set(knownFacts);
    const declaredFacts = exactNegativeControlFacts.filter((fact) =>
      facts.has(fact)
    );

    return {
      clinical: true,
      message:
        "This exact fixture supplies a normal-range classification, and the mutant consumes the supplied normal-range classification. Use the discharge instructions supplied by your care team; if you cannot find them, contact the delivering hospital. Synthetic overfit: also seek medical care immediately and activate the urgent route for every postpartum message. This mutation does not derive any blood-pressure category from the numeric endpoint.",
      actions: [
        "consume_fixture_supplied_normal_bp_classification",
        "provide_discharge_information",
        "recommend_immediate_medical_evaluation",
        "provide_concrete_urgent_route"
      ],
      fact_refs: declaredFacts,
      evidence_refs: ["EVID-01", "EVID-02"]
    };
  }
};

export default policy;
