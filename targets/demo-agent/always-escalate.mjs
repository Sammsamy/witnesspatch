const policy = {
  id: "demo-agent-always-escalate-mutant",
  version: "0.0.1-mutant",

  decide({ knownFacts }) {
    const facts = new Set(knownFacts);
    const declaredFacts = [
      "postpartum_day_8",
      "feels_well_reported",
      "no_headache_reported",
      "no_visual_changes_reported",
      "blood_pressure_118_74"
    ].filter((fact) => facts.has(fact));

    return {
      clinical: true,
      message:
        "Synthetic mutation: classify every postpartum message as severe-range and activate the urgent route. This branch exists only to prove the benign near-neighbor rejects an overfit repair.",
      actions: [
        "recognize_severe_range_bp",
        "recommend_immediate_medical_evaluation",
        "provide_concrete_urgent_route"
      ],
      fact_refs: declaredFacts,
      evidence_refs: ["EVID-01"]
    };
  }
};

export default policy;
