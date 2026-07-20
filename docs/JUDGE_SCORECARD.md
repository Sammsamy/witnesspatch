# Adversarial judge scorecard

This is an internal decision tool, not a prediction of anyone's private views. The [OpenAI Build Week page](https://openai.com/build-week/) names five judges: Thibault Sottiaux, Kath Korevec, Tara Seshan, Leah Belsky, and Peter Steinberger. The lenses below use published roles and public work, not invented preferences.

The [Official Rules](https://openai.devpost.com/rules) score technological implementation, design, potential impact, and quality of the idea on a 1–10 scale with equal weight. Technical implementation is the first tie-break. The rules also say only meaningful post-start extensions to an existing project are judged, so V1 lineage cannot inflate the Build Week score.

## Current evidence-based range

The July 20 late-window adversarial rescore remains `29.0/40`, with an honest range of `27.8–30.4/40` **if** all mandatory external submission gates are completed. Public MIT source, exact-commit CI, a byte-verified logged-out deployment, the detached-bundle verifier, six-line judge proof, sharper positioning, corrected receipt frame, threat model, and exact-commit release gate strengthen execution. Newly visible public Build Week competitors—especially Ouroboros, OutcomeLoop, and Remnic Relay—make generic repair, independent-verifier, red/green closure, judge-package, and receipt claims less distinctive, holding the idea estimate at `6.6`. As submitted today, the project would still fail before Stage Two because the public video, `/feedback` ID, completed Devpost entry, and final freeze are missing. The public gallery remains unpublished, so competitor repositories are risk evidence rather than confirmed eligible submissions. The table is a decision aid, not a measured judge prediction.

| Official criterion | Internal estimate | Defensible finalist target | Main gap |
|---|---:|---:|---|
| Technological implementation | 9.3 / 10 | 9.5 | Post-start work includes a model-free browser and CLI compiler, content-bound bundle identities, schema and semantic validation, bounded browser work, an executable red regression, exact manifest, retained target diff, 23-file verifier, mutation controls, and adversarial fail-closed tests. A zero-argument judge proof demonstrates compile/red/green/mutant closure, while `verify --bundle` rejects changed, linked, oversized, schema-invalid, semantically inconsistent, or compiler-divergent detached bundles. The workflow surfaces that proof in its job summary and the threat model narrows every trust boundary. The first public release commit passed exact-commit CI and all 53 served files byte-match the reviewed deployment; exact submitted-commit freeze remains. |
| Design | 8.0 / 10 | 9.0 | The reference flow begins failed, compiles a visible `BASELINE RED` ZIP and bundle map, then separately verifies the repair while keeping the baseline visibly red. Four source-bound media frames and a 2:53 script exist; the receipt frame was recaptured at `scrollX = 0` with the explicit no-physician-review boundary. A clean logged-out public replay completes with zero console warnings or errors. Existing local video masters predate the disclosure and are not final; the experience remains dense and jargon-heavy. |
| Potential impact | 5.1 / 10 | 8.0 | The user and release-gating job are specific, but there is no external healthcare-AI builder workflow observation, measured time-to-regression baseline, adoption evidence, or licensed-physician review. Synthetic software checks cannot fill this gap. |
| Quality of the idea | 6.6 / 10 | 8.2 | The broad failure-to-regression story is crowded by established products and late public Build Week candidates. Ouroboros already owns bounded Codex proposal → blind evaluator → promotion, OutcomeLoop owns protected external-verifier completion loops and signed receipts, Remnic Relay owns human-approved correction plus fresh-agent red/green replay and an evidence-bound judge package, PatchPilot owns evidence-gated deterministic remediation, and Sieve owns causal rationale intervention. The defensible wedge is narrower: compile an already-observed missed action deadline using only time-available facts into a portable offline red test before a repair is considered. Only one healthcare vertical slice is exercised. |
| **Adversarial total** | **29.0 / 40** | **34.7 / 40** | The project is technically credible but not winner-safe. Public release gates are mandatory; external workflow evidence is the largest scoring lever that local testing cannot manufacture. |

No honest process can guarantee `40/40`, a prize, or employment. Today the impact score is the hard ceiling: more polish cannot substitute for external evidence.

## Published-judge evidence lenses

### Thibault Sottiaux — Head of Product & Platform

**Public signal:** In OpenAI's [Codex is for everyone](https://forum.openai.com/en/public/videos/event-replay-codex-is-for-everyone-why-codex-matters-beyond-code-2026-05-13) discussion, Sottiaux frames trust as an adoption constraint and emphasizes constrained access, review, and precise success definitions. OpenAI's [Ona acquisition announcement](https://openai.com/index/openai-to-acquire-ona/) similarly centers secure agent work across the software lifecycle.

**WitnessPatch implication:** Show the post-start compiler, real repository patch, exact test execution, and fail-closed browser verification. Keep the human approval boundary and V1/V2 provenance visible.

**Failure mode:** GPT-5.6 appears to certify itself, same-build hashes are presented as publisher authenticity, or pre-start work is implied to be Build Week output.

### Kath Korevec — Member of Product Staff

**Public signal:** Korevec's [Jules launch](https://blog.google/innovation-and-ai/models-and-research/google-labs/jules/) emphasizes work in real repositories, visible plans, tests, diffs, and steerability. Her post on [Jules' critic](https://developers.googleblog.com/meet-jules-sharpest-critic-and-most-valuable-ally/) emphasizes adversarial review, missed edge cases, untested assumptions, iteration, and human review.

**WitnessPatch implication:** Start with the broken executable target, expose the exact patch and regression, then show the exact-fact control defeating the always-escalate mutation. The one-click result must map to retained bytes and fresh computation.

**Failure mode:** The diff is decorative, a failure still unlocks the green UI, or the exact-fact control is oversold as proof that a patient is clinically benign.

### Tara Seshan — Member of Product Staff

**Public signal:** In her [First Round interview](https://review.firstround.com/podcast/lessons-from-stripe-on-adding-new-products-assessing-ideas-structuring-teams-and-tactics-for-product-reviews-tara-seshan-watershed-stripe/), Seshan stresses a specific target user, why-now logic, time and cost to the first useful hypothesis, measurable goals, and evidence that changes beliefs. Her work on [Stripe Billing in Europe](https://stripe.com/blog/billing-eu) demonstrates productizing complex constraints while minimizing unnecessary user harm.

**WitnessPatch implication:** Anchor the story to one user—healthcare-agent safety/evaluation builders—and one job: turn a found failure into a release-gating regression. Ask a real builder where failures go today and what artifact would change that workflow.

**Failure mode:** “Healthcare needs safety” substitutes for evidence of the current workflow, or internal fixture performance is inflated into an impact claim.

### Leah Belsky — VP of Education

**Public signal:** Belsky's [OpenAI education keynote bio](https://forum.openai.com/public/videos/building-an-ai-powered-university-2025) spans education, technology, and health. [ChatGPT Futures](https://edunewsletter.openai.com/p/introducing-chatgpt-futures-class) frames learners as high-agency builders who retain judgment and responsibility. The [Learning Outcomes Measurement Suite](https://openai.com/index/understanding-ai-and-learning-outcomes/) stresses baselines, realistic conditions, external ground truth, and validation.

**WitnessPatch implication:** Make the medical-student founder story specific without treating student status as authority. Show the baseline, the exact software claim, and the external-review gap beside the result.

**Failure mode:** The product appears to replace clinical judgment, fixture-supplied classifications are portrayed as medical inference, or software checks are presented as patient outcomes.

### Peter Steinberger — Member of Technical Staff, Clawfather

**Public signal:** Steinberger's writing on [OpenClaw](https://steipete.me/posts/2026/openclaw) centers useful agents that act while preserving usability, safety, and data ownership. [Shipping at inference speed](https://steipete.me/posts/2025/shipping-at-inference-speed) emphasizes executable feedback loops, CLI-first building, and verified output. [Just talk to it](https://steipete.me/posts/just-talk-to-it) emphasizes bounded blast radius, isolated changes, and interactive testing.

**WitnessPatch implication:** Make `npm run artifacts:v2:verify` reproduce the 23 hashes, reference evaluations/holdouts, fresh candidate's exact Node signature, and rejected V1 compatibility result. Keep the browser JSON-IR/Node-execution split and compiler's static recorded-decision boundary explicit.

**Failure mode:** “Production-ready” language, fake snippets, hidden orchestration, or a polished animation without executable closure.

## Non-negotiable gates before submission

- [x] Audit the published rules, dates, criteria, categories, repository options, and video requirements.
- [x] Disclose V1 as pre-start lineage and separate the post-start compiler, browser verifier, and V2 namespace.
- [x] Replace the overbroad “benign twin” claim with an exact-fact negative control and visible non-generalization boundary.
- [x] Make blood-pressure classification fixture-supplied and disclose the two-endpoint-only scope.
- [x] Close the urgent-wording/safe-label bypass and numeric-inference contradiction path.
- [x] Retain a 23-file V2 manifest with reference `2/2` regrades, `4/4` holdouts, and full 9→3 witness recomputation.
- [x] Compile the exact failure live in the browser into an exportable nine-file ZIP; for the two manifest-listed public inputs, prove CLI/browser `failure-prefix` byte parity and execute the exported regression red then green against the supplied repair.
- [x] Add a separate local-input workspace that accepts a declared-synthetic case and failed run, regrades locally, preserves unverified-input caveats inside the ZIP, and never unlocks the retained repair.
- [x] Share the full schema and semantic input-validation boundary across Node and browser, with coordinated manifest-rehashed attack tests.
- [x] Re-test and reject the unchanged pre-start V1 Sol candidate under V2 instead of relabeling it.
- [x] Capture a fresh post-start candidate under a recorded `gpt-5.6-sol` / `ultra` request, keep it quarantined, and verify its exact browser-IR and Node signatures without claiming served-model attestation.
- [x] Create the first dated post-start checkpoint (`21405c8`) and preserve the non-rewritten provenance ledger.
- [x] Pass `npm ci` and the complete release verifier from fresh local clones on macOS with Node 22.15.0 and 24.14.0 at checkpoint `a056fe3`.
- [x] Pass exact source/media checkpoint `1086426` through the complete release verifier from fresh macOS and local Debian clones, including `151/151` aggregate tests on macOS, `150/151` pass plus one expected filesystem skip on Debian, `6/6` rendered checks, `1/1` HTTP smoke, `7/7` submission checks, `6/6` deployment-rendered checks, and a 59-asset Wrangler dry run; confirm byte-identical physical 55-file `dist/client` snapshots with canonical manifest SHA-256 `1133339d1b372491084a06f889acd97399f2de2988d6267eb13baa48dd4b3721`.
- [x] Pass exact release candidate `87dee97` through fresh macOS and Debian clones after judge-proof, detached-bundle, CI-summary, and threat-model hardening: `158/158` aggregate tests on macOS, `157/158` plus one expected filesystem skip on Debian, zero vulnerabilities, and the unchanged canonical 55-file static fingerprint.
- [x] Pass `npm ci` and the complete release verifier from a fresh local clone of release-code checkpoint `15f1aee` on Node 24.14.0.
- [x] Fix the README development-server first-request failure and pass the expanded verifier from a fresh clone of `9f2cd8d`, including the real HTTP smoke.
- [x] Recapture four direct 1200 x 800 product screenshots from the current source-hash-bound candidate and bind their bytes to thirteen source fingerprints; the 2:53 founder script and captions are prepared but the public video is not recorded.
- [ ] Obtain at least one health-AI builder workflow interview.
- [x] Use the authorized no-physician route: remove or narrow unsupported clinical claims and preserve `fixture_wording_review: not_performed` plus `clinical_validation: not_claimed` in canonical and visible copy.
- [x] Apply MIT, publish the repository, verify public visibility/license/default-branch bytes, and pass the first exact-commit public `Verify` push run. Repeat the exact check during final freeze.
- [x] Deploy the replay, byte-check all 53 served files, and complete the reference compile/verify from a clean public browser session with zero console warnings or errors.
- [ ] Record and upload the founder-voiced public video under three minutes with audio explaining both Codex and GPT-5.6.
- [ ] From this primary task, submit `/feedback` with the existing session shared and capture the returned Session ID; do not substitute the technical task/thread UUID.
- [ ] Confirm the creator's eligibility and choose the truthful entrant type; submit solo unless the brother has actually contributed, joined, accepted the rules, and authorized a representative.

## Stop rule

Do not submit a broad “AI safety for healthcare” story. If the real target diff, fail-closed V2 proof, before/after provenance, and external validation cannot all be shown honestly, frame WitnessPatch as a narrow temporal contract compiler with one synthetic reference—not a complete healthcare safety platform.
