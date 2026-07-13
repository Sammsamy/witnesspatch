import {
  buildWitnessBundleBase,
  buildWitnessBundleManifest,
  normalizeWitnessRunInput,
  selectFailedActionInvariant
} from "./compile-witness-core.mjs";
import { gradeRunKernel } from "./grading-kernel.mjs";
import {
  assertCaseInput,
  assertRunInputAgainstFingerprint
} from "./input-validation.mjs";
import {
  assertCompiledWitnessSchema,
  assertRunSchema,
  assertWitnessBundleManifestSchema
} from "./schema-validator.mjs";

const SAFE_RUN_PATH =
  /^\/runs\/(?:[A-Za-z0-9][A-Za-z0-9._-]*\/)*[A-Za-z0-9][A-Za-z0-9._-]*$/u;
const SHA256_HEX = /^[a-f0-9]{64}$/u;
const REQUIRED_INPUT_IDS = Object.freeze(["case", "baseline"]);

const isObject = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

function requireValue(condition, message) {
  if (!condition) {
    throw new Error(`Browser compilation failed: ${message}`);
  }
}

function stableStringify(value) {
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

function bytesToHex(bytes) {
  return [...bytes]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Bytes(bytes, subtle) {
  const digest = await subtle.digest("SHA-256", bytes);
  return bytesToHex(new Uint8Array(digest));
}

async function sha256Text(value, subtle) {
  return sha256Bytes(new TextEncoder().encode(value), subtle);
}

function parseJsonArtifact(bytes, id) {
  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error(`Browser compilation failed: ${id} is not valid UTF-8.`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Browser compilation failed: ${id} is not valid JSON.`);
  }
}

function inputRecords(manifest, baseUrl) {
  requireValue(isObject(manifest), "the embedded manifest is not an object.");
  requireValue(manifest.schema_version === "1.0.0", "unsupported manifest schema.");
  requireValue(manifest.algorithm === "sha256", "manifest algorithm must be sha256.");
  requireValue(
    manifest.release_profile === "witnesspatch-v2-release",
    "the live compiler requires the exact V2 release profile."
  );
  requireValue(
    typeof manifest.case_fingerprint === "string" &&
      SHA256_HEX.test(manifest.case_fingerprint),
    "manifest case fingerprint is invalid."
  );
  requireValue(Array.isArray(manifest.files), "manifest files are missing.");

  let origin;
  try {
    origin = new URL(baseUrl);
  } catch {
    throw new Error("Browser compilation failed: base URL is invalid.");
  }
  requireValue(
    origin.protocol === "https:" || origin.protocol === "http:",
    "base URL must use http or https."
  );

  const byId = new Map();
  for (const record of manifest.files) {
    if (!REQUIRED_INPUT_IDS.includes(record?.id)) continue;
    requireValue(!byId.has(record.id), `duplicate artifact id ${record.id}.`);
    requireValue(
      typeof record.path === "string" && SAFE_RUN_PATH.test(record.path),
      `unsafe runs path for ${record.id}.`
    );
    requireValue(
      typeof record.sha256 === "string" && SHA256_HEX.test(record.sha256),
      `invalid sha256 for ${record.id}.`
    );
    requireValue(
      Number.isSafeInteger(record.bytes) && record.bytes > 0,
      `invalid byte count for ${record.id}.`
    );
    const url = new URL(record.path, origin);
    requireValue(
      url.origin === origin.origin &&
        url.pathname === record.path &&
        url.search === "" &&
        url.hash === "",
      `artifact ${record.id} is not a safe same-origin runs path.`
    );
    byId.set(record.id, { record, url });
  }
  for (const id of REQUIRED_INPUT_IDS) {
    requireValue(byId.has(id), `required compiler input ${id} is missing.`);
  }
  return byId;
}

async function fetchExactInput({ id, record, url }, fetchImpl, subtle) {
  const response = await fetchImpl(url.href, {
    cache: "no-store",
    credentials: "omit",
    redirect: "error"
  });
  requireValue(response?.ok === true, `${id} returned a non-success response.`);
  requireValue(response.redirected !== true, `${id} redirected.`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  requireValue(bytes.byteLength === record.bytes, `${id} byte count drifted.`);
  const digest = await sha256Bytes(bytes, subtle);
  requireValue(digest === record.sha256, `${id} hash drifted.`);
  return { bytes, digest, value: parseJsonArtifact(bytes, id) };
}

function assertSyntheticInputs(caseData, baselineArtifact, manifest) {
  assertCaseInput(caseData);
  requireValue(
    isObject(caseData) &&
      caseData.id === manifest.case_id &&
      caseData.status === "synthetic_source_linked_physician_validation_pending" &&
      caseData.provenance?.contains_real_patient_data === false &&
      caseData.provenance?.clinician_validation === "pending",
    "the case does not preserve the synthetic, physician-review-pending boundary."
  );
  requireValue(
    Array.isArray(caseData.timeline) &&
      Array.isArray(caseData.rules) &&
      Array.isArray(caseData.controls),
    "the case is missing its time-locked contract structure."
  );
  requireValue(
    isObject(baselineArtifact) &&
      baselineArtifact.case_id === caseData.id &&
      baselineArtifact.variant === "baseline" &&
      baselineArtifact.provenance_verification ===
        "hash_listed_by_external_manifest" &&
      baselineArtifact.provenance?.contains_real_patient_data === false &&
      baselineArtifact.provenance?.clinician_validation === "pending" &&
      !Object.hasOwn(baselineArtifact, "repair"),
    "the baseline does not preserve the synthetic unreviewed baseline boundary."
  );
}

function buildAuditLog(caseData, normalizedRun, evaluation) {
  const events = [
    {
      sequence: 1,
      event: "case.loaded",
      detail: `${caseData.id} loaded as a synthetic time-locked fixture.`
    },
    ...normalizedRun.decisions.map((decision, index) => ({
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
  events.push({
    sequence: events.length + 1,
    event: "run.completed",
    status: evaluation.status,
    score: evaluation.score,
    artifact_hash_scope: "unmanifested"
  });
  return events;
}

function assertStaticWitnessBoundary(witness) {
  assertCompiledWitnessSchema(witness);
  requireValue(
    witness.target_rerun === false &&
      witness.target_adapter_invoked === false &&
      witness.clinical_minimality_claimed === false &&
      witness.semantic_correctness_claimed === false &&
      witness.counterfactual_target_behavior_claimed === false &&
      witness.provenance?.contains_real_patient_data === false &&
      witness.provenance?.clinician_validation === "pending" &&
      witness.provenance?.api_key_required === false &&
      witness.verification?.target_reexecuted_per_subset === false,
    "the compiled witness crossed its static software-only claim boundary."
  );
  return witness;
}

function assertCompiledManifestBoundary(manifest) {
  assertWitnessBundleManifestSchema(manifest);
  requireValue(
    manifest.kind === "witness_bundle_manifest" &&
      Array.isArray(manifest.files) &&
      manifest.files.length === 8 &&
      new Set(manifest.files.map((record) => record.path)).size === 8,
    "the compiled bundle manifest is incomplete or ambiguous."
  );
  return manifest;
}

export async function compileBrowserWitness({
  manifest,
  fetchImpl,
  subtle,
  baseUrl,
  targetRuleId = undefined
}) {
  requireValue(typeof fetchImpl === "function", "fetch is unavailable.");
  requireValue(subtle && typeof subtle.digest === "function", "WebCrypto is unavailable.");
  const records = inputRecords(manifest, baseUrl);
  const [caseInput, runInput] = await Promise.all(
    REQUIRED_INPUT_IDS.map((id) =>
      fetchExactInput({ id, ...records.get(id) }, fetchImpl, subtle)
    )
  );
  const caseData = caseInput.value;
  const baselineArtifact = runInput.value;
  assertSyntheticInputs(caseData, baselineArtifact, manifest);

  const caseFingerprint = await sha256Text(stableStringify(caseData), subtle);
  requireValue(
    caseFingerprint === manifest.case_fingerprint &&
      baselineArtifact.case_sha256 === caseFingerprint,
    "the case fingerprint does not match the release profile."
  );
  assertRunSchema(baselineArtifact);
  assertRunInputAgainstFingerprint(
    caseData,
    baselineArtifact,
    caseFingerprint
  );
  const normalizedRun = normalizeWitnessRunInput(baselineArtifact);
  const evaluation = gradeRunKernel(caseData, normalizedRun);
  requireValue(
    stableStringify(evaluation) ===
      stableStringify(baselineArtifact.evaluation),
    "the retained baseline disagrees with a fresh deterministic grade."
  );
  requireValue(
    evaluation.status === "fail" &&
      evaluation.critical_failures.length > 0,
    "the retained baseline is not a compilable critical failure."
  );
  const evaluatedRun = {
    schema_version: "1.0.0",
    run_id: normalizedRun.run_id,
    case_id: caseData.id,
    case_sha256: caseFingerprint,
    variant: normalizedRun.variant,
    provenance_verification: "unverified_input_declaration",
    provenance: normalizedRun.provenance,
    decisions: normalizedRun.decisions,
    evaluation,
    audit_log: buildAuditLog(caseData, normalizedRun, evaluation)
  };
  assertRunSchema(evaluatedRun);
  const selectedTarget = selectFailedActionInvariant(
    caseData,
    evaluation,
    targetRuleId
  );
  const identityHash = (
    await sha256Text(
      stableStringify({
        case_sha256: caseFingerprint,
        run_id: evaluatedRun.run_id,
        target_rule_id: selectedTarget.id
      }),
      subtle
    )
  ).slice(0, 16);
  const base = buildWitnessBundleBase({
    caseData,
    normalizedRun,
    evaluatedRun,
    identityHash,
    targetRuleId,
    startingFactScope: "failure_prefix",
    inputCaseSha256: caseInput.digest,
    inputRunSha256: runInput.digest,
    validateStaticWitness: assertStaticWitnessBoundary
  });
  const fileRecords = await Promise.all(
    [...base.files.entries()].map(async ([path, contents]) => ({
      path,
      kind: path.endsWith(".test.mjs")
        ? "red_regression_test"
        : "json_artifact",
      sha256: await sha256Text(contents, subtle),
      bytes: new TextEncoder().encode(contents).byteLength
    }))
  );
  const bundle = buildWitnessBundleManifest({
    bundle: base,
    records: fileRecords,
    validateManifest: assertCompiledManifestBoundary
  });
  const manifestBytes = bundle.files.get("manifest.json");
  const manifestSha256 = await sha256Text(manifestBytes, subtle);

  return {
    status: "compiled_red",
    hashes: { verified: REQUIRED_INPUT_IDS.length, total: REQUIRED_INPUT_IDS.length },
    bundle_id: bundle.bundleId,
    target_rule_id: bundle.targetRuleId,
    file_count: bundle.files.size,
    manifest_sha256: manifestSha256,
    failure_known_at_minute: bundle.receipt.failure_known_at_minute,
    starting_fact_count: bundle.receipt.starting_fact_count,
    minimal_fact_count: bundle.receipt.minimal_fact_count,
    regression_initial_status: bundle.receipt.regression_initial_status,
    regression_source: bundle.files.get("regression.test.mjs"),
    receipt: bundle.receipt,
    files: [...bundle.files.entries()].map(([path, contents]) => ({
      path,
      contents
    })),
    trust_boundary:
      "The browser generated a static recorded-decision software witness from two manifest-bound synthetic inputs. It did not rerun a target, invoke a model, establish clinical correctness, or install a repair."
  };
}
