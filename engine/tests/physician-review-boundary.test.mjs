import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

async function readText(path) {
  return readFile(join(rootDir, path), "utf8");
}

async function readJson(path) {
  return JSON.parse(await readText(path));
}

test("canonical clinical scope separates fixture review from clinical validation", async () => {
  const [scope, manifest] = await Promise.all([
    readJson("public/runs/v2/clinical-scope.json"),
    readJson("public/runs/v2/manifest.json")
  ]);

  assert.equal(scope.status, "source_linked_fixture_wording_review_not_performed");
  assert.equal(scope.verification_boundary.fixture_wording_review, "not_performed");
  assert.equal(scope.verification_boundary.clinical_validation, "not_claimed");
  assert.equal(
    scope.verification_boundary.legacy_artifact_field,
    "clinician_validation=pending is retained solely as a legacy per-artifact field for schema and provenance compatibility; no physician review was performed, and this field is not the canonical fixture-review or clinical-validation state"
  );
  assert.equal("physician_validation" in scope.verification_boundary, false);

  assert.equal(manifest.clinical_scope.fixture_wording_review, "not_performed");
  assert.equal(manifest.clinical_scope.clinical_validation, "not_claimed");
  assert.equal("physician_validation" in manifest.clinical_scope, false);
});

test("visible product labels keep clinical conclusions inside the reviewed copy", async () => {
  const source = await readText("app/components/witnesspatch-lab.tsx");

  for (const phrase of [
    "Synthetic maternal fixture",
    "7 fixed case rules",
    "Postpartum warning-sign fixture",
    "Required action missed at T+02",
    "The recorded run says to wait for a later blood pressure reading",
    "FIXED CASE RULES",
    "What each run must do",
    "These rules are part of the synthetic case",
    "source links have not been reviewed by a physician",
    "Physician review of fixture wording",
    "fixture_wording_review",
    "clinical_validation"
  ]) {
    assert.match(source, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), "u"));
  }

  for (const oldPhrase of [
    "Selected crash suite: Maternal care",
    "Urgent escalation",
    "two independent urgent-action rules already trigger",
    "SAFETY CONTRACT",
    "7 locked evaluation contracts",
    "The trace says to wait for a later blood pressure reading",
    "EVALUATION CONTRACT",
    "Locked lexical witnesses",
    "Clinical triggers are source-linked",
    "<dt>Safety rules</dt>",
    "verification_boundary.physician_validation"
  ]) {
    assert.doesNotMatch(source, new RegExp(oldPhrase.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), "u"));
  }
});

test("physician packet source enforces staged handoffs and conservative closeout", async () => {
  const [generator, instructions, facilitatorPacket, requirements] = await Promise.all([
    readText("build/generate-physician-review-packet.py"),
    readText("docs/PHYSICIAN_REVIEW_PACKET.md"),
    readText("docs/EXTERNAL_REVIEW_PACKET.md"),
    readText("build/requirements-physician-pdf.txt")
  ]);

  for (const phrase of [
    "witnesspatch-physician-first-look.pdf",
    "witnesspatch-physician-revealed-review.pdf",
    "COMPLETE AND RETURN PRIVATELY",
    "O = opened, U = unavailable, X = outside reviewer scope",
    "Any current R, O, or U on Items 1-9 keeps review pending",
    "A deidentified public summary still requires separate private confirmation",
    "WitnessPatch - fixture/wording review pending - clinical validation not claimed",
    "validate_pdf_outputs"
  ]) {
    assert.match(generator, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), "u"));
  }

  assert.match(instructions, /participant-completed first-look and revealed-review PDFs together are the authoritative participant record/u);
  assert.match(instructions, /confirm that exact summary by a private reply or signature/u);
  assert.match(instructions, /any `revise`, `outside reviewer scope`, or `unresolved` disposition/u);
  assert.match(facilitatorPacket, /witnesspatch-physician-first-look\.pdf/u);
  assert.match(facilitatorPacket, /witnesspatch-physician-revealed-review\.pdf/u);
  assert.match(facilitatorPacket, /participant-completed first-look and revealed-review PDFs together are the authoritative participant record/u);
  assert.match(requirements, /^pypdf==6\.10\.2$/mu);
  assert.doesNotMatch(generator, /physician validation not claimed/u);
});
