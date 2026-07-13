# WitnessPatch repository guidance

## Product contract

WitnessPatch is offline-first developer safety tooling for synthetic healthcare-agent traces. It is not clinical decision support, a patient-facing product, a diagnostic system, or proof of clinical efficacy.

The public UI may state only claims reproducible from the V2 artifacts under `public/runs/v2/`. Never claim physician, institutional, HIPAA, regulatory, clinical, or real-world workflow validation unless the user supplies documented evidence and explicitly approves the bounded wording.

## Non-negotiable safeguards

- No real patient data, charts, messages, identifiers, or protected health information.
- No paid API, API key, or secret is required for deterministic build, verification, or judge replay.
- Do not purchase Codex credits or enable automatic top-ups. Optional model work may use available ChatGPT/Codex-plan allowance only.
- Never expose the local Codex CLI or ChatGPT login through the deployed app.
- Keep models out of final grading. Models may author, generate, or criticize; deterministic software decides.
- Preserve timeline locks. A decision may cite only facts revealed at or before its step.
- Each action invariant must declare a source ID that resolves to an official public URL. The engine checks linkage, not semantic support.
- Keep physician validation `pending` until a real, documented licensed review exists.
- Do not describe the exact-fact negative control as a benign patient, proof that illness is absent, or proof that care may be deferred.
- Do not say the grader inferred a blood-pressure threshold. V2 consumes fixture-supplied classifications at exactly `118/74` and `168/112`; all middle, borderline, discordant, and repeat-reading behavior is outside scope.

## Version and provenance boundary

- V1 is immutable pre-start lineage: its original 16-file bundle, 13 checks, and captured Sol candidate are not Build Week work.
- V2 is the post-start namespace under `cases/v2/`, `engine/fixtures/v2/`, `targets/demo-agent/v2/`, and `public/runs/v2/`.
- The unchanged V1 Sol candidate is deliberately rejected under V2 (`85/100` urgent; exact control not executable). Never relabel it as the V2 repair.
- The retained, inspectable reference repair remains the source of the primary `50 → 100` transition. A distinct fresh post-start candidate is hash-listed, quarantined, not installed, and separately validated through browser-safe JSON-IR interpretation and Node execution. Never conflate the two.
- The fresh receipt records a CLI request for `gpt-5.6-sol` / `ultra`; it is not independent served-model identity attestation. Its empty credential-scrub list means no matching variables were present to remove.
- Preserve the before/after ledger in `docs/BUILD_WEEK_PROVENANCE.md`. Do not imply the whole project began after the official submission start.

## Source of truth

- `cases/v2/`: post-start synthetic timelines, evidence, action vocabulary, and invariants.
- `engine/fixtures/v2/`: V2 baseline, repaired, negative-control, and holdout inputs.
- `targets/demo-agent/v2/`: executable baseline, repaired, and always-escalate policies plus exact diff.
- `engine/grading-kernel.mjs`: deterministic browser-safe grading semantics.
- `engine/browser-verifier.mjs`: same-build byte, fingerprint, regrade, and holdout verification.
- `engine/compile-witness.mjs`: portable static recorded-decision witness and red-regression compiler.
- `public/runs/v2/manifest.json`: 23-file exact-byte SHA-256 manifest covering reference proof, fresh candidate evidence, and V1 lineage.
- `public/runs/v2/`: generated V2 artifacts. Rebuild them; never hand-edit them.
- `public/runs/manifest.json`: immutable pre-start V1 lineage.

## Required verification

Run these after any V2 case, invariant, engine, fixture, target, or artifact change:

```sh
npm run artifacts:v2:build
npm run artifacts:v2:verify
npm run test:core
npm run lint
npm run typecheck
npm run build
```

The V2 reference must remain internally consistent:

- urgent baseline `50/100`, repaired `100/100`, critical baseline failures `INV-02` and `INV-03`;
- exact-fact negative control `100/100`, always-escalate mutant `25/100`;
- `23/23` manifest files hash exactly; the reference `2/2` fresh regrades and `4/4` holdouts match;
- the 9→3 T+02 `INV-02` witness is recomputed with recorded decisions fixed;
- the fresh candidate remains quarantined/not installed; browser-safe JSON-IR interpretation and Node execution each match exact `2/2` case and `4/4` mutation signatures, and the browser never executes retained JavaScript;
- `npm run verify:release` passes `94/94` core tests, `4/4` rendered tests, build, lint, typecheck, and Wrangler dry run; `npm audit` reports zero known vulnerabilities at check time;
- bidirectional lexical checking catches urgent wording hidden behind non-urgent action labels;
- the numeric-inference contradiction marker fails even if a fixture-classification action label is present;
- real-browser verification keeps the baseline active on any error.

These are declared software assertions, not clinical validation or generalization evidence.

## Portable compiler boundary

```sh
node bin/witnesspatch.mjs compile --case PATH --run PATH --out-dir NEW_PATH
```

The compiler must freshly regrade the supplied run, select or explicitly name a failed action invariant, emit a red regression and exact-byte manifest atomically, and refuse existing or symlinked output paths. It invokes neither a model nor a target adapter. It holds recorded decisions fixed; its witness is not target-in-loop, counterfactual, or clinically minimal.

## Codex usage

Project defaults request `gpt-5.6-sol` with `ultra` reasoning. Optional local model work uses ChatGPT sign-in and must remove matching API/provider credential variables if present, recording the exact names found. Treat model and effort fields as requested configuration unless independently attested. Never present an unverified completion as a product result, automatically install a candidate, overwrite the retained reference, or alter V1 lineage.
