import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

import { gradeRunKernel } from "./grading-kernel.mjs";
import {
  assertCandidateInput,
  assertCaseInput,
  assertRunInputAgainstFingerprint
} from "./input-validation.mjs";
import { assertRunSchema } from "./schema-validator.mjs";

const isObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const requireValue = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const ARTIFACT_HASH_SCOPES = new Set(["unmanifested", "external manifest"]);
const PROVENANCE_VERIFICATIONS = new Set([
  "unverified_input_declaration",
  "hash_listed_by_external_manifest"
]);

export async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

export function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  if (isObject(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function caseFingerprint(caseData) {
  return sha256(stableStringify(caseData));
}

export function assertCase(caseData) {
  return assertCaseInput(caseData);
}

export function assertCandidate(caseData, candidate) {
  return assertCandidateInput(caseData, candidate);
}

export function assertRunInput(caseData, runInput) {
  return assertRunInputAgainstFingerprint(
    caseData,
    runInput,
    () => caseFingerprint(caseData)
  );
}
export function gradeRun(caseData, candidate) {
  assertCase(caseData);
  assertCandidate(caseData, candidate);
  return gradeRunKernel(caseData, candidate);
}

function artifactHashScope(options) {
  const scope = options.artifactHashScope ?? "unmanifested";
  requireValue(
    ARTIFACT_HASH_SCOPES.has(scope),
    'artifactHashScope must be "unmanifested" or "external manifest".'
  );
  return scope;
}

function artifactProvenanceVerification(options) {
  const verification =
    options.provenanceVerification ?? "unverified_input_declaration";
  requireValue(
    PROVENANCE_VERIFICATIONS.has(verification),
    "provenanceVerification must be unverified_input_declaration or hash_listed_by_external_manifest."
  );
  if (verification === "hash_listed_by_external_manifest") {
    requireValue(
      artifactHashScope(options) === "external manifest",
      "hash_listed_by_external_manifest requires external manifest artifact hash scope."
    );
  }
  return verification;
}

export function buildAuditLog(caseData, runInput, evaluation, options = {}) {
  const hashScope = artifactHashScope(options);
  const events = [
    {
      sequence: 1,
      event: "case.loaded",
      detail: `${caseData.id} loaded as a synthetic time-locked fixture.`
    },
    ...runInput.decisions.map((decision, index) => ({
      sequence: index + 2,
      event: "decision.recorded",
      step_id: decision.step_id,
      at_minute: decision.at_minute,
      actions: decision.actions
    }))
  ];

  for (const result of evaluation.results) {
    events.push({
      sequence: events.length + 1,
      event: result.passed ? "invariant.passed" : "invariant.failed",
      invariant_id: result.id,
      critical: result.critical,
      detail: result.explanation
    });
  }

  if (runInput.repair) {
    requireValue(
      evaluation.status === "pass",
      "Repair metadata may only be recorded after this case passes deterministic evaluation."
    );
    events.push({
      sequence: events.length + 1,
      event: "repair.metadata_recorded",
      parent_run_id: runInput.repair.parent_run_id,
      declared_regression_assertions: runInput.repair.regression_assertions
    });
  }

  events.push({
    sequence: events.length + 1,
    event: "run.completed",
    status: evaluation.status,
    score: evaluation.score,
    artifact_hash_scope: hashScope
  });

  return events;
}

export function buildRunArtifact(caseData, runInput, options = {}) {
  assertRunInput(caseData, runInput);
  const evaluation = gradeRun(caseData, runInput);
  requireValue(
    !runInput.repair || evaluation.status === "pass",
    "Repaired runs must pass deterministic evaluation before repair metadata can be recorded."
  );
  const provenanceVerification = artifactProvenanceVerification(options);
  const artifact = {
    schema_version: "1.0.0",
    run_id: runInput.run_id,
    case_id: caseData.id,
    case_sha256: caseFingerprint(caseData),
    variant: runInput.variant,
    provenance_verification: provenanceVerification,
    provenance: runInput.provenance,
    decisions: runInput.decisions,
    ...(runInput.repair ? { repair: runInput.repair } : {}),
    evaluation,
    audit_log: buildAuditLog(caseData, runInput, evaluation, options)
  };

  return assertRunSchema(artifact);
}
