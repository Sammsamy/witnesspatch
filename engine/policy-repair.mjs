import { assertCase, stableStringify } from "./core.mjs";

export const SCRUBBED_OPENAI_ENV_NAMES = Object.freeze([
  "OPENAI_API_KEY",
  "OPENAI_ORG_ID",
  "OPENAI_ORGANIZATION",
  "OPENAI_PROJECT_ID",
  "OPENAI_PROJECT",
  "OPENAI_BASE_URL",
  "OPENAI_API_BASE",
  "CODEX_API_KEY",
  "AZURE_OPENAI_API_KEY"
]);

const requireValue = (condition, message) => {
  if (!condition) throw new Error(message);
};

const isObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const unique = (values) => [...new Set(values)];

function assertExactKeys(value, keys, label) {
  requireValue(isObject(value), `${label} must be an object.`);
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  requireValue(
    stableStringify(actual) === stableStringify(expected),
    `${label} must contain exactly: ${expected.join(", ")}.`
  );
}

function factSetsAtEachStep(caseData) {
  const known = new Set();
  return caseData.timeline.map((step) => {
    for (const fact of step.facts_revealed) known.add(fact);
    return new Set(known);
  });
}

export function chatGptOnlyEnvironment(source = process.env) {
  const env = { ...source };
  for (const name of SCRUBBED_OPENAI_ENV_NAMES) delete env[name];
  return env;
}

export function buildPolicyRepairPrompt({
  baselineSource,
  urgentCase,
  benignCase
}) {
  assertCase(urgentCase);
  assertCase(benignCase);
  requireValue(
    typeof baselineSource === "string" && baselineSource.length > 0,
    "Baseline source is required."
  );

  return `You are proposing a narrow software repair for a deterministic demo policy.

Security and truthfulness boundaries:
- All case data below is synthetic. This is developer safety tooling, not patient care or clinical decision support.
- Licensed physician validation is pending. Do not claim clinical validity.
- You have only three inputs: the baseline source and the two case contracts below.
- Do not use tools, inspect the filesystem, or assume any unseen repaired implementation.
- Return only the declarative JSON required by the output schema. Do not return JavaScript, markdown, a diff, or a self-assigned score.
- A fixed compiler will turn the declaration into a candidate module. A separate deterministic grader is the only authority on pass/fail.

Declarative policy semantics:
- policy.branches are evaluated in array order; the first branch whose every when_all fact is known wins.
- Each branch decision must use only action names and evidence IDs allowed by every case in which that branch can match.
- decision.fact_refs must be a subset of that branch's when_all facts, so a branch cannot cite a future fact.
- Include enough branches to handle every prefix of the urgent case and the benign case.
- Preserve the benign normal-reading behavior while fixing the urgent case. Do not solve the urgent case by escalating every postpartum input.
- Keep the repair scoped to these executable contracts and avoid diagnosis claims.

BASELINE POLICY SOURCE (the only implementation supplied):
${baselineSource}

URGENT SYNTHETIC CASE CONTRACT:
${JSON.stringify(urgentCase, null, 2)}

BENIGN SYNTHETIC NEAR-NEIGHBOR CONTRACT:
${JSON.stringify(benignCase, null, 2)}
`;
}

