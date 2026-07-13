# Submission draft

This draft is aligned to the published [OpenAI Build Week Official Rules](https://openai.devpost.com/rules). Repository visibility, license, teammate eligibility, `/feedback` session ID, public video, and final hosted URL still require completion before submission.

## One-line description

WitnessPatch compiles one fully synthetic, time-fenced healthcare-agent contract violation into a CI-ready regression, then verifies a review-gated policy patch against the unchanged urgent fixture and a scoped over-escalation control.

## Short description

A screenshot of a healthcare-agent test failure does not preserve what the agent knew, what contract it violated, or whether a repair survives a nearby control. WitnessPatch compiles one fully synthetic, time-locked contract violation into a CI-ready regression and deterministic evidence receipt, then verifies an inspectable, review-gated policy patch against the unchanged urgent fixture and a scoped over-escalation control. Codex configured to request GPT-5.6 Sol with Ultra reasoning assists implementation, adversarial testing, and repair exploration; locked deterministic code—not another model—owns every verdict.

## Problem

During testing, a healthcare AI team may capture a contract-violating answer without preserving exactly what the agent knew, what behavior was expected, why, or whether the eventual repair still passes a nearby control. Screenshots and self-grading model summaries are weak release gates.

## Solution

WitnessPatch converts one discovered synthetic failure into four inspectable outputs:

1. the earliest critical failing prefix and a static recorded-decision contract witness;
2. a CI-ready red regression;
3. a review-gated patch to the executable target policy; and
4. a deterministic receipt covering exact bytes, fresh regrades, and scoped software holdouts.

The retained V2 patch must fix the urgent fixture without changing the locked grader and preserve the exact authored negative-control behavior. The control does not establish a benign patient state or that real-world care may be deferred.

## Approach

1. Execute a target against facts revealed on a fixed synthetic timeline.
2. Regrade the recorded decisions with locked, source-ID-linked action contracts. Source linkage is checked mechanically; clinical meaning is not.
3. In the browser, hash and fully validate the exact synthetic case and failing run, freshly regrade them, and compile the earliest failed critical contract into an exportable nine-file red regression ZIP and static witness. The browser-generated files match the Node compiler byte for byte. The compiler holds recorded decisions fixed; it makes no target-in-loop, counterfactual, or clinical-minimality claim and invokes neither a model nor a target.
4. Apply a retained, inspectable V2 target-policy patch and execute four expected paths: urgent before, urgent after, exact-fact negative control, and always-escalate mutation.
5. In the browser, verify `23/23` exact hashes, recompute the reference repair's `2/2` regrades and `4/4` holdouts, and separately interpret the fresh candidate's declarative JSON IR across `2/2` cases and `4/4` mutation holdouts before displaying the repaired score. Retained JavaScript is not executed in the browser.

## What is different

- **Time-locked facts:** the grader checks which authored facts were visible at every decision.
- **Independent verdict:** GPT-5.6 helps build and author; it cannot edit the runtime grader, artifact hashes, or expected holdouts.
- **Executable closure:** judges can inspect a real target diff and regression, not only a risk score or generated critique.
- **Fail-closed browser proof:** tampering, truncation, redirects, unsafe paths, evaluation drift, holdout drift, or missing WebCrypto keep the failing baseline active.
- **Scoped overreach control:** an exact complete fact set rejects one always-escalate mutation. It is intentionally not labeled clinically benign.
- **No API dependency for judging:** replay and deterministic verification need no API key, billing, model call, database, or server secret.
- **Visible clinical boundary:** blood-pressure classifications are fixture-supplied only at `118/74` and `168/112`; no numeric threshold, middle, borderline, discordant, or repeat-reading behavior is inferred or tested.

## OpenAI technology

The default Codex workflow is configured to request GPT-5.6 Sol with Ultra reasoning and was used for post-start implementation, adversarial tests, claim audits, and V2 fixture/repair authoring. Codex accelerated the portable compiler, browser-safe grading kernel, attack tests, and V2 compatibility audit; deterministic code owns every public pass/fail result.

The unchanged pre-start V1 Sol policy candidate is preserved as lineage and deliberately tested against V2. It fails the urgent V2 contract at `85/100` and has no executable branch for the exact-fact negative control, so it is rejected and not relabeled as current model evidence.

A fresh post-start Codex CLI run requested `gpt-5.6-sol` with `ultra` reasoning; the retained local receipt records ChatGPT-plan authentication. The run received the baseline and two authored contracts, not the four-check holdout definition or checked-in repair. Fixed code compiled its schema-constrained JSON proposal into a distinct candidate; the candidate remains quarantined and was not installed. Browser-safe IR interpretation and Node execution both match the exact two-case and four-holdout software signature. The receipt records the requested configuration and retained local workflow, not independent served-model identity or clinical validity. Its empty credential-scrub list means no matching variables were present to remove.

The retained reference repair remains separate from the fresh candidate. Deterministic software, not either policy or a model, owns the verdict.

## Current V2 proof

- Urgent baseline: `50/100`, with critical failures `INV-02` and `INV-03`.
- Urgent retained repair: `100/100`.
- Exact-fact negative control under the repaired policy: `100/100`.
- Always-escalate mutation on that exact control: `25/100`, expected failure.
- Live browser compilation: `2/2` exact synthetic input hashes, full case/run validation, an exportable nine-file red ZIP for `INV-02` at T+02, and the same exact file bytes as the Node compiler. The exported default regression exits red; pointing it at the supplied repaired run exits green.
- V2 artifact manifest: `23/23` exact hashes against the same-build manifest; this is integrity, not a publisher signature.
- Reference browser recomputation: `2/2` fresh regrades and `4/4` V2 holdouts.
- Fresh post-start candidate: `validated_candidate`, quarantined, not installed; browser-safe JSON-IR interpretation and Node execution each match `2/2` case and `4/4` holdout signatures.
- Static witness: the encoded `INV-02` predicate is reduced from 9 T+02 facts to 3 with recorded decisions held fixed.
- Local release verification: release-code checkpoint `9f2cd8d` passed `npm ci` and `npm run verify:release` from a fresh local clone on Node 24.14.0: `104/104` core tests, `5/5` rendered-product tests, a `1/1` real development-server HTTP smoke, build, lint, typecheck, the 624-package/15-static-package license gate, byte-identical deployed notices, and a 59-file Wrangler dry run; npm reported zero known vulnerabilities at install time.
- Final real-Chrome QA: visible `50 → compile nine-file RED bundle → 100`, `2/2` compiler inputs, `23/23` retained artifacts, reference `2/2` plus `4/4`, fresh IR `2/2` plus `4/4`, all artifact requests HTTP 200, and zero console errors or warnings.
- Bidirectional message/action checking rejects urgent wording hidden behind safe labels.
- A numeric-inference contradiction marker fails even when the supplied-classification action label is present.

This is strong implementation evidence for one synthetic software oracle, not evidence of clinical correctness, patient outcomes, or generalization.

## Build Week before/after disclosure

WitnessPatch began as a pre-existing local V1 prototype. Its original evaluator, static UI, 16-file artifact bundle, 13 checks, and captured Sol candidate predate the official July 13 submission start and are not claimed as Build Week work. The portable compiler, fail-closed browser verifier, clinically narrower V2 namespace, and fresh post-start candidate proof are the meaningful extensions. Timestamped Codex records, the before/after ledger, separate V1/V2 manifests, and first dated checkpoint `21405c8` preserve that distinction locally. Because the root commit contains both disclosed lineage and extensions, it is a checkpoint rather than independent proof of every file's creation time.

## Team

We are two brothers; one is a third-year medical student. That training motivates the problem choice but is not licensed clinical authority. The product preserves team-authored behavior in executable software while making independent expert review explicit.

## Safety and validation status

WitnessPatch is developer safety tooling, not clinical decision support. It uses no real patient data. The V2 rules link to public CDC, AIM, and ACOG guidance, but source-ID linkage is not semantic validation. Licensed-physician review and a health-AI builder workflow interview are both pending. The project does not certify safety, diagnose, recommend treatment, or replace organizational clinical governance.
