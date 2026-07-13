import { readFileSync } from "node:fs";

import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const caseSchema = JSON.parse(
  readFileSync(new URL("../contracts/case.schema.json", import.meta.url), "utf8")
);
const runSchema = JSON.parse(
  readFileSync(new URL("../contracts/run.schema.json", import.meta.url), "utf8")
);
const compiledWitnessSchema = JSON.parse(
  readFileSync(
    new URL("../contracts/compiled-witness.schema.json", import.meta.url),
    "utf8"
  )
);
const witnessBundleManifestSchema = JSON.parse(
  readFileSync(
    new URL(
      "../contracts/witness-bundle-manifest.schema.json",
      import.meta.url
    ),
    "utf8"
  )
);
const codexPolicyRepairV2Schema = JSON.parse(
  readFileSync(
    new URL(
      "../contracts/codex-policy-repair-v2.schema.json",
      import.meta.url
    ),
    "utf8"
  )
);
const ajv = new Ajv2020({
  allErrors: true,
  coerceTypes: false,
  strict: true,
  strictRequired: false,
  useDefaults: false
});
addFormats(ajv);
const validateCase = ajv.compile(caseSchema);
const validateRun = ajv.compile(runSchema);
const validateCompiledWitness = ajv.compile(compiledWitnessSchema);
const validateWitnessBundleManifest = ajv.compile(
  witnessBundleManifestSchema
);
const validateCodexPolicyRepairV2 = ajv.compile(codexPolicyRepairV2Schema);

function formatErrors(errors) {
  return errors
    .slice(0, 8)
    .map((error) => `${error.instancePath || "/"} ${error.message}`)
    .join("; ");
}

export function assertCaseSchema(caseData) {
  if (!validateCase(caseData)) {
    throw new Error(`Case schema validation failed: ${formatErrors(validateCase.errors ?? [])}`);
  }
  return caseData;
}

export function assertRunSchema(runData) {
  if (!validateRun(runData)) {
    throw new Error(`Run schema validation failed: ${formatErrors(validateRun.errors ?? [])}`);
  }
  return runData;
}

export function assertCompiledWitnessSchema(witness) {
  if (!validateCompiledWitness(witness)) {
    throw new Error(
      `Compiled witness schema validation failed: ${formatErrors(validateCompiledWitness.errors ?? [])}`
    );
  }
  return witness;
}

export function assertWitnessBundleManifestSchema(manifest) {
  if (!validateWitnessBundleManifest(manifest)) {
    throw new Error(
      `Witness bundle manifest schema validation failed: ${formatErrors(validateWitnessBundleManifest.errors ?? [])}`
    );
  }
  return manifest;
}

export function assertCodexPolicyRepairV2Schema(proposal) {
  if (!validateCodexPolicyRepairV2(proposal)) {
    throw new Error(
      `Codex V2 policy-repair schema validation failed: ${formatErrors(validateCodexPolicyRepairV2.errors ?? [])}`
    );
  }
  return proposal;
}