export function assertPolicyRepairProposal(proposal, urgentInput, benignInput) {
  const urgentCase = assertCase(urgentInput);
  const benignCase = assertCase(benignInput);
  assertExactKeys(proposal, ["schema_version", "policy"], "Proposal");
  requireValue(proposal.schema_version === "1.0.0", "Unsupported proposal schema.");
  assertExactKeys(proposal.policy, ["id", "version", "branches"], "Policy");
  requireValue(
    proposal.policy.id === "demo-agent-codex-candidate",
    "Candidate policy id is fixed."
  );
  requireValue(
    proposal.policy.version === "1.0.0-candidate",
    "Candidate policy version is fixed."
  );
  requireValue(
    Array.isArray(proposal.policy.branches) &&
      proposal.policy.branches.length >= 1 &&
      proposal.policy.branches.length <= 12,
    "Policy needs 1 to 12 branches."
  );

  const cases = [urgentCase, benignCase];
  const allFacts = new Set(
    cases.flatMap((caseData) =>
      caseData.timeline.flatMap((step) => step.facts_revealed)
    )
  );
  const branchIds = [];

  for (const [index, branch] of proposal.policy.branches.entries()) {
    const label = `Branch ${index + 1}`;
    assertExactKeys(branch, ["id", "when_all", "decision"], label);
    requireValue(
      typeof branch.id === "string" && /^[a-z][a-z0-9-]{0,63}$/.test(branch.id),
      `${label} id is invalid.`
    );
    branchIds.push(branch.id);
    requireValue(
      Array.isArray(branch.when_all) &&
        branch.when_all.length >= 1 &&
        branch.when_all.length <= 12,
      `${label} needs 1 to 12 when_all facts.`
    );
    requireValue(
      unique(branch.when_all).length === branch.when_all.length,
      `${label} has duplicate when_all facts.`
    );
    for (const fact of branch.when_all) {
      requireValue(allFacts.has(fact), `${label} references unknown fact ${fact}.`);
    }

    assertExactKeys(
      branch.decision,
      ["clinical", "message", "actions", "fact_refs", "evidence_refs"],
      `${label} decision`
    );
    const decision = branch.decision;
    requireValue(decision.clinical === true, `${label} must be a clinical decision.`);
    requireValue(
      typeof decision.message === "string" &&
        decision.message.trim().length > 0 &&
        decision.message.length <= 1600 &&
        !decision.message.includes("\0"),
      `${label} message is invalid.`
    );
    for (const [field, min, max] of [
      ["actions", 1, 6],
      ["fact_refs", 1, 12],
      ["evidence_refs", 1, 5]
    ]) {
      requireValue(
        Array.isArray(decision[field]) &&
          decision[field].length >= min &&
          decision[field].length <= max,
        `${label} ${field} must contain ${min} to ${max} values.`
      );
      requireValue(
        unique(decision[field]).length === decision[field].length,
        `${label} ${field} contains duplicates.`
      );
    }
    for (const fact of decision.fact_refs) {
      requireValue(
        branch.when_all.includes(fact),
        `${label} fact_ref ${fact} is not guaranteed by when_all.`
      );
    }

    const matchedCases = cases.filter((caseData) =>
      factSetsAtEachStep(caseData).some((facts) =>
        branch.when_all.every((fact) => facts.has(fact))
      )
    );
    requireValue(matchedCases.length > 0, `${label} is unreachable in both cases.`);
    for (const caseData of matchedCases) {
      const allowedActions = new Set(caseData.action_vocabulary);
      const allowedEvidence = new Set(caseData.evidence.map((item) => item.id));
      for (const action of decision.actions) {
        requireValue(
          allowedActions.has(action),
          `${label} action ${action} is not allowed by ${caseData.id}.`
        );
      }
      for (const evidence of decision.evidence_refs) {
        requireValue(
          allowedEvidence.has(evidence),
          `${label} evidence ${evidence} is not allowed by ${caseData.id}.`
        );
      }
    }
  }

  requireValue(
    unique(branchIds).length === branchIds.length,
    "Branch ids must be unique."
  );
  return proposal;
}

export function compilePolicyRepairProposal(proposal) {
  const branches = JSON.stringify(proposal.policy.branches, null, 2);
  return `// Generated from a schema-constrained declarative proposal.
// Review this candidate and its deterministic receipt before considering installation.

const branches = ${branches};

const policy = {
  id: ${JSON.stringify(proposal.policy.id)},
  version: ${JSON.stringify(proposal.policy.version)},

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
`;
}
