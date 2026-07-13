# Codex and GPT-5.6 provenance

This record separates the pre-start V1 model artifact from post-start V2 Build Week work. It contains no credential, session token, patient data, or hidden reasoning.

## Post-start V2 contribution

The Codex working configuration used after the official July 13, 2026 start requests GPT-5.6 Sol with Ultra reasoning to implement and audit:

- the portable, model-free static witness compiler and schemas;
- browser-safe grading and holdout kernels;
- a fail-closed browser verifier with byte, path, regrade, and holdout attack tests;
- the clinically narrower V2 case/control namespace and fixture-supplied classification boundary;
- bidirectional lexical message/action checks and the numeric-inference contradiction marker;
- V1-under-V2 compatibility evaluation and honest rejection; and
- submission, rules, clinical-claim, and judge-facing audits.

The deterministic V2 reference repair was authored and reviewed within this workflow, then executed by fixed local code. It is not presented as a standalone live Sol policy completion. The browser's current pass means the retained V2 bytes and declared software expectations recompute correctly; it does not mean a model certified itself.

## Fresh post-start V2 candidate

A separate Codex CLI run started at `2026-07-13T17:49:55.322Z` and produced its receipt at `2026-07-13T17:51:40.867Z`, after the submission-period cutoff. The retained receipt records:

- requested model/reasoning: `gpt-5.6-sol` / `ultra`;
- authentication: confirmed ChatGPT-plan login; API key not required;
- execution: ephemeral, read-only, isolated working directory, ignored user configuration/rules, and model tools disabled;
- supplied inputs: baseline policy plus the urgent and exact-control contracts;
- withheld inputs: the four-check holdout definition and checked-in repaired policy;
- output: schema-constrained declarative JSON compiled by fixed code into a distinct candidate;
- state: `validated_candidate`, quarantined, and `automatically_installed: false`; and
- deterministic result: urgent `100/100`, exact control `100/100`, and `4/4` exact software-holdout signatures.

The raw receipt is retained as `public/runs/v2/sol-v2-receipt.json`; the proposal, reconstructed prompt, exact inputs, output schema, compiled candidate, and patch are separately hash-listed in the 23-artifact V2 manifest. The receipt's `requested_model` field is evidence of the requested CLI configuration, not independent attestation of served-model identity. Its `credential_environment_scrubbed: []` field means no matching credential variables were present to remove in that process environment; it does not mean active secrets were found and scrubbed.

The browser validates exact bytes and links, reconstructs the prompt/compiler relationship, and safely interprets the retained JSON IR across `2/2` cases and `4/4` mutation holdouts without executing the retained JavaScript. The Node verifier executes the quarantined candidate and checks the same exact signature. The fresh candidate is not the retained reference repair, is not installed, and is not clinical or generalization evidence.

The official submission also requires the Codex Session ID surfaced through `/feedback` for the task where most core functionality was built. That identifier has not yet been captured in this record. Do not substitute a task/thread ID without invoking `/feedback` and preserving the displayed session identifier.

## Current V2 deterministic receipt

`npm run artifacts:v2:verify` checks the post-start bundle and currently establishes:

- `23/23` exact file hashes against the same-build manifest;
- `2/2` fresh deterministic regrades;
- `4/4` V2 holdout expectation matches;
- a `9 → 3` static `INV-02` witness over facts revealed through T+02, with recorded decisions fixed;
- urgent baseline `50/100` and retained repair `100/100`;
- exact-fact negative control `100/100` and always-escalate mutant `25/100`;
- exact target-policy diff matching the executable sources; and
- unchanged V1 Sol candidate rejected under V2; and
- fresh post-start JSON proposal and compiled candidate matching the exact two-case/four-holdout signature under browser-safe interpretation and Node execution.

The four V2 holdouts cover the repaired path, consumption of the fixture-supplied severe-range classification, future fixture-classification leakage, and numeric-inference contradiction copy. Separate engine coverage checks the message-marker/action-label bypass. The fresh model run did not receive the holdout definition, but these remain four scoped mutations of the authored software oracle—not held-out clinical evidence or proof of generalization.

The finalized local release check passes `npm run verify:release` with `94/94` core tests, `4/4` rendered-product tests, build, lint, typecheck, and the Wrangler dry run. `npm audit` reported zero known vulnerabilities at check time. Final real-Chrome QA passed the complete 23-artifact profile with zero console warnings or errors. These results were exercised on macOS; they do not establish Linux or Windows support.

## Pre-start V1 lineage — not Build Week work

Before the official submission start, V1 already included a ChatGPT-authenticated Codex policy-repair run requested as `gpt-5.6-sol` with `ultra` reasoning. The runner scrubbed API-key, organization, project, endpoint, and alternate-provider credential variables; accepted schema-constrained branch data rather than arbitrary JavaScript; compiled it with fixed code; and did not automatically install it.

Historical V1 record:

- Executed: July 13, 2026, `07:11:04Z`–`07:12:57Z`.
- Requested model/reasoning: `gpt-5.6-sol` / `ultra`.
- Authentication: ChatGPT subscription login; API credential environment scrubbed.
- V1 receipt: `validated_candidate` for the original V1 urgent and normal-BP fixtures.
- V1 artifact bundle: 16 files and 13 declared checks.
- Fixed-compiler candidate SHA-256: `decf62dec0c81bb6fb0bf186216b386ec1bb2d2c8ec9533fa4327930e7eaec53`.
- Automatic installation: `false`.

The historical receipt measured one `113.770`-second system-wall-clock interval from already-authored V1 fixtures to a V1 validated candidate, with preexisting authentication and unknown cache state. It is preserved only as lineage. It is not a Build Week speed claim, benchmark, time-saved result, incident-to-regression measurement, or evidence about V2.

## V1 compatibility result under V2

V2 retains the old candidate unchanged and tests it without granting new-model provenance:

- urgent V2: `85/100`, failed `INV-04`;
- exact-fact negative control: `not_executable` because the V1 branch vocabulary does not match V2 fact IDs;
- accepted as V2 repair: `false`;
- candidate modified for V2: `false`.

This negative result is important: old passing evidence is not portable across a changed contract. The V1 artifact remains valid only for its original V1 fixture and is not relabeled as a V2 completion.

## Authentication and execution boundary

The judge-facing app and all deterministic verification need no model, API key, or request-time model call. Optional fresh model work must:

1. require ChatGPT sign-in;
2. remove API-key and alternate-provider credential variables if present and record the exact names found;
3. record the exact requested model and reasoning effort;
4. constrain the completion to reviewable data rather than arbitrary source;
5. evaluate the candidate against both unchanged V2 authored fixtures and post-capture holdouts;
6. retain raw/normalized hashes and an exact patch; and
7. keep automatic installation disabled.

Model output remains untrusted until deterministic V2 evaluation passes and a human reviews the patch. Hidden reasoning is neither required nor retained.

## Reproduce the current local proof

```bash
npm ci
npm run artifacts:v2:verify
npm run test:core
npm run build
```

The legacy `npm run codex:repair` path and artifacts belong to V1 and must not be used as V2 evidence. The fresh V2-specific path is `npm run codex:repair:v2`; it writes a new quarantined output directory and never installs the candidate automatically. Re-running it creates new evidence and must not overwrite or relabel the retained capture.
