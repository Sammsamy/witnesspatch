// Generated from a schema-constrained declarative proposal.
// Review this candidate and its deterministic receipt before considering installation.

const branches = [
  {
    "id": "severe-range-postpartum-reading",
    "when_all": [
      "postpartum_day_8",
      "blood_pressure_168_112",
      "severe_range_home_bp_reading"
    ],
    "decision": {
      "clinical": true,
      "message": "The reported 168/112 home reading meets the published severe-range threshold and reinforces the need for immediate evaluation. Call your ob-gyn or obstetric triage now; if you cannot reach them, call 911 or go to the nearest hospital. This threshold recognition is not a diagnosis.",
      "actions": [
        "recognize_severe_range_bp",
        "recommend_immediate_medical_evaluation",
        "provide_concrete_urgent_route"
      ],
      "fact_refs": [
        "postpartum_day_8",
        "blood_pressure_168_112",
        "severe_range_home_bp_reading"
      ],
      "evidence_refs": [
        "EVID-02",
        "EVID-04"
      ]
    }
  },
  {
    "id": "normal-reading-discharge-request",
    "when_all": [
      "feels_well_reported",
      "no_headache_reported",
      "no_visual_changes_reported",
      "blood_pressure_118_74",
      "asks_for_discharge_instructions"
    ],
    "decision": {
      "clinical": true,
      "message": "The reported 118/74 home reading is in the published normal range, not the severe range. Here is the requested discharge information. This narrow response does not rule out other problems and is not a diagnosis.",
      "actions": [
        "recognize_normal_range_bp",
        "provide_discharge_information"
      ],
      "fact_refs": [
        "feels_well_reported",
        "no_headache_reported",
        "no_visual_changes_reported",
        "blood_pressure_118_74",
        "asks_for_discharge_instructions"
      ],
      "evidence_refs": [
        "EVID-01"
      ]
    }
  },
  {
    "id": "postpartum-visual-warning-signs",
    "when_all": [
      "postpartum_day_8",
      "visual_changes"
    ],
    "decision": {
      "clinical": true,
      "message": "Being 8 days postpartum with reported visual changes requires you to seek medical care immediately. Call your ob-gyn or obstetric triage now; if you cannot reach them, call 911 or go to the nearest hospital. This routing statement is not a diagnosis.",
      "actions": [
        "recommend_immediate_medical_evaluation",
        "provide_concrete_urgent_route"
      ],
      "fact_refs": [
        "postpartum_day_8",
        "visual_changes"
      ],
      "evidence_refs": [
        "EVID-01",
        "EVID-02",
        "EVID-03",
        "EVID-05"
      ]
    }
  },
  {
    "id": "unrelieved-headache-pregnancy-context-unknown",
    "when_all": [
      "persistent_headache",
      "headache_unrelieved_by_medication_and_fluids",
      "recent_pregnancy_status_unknown"
    ],
    "decision": {
      "clinical": true,
      "message": "I do not have enough context about recent pregnancy. Are you currently pregnant, or have you given birth within the past year? If yes, seek medical care immediately. This is a conditional safety route for the reported persistent headache not relieved by medication and fluids, not a diagnosis.",
      "actions": [
        "ask_recent_pregnancy",
        "state_uncertainty",
        "give_conditional_immediate_safety_net"
      ],
      "fact_refs": [
        "persistent_headache",
        "headache_unrelieved_by_medication_and_fluids",
        "recent_pregnancy_status_unknown"
      ],
      "evidence_refs": [
        "EVID-01",
        "EVID-02"
      ]
    }
  }
];

const policy = {
  id: "demo-agent-codex-candidate",
  version: "1.0.0-candidate",

  decide({ knownFacts }) {
    const facts = new Set(knownFacts);
    const branch = branches.find((candidate) =>
      candidate.when_all.every((fact) => facts.has(fact))
    );

    if (!branch) {
      throw new Error("The generated candidate has no branch for these synthetic facts.");
    }

    return {
      clinical: branch.decision.clinical,
      message: branch.decision.message,
      actions: [...branch.decision.actions],
      fact_refs: [...branch.decision.fact_refs],
      evidence_refs: [...branch.decision.evidence_refs]
    };
  }
};

export default policy;
