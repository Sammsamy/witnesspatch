# Submission draft

This draft is aligned to the published [OpenAI Build Week Official Rules](https://openai.devpost.com/rules). Repository visibility, license, teammate eligibility, `/feedback` session ID, public video, and final hosted URL still require completion before submission.

## Exact project overview fields

**Project name — 57/60 characters**

> WitnessPatch: Time-Fenced Contracts for Healthcare Agents

**Elevator pitch — 199/200 characters**

> Compile a synthetic, time-fenced healthcare-agent contract failure into a red Node test bundle; verify a retained patch and exact-fact control with fail-closed checks—no API key or real patient data.

**Category**

> Developer Tools. WitnessPatch is testing and release-gating infrastructure for teams building healthcare agents: it binds authored facts to reveal times and actions to deadlines, then outputs a red test bundle and deterministic verifier—not patient-facing advice or automated medical decisions.

## Inspiration

Healthcare-agent safety failures can end as screenshots or model-written critiques. Those do not preserve exactly what the agent knew, which authored contract failed, or whether a repair survives a nearby overreach control. I am a third-year medical student; that perspective motivated the problem, but it is not licensed clinical authority.

## Problem

During testing, a healthcare AI team may capture a contract-violating answer without preserving exactly what the agent knew, what behavior was expected, why, or whether the eventual repair still passes a nearby control. Screenshots and self-grading model summaries are weak release gates.

## Solution

WitnessPatch combines one compiled synthetic failure package with a separately retained repair and verifier into four inspectable artifacts:

1. the earliest critical failing prefix and a static recorded-decision contract witness;
2. a CI-ready red regression;
3. a separately authored, review-gated patch to the executable target policy; and
4. a deterministic verification receipt covering exact bytes, fresh regrades, and scoped software holdouts.

The retained V2 patch must fix the urgent fixture without changing the locked grader and preserve the exact authored negative-control behavior. The control does not establish a benign patient state or that real-world care may be deferred.

## Approach

1. Execute a target against facts revealed on a fixed synthetic timeline.
2. Regrade the recorded decisions with locked, source-ID-linked action contracts. Source linkage is checked mechanically; clinical meaning is not.
3. In the browser, hash and fully validate the exact synthetic case and failing run, freshly regrade them, and compile the earliest failed critical contract into an exportable nine-file red regression ZIP and static witness. The browser-generated files match the Node compiler byte for byte. The compiler holds recorded decisions fixed; it makes no target-in-loop, counterfactual, or clinical-minimality claim and invokes neither a model nor a target.
4. Apply a retained, inspectable V2 target-policy patch and execute four expected paths: urgent before, urgent after, exact-fact negative control, and always-escalate mutation.
5. In the browser, verify `23/23` exact hashes, recompute the reference repair's `2/2` regrades and `4/4` holdouts, and separately interpret the fresh candidate's declarative JSON IR across `2/2` cases and `4/4` mutation holdouts before displaying the repaired score. Retained JavaScript is not executed in the browser.

## Built with

Use these `22/25` tags:

`Codex`, `GPT-5.6 Sol`, `Node.js`, `JavaScript`, `TypeScript`, `React`, `Next.js`, `Vite`, `Vinext`, `Tailwind CSS`, `Cloudflare Workers`, `Wrangler`, `Ajv`, `JSON Schema`, `Web Crypto API`, `node:test`, `GitHub Actions`, `AI Safety`, `Agent Evaluation`, `Regression Testing`, `Synthetic Data`, `Healthcare AI`

Do not add `OpenAI API`; the product does not use it.

## What is different

Failure-to-regression workflows are established: Trajectly, ORP, Braintrust, Promptfoo, and AgentRx cover substantial parts of replay, contracts, diagnosis, datasets, or CI. WitnessPatch does not claim those primitives. Its narrower demonstrated composition is the final portable artifact handoff and closure below.

- **Time-locked facts:** the grader checks which authored facts were visible at every decision.
- **Standalone handoff:** a known failure plus an authored action contract becomes a conventional nine-file `node:test` package rather than only a platform dataset row or dashboard result.
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
- Local release verification: submission-package checkpoint `b4c8217` passed `npm ci` and `npm run verify:release` from a fresh local clone on Node 24.14.0: `104/104` core tests, `5/5` rendered-product tests, a `1/1` real development-server HTTP smoke, `4/4` submission-package checks, build, lint, typecheck, the 624-package/15-static-package license gate, byte-identical deployed notices, and a 59-file Wrangler dry run; npm reported zero known vulnerabilities at install time.
- Final real-Chrome QA: visible `50 → compile nine-file RED bundle → 100`, `2/2` compiler inputs, `23/23` retained artifacts, reference `2/2` plus `4/4`, fresh IR `2/2` plus `4/4`, all artifact requests HTTP 200, and zero console errors or warnings.
- Bidirectional message/action checking rejects urgent wording hidden behind safe labels.
- A numeric-inference contradiction marker fails even when the supplied-classification action label is present.

This is strong implementation evidence for one synthetic software oracle, not evidence of clinical correctness, patient outcomes, or generalization.

## Build Week before/after disclosure

WitnessPatch began as a pre-existing local V1 prototype. Its original evaluator, static UI, 16-file artifact bundle, 13 checks, and captured Sol candidate predate the official July 13 submission start and are not claimed as Build Week work. The portable compiler, fail-closed browser verifier, clinically narrower V2 namespace, and fresh post-start candidate proof are the meaningful extensions. Timestamped Codex records, the before/after ledger, separate V1/V2 manifests, and first dated checkpoint `21405c8` preserve that distinction locally. Because the root commit contains both disclosed lineage and extensions, it is a checkpoint rather than independent proof of every file's creation time.

## Team

The currently registered creator is a third-year medical student. That training motivates the problem choice but is not licensed clinical authority. Do not describe the brother as a teammate until he has registered, joined the Devpost draft, accepted the rules, and contributed.

## Safety and validation status

WitnessPatch is developer safety tooling, not clinical decision support. It uses no real patient data. The V2 rules link to public CDC, AIM, and ACOG guidance, but source-ID linkage is not semantic validation. Licensed-physician review and a health-AI builder workflow interview are both pending. The project does not certify safety, diagnose, recommend treatment, or replace organizational clinical governance.

## Judge testing instructions

No account, API key, payment, database, or model call is required.

### Fast live test

1. Open the submitted **Try it** URL in desktop Chrome.
2. Select **Compile failure**.
3. Confirm `2/2 exact inputs`, `BASELINE RED`, nine generated files, `INV-02` at T+02, and the `9 → 3` recorded-decision witness. The baseline remains `50/100`.
4. Optionally select **Export complete 9-file ZIP**.
5. Select **Verify retained repair**.
6. Confirm `23/23` exact retained artifacts, reference `2/2` regrades plus `4/4` holdouts, and fresh-candidate JSON-IR `2/2` regrades plus `4/4` mutation checks.
7. The final display should show `100/100` and `baseline RED · retained repair PASS`. The compiled baseline regression intentionally remains red; the separate retained repair passes.

### Local verification

Requires Node.js `22.15` or newer:

```bash
npm ci
npm run verify:release
npm run dev
```

Open `http://localhost:3000`. The local release path and hydrated browser flow are verified on macOS. Treat Linux as verified only after the linked public GitHub Actions check is green. Windows is not tested.

## Form placeholders that must remain blank until real

- **Try it URL:** pending public static deployment.
- **Repository URL:** pending private repository creation and judge sharing.
- **Video URL:** pending public founder-voice YouTube upload shorter than three minutes.
- **`/feedback` Session ID:** pending. In this primary task, open `/feedback`, share the existing session, submit, and use the returned Session ID—not the technical task/thread UUID.
- **External validation language:** keep pending until participant-confirmed evidence exists.
