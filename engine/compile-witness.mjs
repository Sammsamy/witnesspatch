import { Buffer } from "node:buffer";

import {
  assertCase,
  buildRunArtifact,
  caseFingerprint,
  sha256,
  stableStringify
} from "./core.mjs";
import {
  buildWitnessBundleBase,
  buildWitnessBundleManifest,
  NoCompilableFailureError,
  normalizeWitnessRunInput,
  selectFailedActionInvariant
} from "./compile-witness-core.mjs";
import {
  assertCompiledWitnessSchema,
  assertWitnessBundleManifestSchema
} from "./schema-validator.mjs";

export { NoCompilableFailureError } from "./compile-witness-core.mjs";

const SHA256_HEX = /^[a-f0-9]{64}$/u;

function fileRecord(path, kind, contents) {
  return {
    path,
    kind,
    sha256: sha256(contents),
    bytes: Buffer.byteLength(contents)
  };
}

export function compileWitnessBundle(caseInput, runInput, options = {}) {
  const caseData = assertCase(caseInput);
  const normalizedRun = normalizeWitnessRunInput(runInput);
  const evaluatedRun = buildRunArtifact(caseData, normalizedRun);
  if (evaluatedRun.evaluation.status !== "fail") {
    throw new NoCompilableFailureError(
      "compile found no failing verdict; use evaluate for passing runs."
    );
  }
  const selectedTarget = selectFailedActionInvariant(
    caseData,
    evaluatedRun.evaluation,
    options.targetRuleId
  );
  if (
    !SHA256_HEX.test(options.inputCaseSha256 ?? "") ||
    !SHA256_HEX.test(options.inputRunSha256 ?? "")
  ) {
    throw new Error(
      "compileWitnessBundle requires both inputCaseSha256 and inputRunSha256 as lowercase 64-character SHA-256 digests."
    );
  }
  const identityHash = sha256(
    stableStringify({
      case_sha256: caseFingerprint(caseData),
      normalized_run: normalizedRun,
      target_rule_id: selectedTarget.id,
      input_case_sha256: options.inputCaseSha256 ?? null,
      input_run_sha256: options.inputRunSha256 ?? null
    })
  ).slice(0, 16);
  const base = buildWitnessBundleBase({
    caseData,
    normalizedRun,
    evaluatedRun,
    identityHash,
    targetRuleId: options.targetRuleId,
    startingFactScope: options.startingFactScope,
    inputCaseSha256: options.inputCaseSha256,
    inputRunSha256: options.inputRunSha256,
    validateStaticWitness: assertCompiledWitnessSchema
  });
  const records = [...base.files.entries()].map(([path, contents]) =>
    fileRecord(
      path,
      path.endsWith(".test.mjs") ? "red_regression_test" : "json_artifact",
      contents
    )
  );
  return buildWitnessBundleManifest({
    bundle: base,
    records,
    validateManifest: assertWitnessBundleManifestSchema
  });
}
