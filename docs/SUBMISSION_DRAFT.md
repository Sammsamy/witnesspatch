# Submission draft

This file preserves the exact public project copy aligned to the published [OpenAI Build Week Official Rules](https://openai.devpost.com/rules). The entrant authorized an individual submission; the [public MIT repository](https://github.com/Sammsamy/witnesspatch), exact-commit CI, and [live static replay](https://witnesspatch.ankigpt.workers.dev) exist. External form state and private account workflow are intentionally not recorded here.

## Exact project overview fields

**Project name — 57/60 characters**

> WitnessPatch: Time-Fenced Contracts for Healthcare Agents

**Elevator pitch — 178/200 characters**

> Turn one synthetic missed deadline into a portable red test: freeze what the agent knew, check whether action happened on time, then verify any repair offline before trusting it.

**Category**

> Developer Tools. WitnessPatch is a portable red-test compiler for time-critical AI agents: it binds authored facts to reveal times and required actions to deadlines, then exports the observed miss as an offline `node:test` bundle—not patient-facing advice or an automated medical decision.

<!-- DEVPOST_STORY_START -->

## Inspiration

AI agents can give a reasonable answer and still act too late.

The intended user is Maya, a healthcare-agent evaluation engineer preparing an agent for release. In one fully synthetic postpartum test, the agent produces a plausible response but misses an authored action deadline at T+02. A more severe fact arrives at T+06, but that later information must not retroactively earn the agent credit—or change what the evaluator says the agent knew when the earlier deadline passed.

That gap is easy to lose. A screenshot captures an answer, but not the exact visible facts, locked rule, deadline, or executable evidence needed to prevent the same failure from returning. A model-written critique can describe a problem, but it can also become the judge of its own output.

I am a third-year medical student, which motivated the healthcare-agent setting. That background is not licensed clinical authority. I built WitnessPatch as developer tooling for one narrow job: turn an already-observed synthetic missed deadline into a portable regression before trusting any repair.

## Approach

WitnessPatch follows three steps:

1. **Freeze and regrade.** It records which authored facts were visible at each timestamp, holds the agent's recorded decisions fixed, and deterministically checks whether each required action occurred before its declared deadline.
2. **Compile the miss.** It selects the earliest failed critical contract and exports a conventional nine-file Node test package containing the failing prefix, static contract witness, original inputs, receipt, manifest, and red regression.
3. **Verify a separate repair.** It keeps the original regression visibly red while testing an inspectable, human-gated retained repair against the unchanged grader, the urgent case, an exact-fact negative control, and an intentionally bad always-escalate mutation.

Maya can use the one-click reference or open **Compile Your Files**, load the included declared-synthetic case and failed run, and compile locally. The browser validates and regrades the inputs before producing the same portable bundle format. The resulting receipt deliberately says `2 hashes computed · 0 externally verified`: a local hash establishes byte identity, not who published the input or whether its clinical meaning is correct.

## How I built it

I used Codex throughout Build Week to implement and adversarially test the portable compiler, browser-safe grading kernel, detached-bundle verifier, product flow, and release checks. Codex helped expose path traversal, stale-evaluation, schema-drift, truncation, and browser-tampering cases; deterministic code decides whether every test passes.

GPT-5.6 contributed through a separate post-start Codex workflow that requested GPT-5.6 Sol with Ultra reasoning. It received the baseline and two authored contracts and returned schema-constrained declarative repair data. Fixed code compiled that data into a distinct candidate and evaluated it against withheld software holdouts. The candidate remains quarantined and was never installed. Its receipt records the requested configuration; it does not independently prove which model was served.

This division is deliberate. GPT-5.6 helps propose bounded logic, while the locked grader, hashes, compiler, and expected holdouts remain outside the model's control. The public demo and command-line judge path run offline after loading the retained assets. They need no API key, paid API credit, request-time model call, database, account, or target rerun.

## Proof, not a green badge

The synthetic baseline scores 50/100 with two critical breaches. WitnessPatch compiles the earliest breach, INV-02 at T+02, into a regression that exits red on the baseline and green only when pointed at the supplied repaired run. The retained repair scores 100/100 with zero critical failures, while the baseline remains red beside it.

The browser then checks 23/23 retained artifact files, recomputes 2/2 reference grades, and executes 4/4 scoped holdouts. The exact-fact control still passes; the always-escalate mutant fails. That closure matters because a policy that labels everything urgent can appear to fix the original example while destroying nearby behavior.

## Challenges

The hardest problem was temporal leakage. An evaluator that can see T+06 can accidentally rewrite the verdict at T+02. The second challenge was making browser and CLI outputs reproducible while failing closed on changed, missing, extra, linked, or malformed files. The third was resisting a persuasive but overbroad repair.

## What I learned

I learned that hashes prove sameness, not truth or provenance, and that a green repaired example is weak evidence without a preserved red baseline and a nearby control. I also learned that healthcare framing demands unusually explicit limits.

## Safety boundary

WitnessPatch uses declared synthetic fixtures only. No patient data was used, and the product provides no medical advice, diagnosis, treatment recommendation, automated clinical decision, HIPAA claim, or permission to deploy a model-authored repair. It cannot detect undisclosed patient information or prove de-identification. No physician reviewed the fixture or wording, and no clinical validation is claimed. The software verifies authored engineering contracts; human reviewers remain responsible for whether those contracts are clinically appropriate.

<!-- DEVPOST_STORY_END -->

## Built with

Devpost normalized the saved selection to these `22/25` tags:

`GPT-5.6`, `Tailwind`, `Cloudflare`, `JSON`, `Web`, `Crypto`, `GitHub`, `AI`, `Agent`, `Regression`, `Synthetic`, `Healthcare`, `Node.js`, `JavaScript`, `TypeScript`, `React`, `Next.js`, `Vite`, `OpenAI`, `Developer`, `Open`, `CI/CD`

Do not add `OpenAI API`; the product does not use it.

## What is different

Failure-to-regression and agent-verification workflows are established: Trajectly, ORP, Braintrust, Promptfoo, AgentRx, and public Build Week repositories including Ouroboros, OutcomeLoop, Remnic Relay, PatchPilot, and Sieve cover substantial parts of replay, repair, external verification, human approval, red/green closure, evidence receipts, provenance, or CI. WitnessPatch does not claim those primitives. Its narrower demonstrated wedge is a **portable red-test compiler for missed action deadlines**: most evals ask whether an answer was acceptable; WitnessPatch asks whether the required action happened before its declared deadline using only the authored facts available then, and emits the red test before any separate repair is trusted.

- **Time-fenced action deadlines:** the grader checks which authored facts were visible at every decision and whether the required action occurred before its declared deadline.
- **Portable conventional-test handoff:** a known failure plus an authored action contract becomes a nine-file `node:test` package with a documented WitnessPatch CLI dependency rather than only a platform dataset row or dashboard result.
- **Model-independent verdict:** GPT-5.6 helps build and author; it cannot edit the runtime grader, artifact hashes, or expected holdouts.
- **Executable handoff and closure:** judges receive the already-observed miss as a conventional red test, then can inspect a separate target diff and prove that the scoped repair turns it green.
- **Fail-closed browser and detached-bundle proof:** browser tampering, truncation, redirects, unsafe paths, evaluation drift, holdout drift, or missing WebCrypto keep the failing baseline active; `witnesspatch verify --bundle PATH` separately rejects changed, missing, extra, linked, schema-invalid, or non-reproducible bundle files.
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
- Live reference compilation: `2/2` exact synthetic input hashes, full case/run validation, and an exportable nine-file red ZIP for `INV-02` at T+02. For the two manifest-listed public inputs, the CLI with `--fact-scope failure-prefix` produces the same nine file contents. The exported default regression exits red; pointing it at the supplied repaired run exits green.
- Detached-bundle verification: `witnesspatch verify --bundle PATH` checks the exact file set, safe regular-file boundary, schemas, semantic links, manifest hashes, fresh evaluation, and compiler-exact bytes; it explicitly reports publisher provenance as unverified.
- Local-input compilation: a separate browser workspace accepts a declared-synthetic case and failed run, freshly regrades it, exports the same nine-file format, and preserves `0 externally verified` in the portable receipt and manifest.
- V2 artifact manifest: `23/23` exact hashes against the same-build manifest; this is integrity, not a publisher signature.
- Reference browser recomputation: `2/2` fresh regrades and `4/4` V2 holdouts.
- Fresh post-start candidate: `validated_candidate`, quarantined, not installed; browser-safe JSON-IR interpretation and Node execution each match `2/2` case and `4/4` holdout signatures.
- Static witness: the encoded `INV-02` predicate is reduced from 9 T+02 facts to 3 with recorded decisions held fixed.
- Local release verification: exact candidate `87dee97` passed `npm ci` and `npm run verify:release` from fresh clones on macOS 26.5.2 arm64/Node 24.14.0 and a local Debian 12 arm64 container/Node 22.23.1. macOS passed `158/158` aggregate test executions; Debian passed `157/158`, with only the expected case-insensitive-filesystem test skipped. Both passed `136` discovered core tests, `6/6` rendered checks, `1/1` real development-server HTTP smoke, `9/9` submission-package checks, `6/6` deployment-rendered checks, the zero-argument judge proof, detached-bundle verification coverage, the threat-model boundary check, build, lint, typecheck, the distribution-license gate, byte-identical bundled third-party notices, and a 59-asset Wrangler dry run; their physical 55-file `dist/client` snapshots matched byte-for-byte with canonical manifest SHA-256 `1133339d1b372491084a06f889acd97399f2de2988d6267eb13baa48dd4b3721`.
- Current authorized no-physician-review candidate: 55-file static fingerprint `9238879c5d87b96557f0988af01c0998fb185dbe56ff533b1e6e5605e60e595a`; the final freeze rechecks exact-tip public CI and deployed bytes after the real video and `/feedback` fields exist.
- Current source-bound real-Chrome QA: the reference path visibly completed `50 → compile nine-file RED bundle → 100`, `2/2` compiler inputs, `23/23` retained artifacts, reference `2/2` plus `4/4`, fresh IR `2/2` plus `4/4`, and the four-case baseline/repair/control/mutant closure. The local path loaded the included pair and produced a nine-file `50/100` red bundle with `2` hashes computed and `0` externally verified, exact CLI byte parity, red/green executable closure, and no requests after the two expected sample fetches. Both paths recorded zero console errors or warnings; same-page controls produced no `/.rsc` or `404` requests. Exact 390 x 844 reference and local replays had no horizontal overflow.
- Bidirectional message/action checking rejects urgent wording hidden behind safe labels.
- A numeric-inference contradiction marker fails even when the supplied-classification action label is present.

This is strong implementation evidence for one synthetic software oracle, not evidence of clinical correctness, patient outcomes, or generalization.

## Build Week before/after disclosure

WitnessPatch began as a pre-existing local V1 prototype. Its original evaluator, static UI, 16-file artifact bundle, 13 checks, and captured Sol candidate predate the official July 13 submission start and are not claimed as Build Week work. The portable compiler, fail-closed browser verifier, clinically narrower V2 namespace, and fresh post-start candidate proof are the meaningful extensions. Timestamped Codex records, the before/after ledger, separate V1/V2 manifests, and first dated checkpoint `21405c8` preserve that distinction locally. Because the root commit contains both disclosed lineage and extensions, it is a checkpoint rather than independent proof of every file's creation time.

## Entrant

Fuzlullah Syed is the sole entrant. He is a third-year medical student; that training motivates the problem choice but is not licensed clinical authority.

## Safety and validation status

WitnessPatch is developer safety tooling, not clinical decision support. It uses no real patient data. The V2 rules link to public CDC, AIM, and ACOG guidance, but source-ID linkage is not semantic validation. No physician fixture/wording review or clinical validation was performed; clinical validation is not claimed. A health-AI builder workflow interview has also not yet been performed. The project does not certify safety, diagnose, recommend treatment, or replace organizational clinical governance.

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

Open `http://localhost:3000`. The local release path and hydrated browser flow are verified on macOS. Source install, build, and release verification also pass in the exact local Debian 12 arm64/Node 22.23.1 environment documented above; no Linux browser matrix is claimed. Public exact-commit GitHub Actions passes; Windows remains unverified.

## Public links and release boundary

- **Try it URL:** https://witnesspatch.ankigpt.workers.dev
- **Repository URL:** https://github.com/Sammsamy/witnesspatch
- **Video boundary:** the submitted public demo must remain shorter than three minutes, explain the product plus Codex and GPT-5.6 use, and include audio. The Apple System Voice rehearsal is not licensed for public sharing and cannot be submitted. The replacement candidate uses Piper 1.5.0 with the `en_US-ljspeech-high` voice from an MIT-declared repository; its pinned voice card records training from scratch on the public-domain LJ Speech Dataset. No voice cloning was performed. The delivered video identifies the AI narration in its opening cue, and the prepared YouTube description explicitly identifies the synthetic Piper voice. The entrant must still watch and listen to the complete uploaded cut before final freeze.
- **Validation boundary:** no external builder review, physician fixture review, or clinical validation is claimed without a retained participant-confirmed record.

## Prepared public video description

> WitnessPatch turns one fully synthetic missed-deadline failure into a portable red-test bundle, then verifies a separate repair offline.
>
> Built during OpenAI Build Week with Codex and a requested GPT-5.6 Sol / Ultra workflow. Deterministic code owns every public pass/fail verdict; the receipt records requested configuration, not independently attested served-model identity.
>
> This video uses synthetic narration generated locally with Piper 1.5.0 and the `en_US-ljspeech-high` voice from the MIT-declared Piper voices repository, trained on the public-domain LJ Speech Dataset. No voice cloning was performed.
>
> No patient data. No clinical use. No physician review. No clinical validation claim.
>
> Live demo: https://witnesspatch.ankigpt.workers.dev
>
> Source: https://github.com/Sammsamy/witnesspatch
>
> Piper: https://github.com/OHF-Voice/piper1-gpl/tree/v1.5.0
>
> Voice provenance: https://huggingface.co/rhasspy/piper-voices/blob/5b44ec7bab7c5822cfec48fbd5aa99db71a823d6/en/en_US/ljspeech/high/MODEL_CARD
>
> LJ Speech Dataset: https://keithito.com/LJ-Speech-Dataset/
