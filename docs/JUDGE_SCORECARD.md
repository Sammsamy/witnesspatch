# Adversarial judge scorecard

This is an internal decision tool, not a prediction of anyone's private views. The [OpenAI Build Week page](https://openai.com/build-week/) names five judges: Thibault Sottiaux, Kath Korevec, Tara Seshan, Leah Belsky, and Peter Steinberger. The lenses below use published roles and public work, not invented preferences.

The [Official Rules](https://openai.devpost.com/rules) score technological implementation, design, potential impact, and quality of the idea on a 1–10 scale with equal weight. Technical implementation is the first tie-break. The rules also say only meaningful post-start extensions to an existing project are judged, so V1 lineage cannot inflate the Build Week score.

## Current honest score

| Official criterion | Now | Defensible finalist target | Main gap |
|---|---:|---:|---|
| Technological implementation | 9.4 / 10 | 9.6 | Post-start work includes a live browser compiler that hash-checks and fully validates `2/2` inputs, emits a nine-file regression ZIP byte-identical to Node, reduces the T+02 witness `9→3`, and fails closed on coordinated schema tampering. The exported default test is red and turns green only for the supplied repaired candidate. Separate retained-repair verification covers a 23-file exact profile, `2/2` regrades, `4/4` reference holdouts, and a quarantined fresh candidate whose browser IR and Node execution match exact `2/2` plus `4/4` signatures. Release-code checkpoint `9f2cd8d` passed `npm ci` and `npm run verify:release` from a fresh local clone: `104/104` core tests, `5/5` rendered tests, a `1/1` real development-server HTTP smoke, build/lint/typecheck, 624-package/15-static-package license gating, byte-identical deployed notices, and a 59-file Wrangler dry run. Public CI, an exact submitted-commit replay after final freeze, and non-macOS verification remain. |
| Design | 9.1 / 10 | 9.4 | The truthful two-stage flow starts at `50`, displays no generated test before compilation, exposes the live `BASELINE RED` bundle and ZIP export, then reaches `100` while preserving `baseline RED · retained repair PASS`. Final hydrated Chrome compile/export/verify/replay/recompile QA had all artifact requests HTTP 200 and zero console warnings or errors. Three exact product-capture media assets and a timed 2:38 founder script are locally ready; a public deployment and recorded founder-voiced video are still missing. |
| Potential impact | 6.1 / 10 | 8.3 | The user and release-gating job are specific, but there is still no external health-AI builder workflow interview, real failure-to-regression baseline, or licensed-physician review. Synthetic software checks cannot fill this gap. |
| Quality of the idea | 8.4 / 10 | 8.9 | The temporal contract-to-regression wedge now closes into an inspectable, exportable developer artifact instead of a demo-only animation. Healthcare eval tooling remains crowded, only one vertical slice is demonstrated, and the exact-fact control does not establish generalization. |
| **Planning total** | **33.0 / 40** | **36.2 / 40** | Strong local implementation; not yet a defensible winning submission. External evidence, public access, and rule-complete submission assets are now much higher-value than more internal proof. |

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
- [x] Compile the exact failure live in the browser into an exportable nine-file ZIP, prove Node/browser byte parity, and execute the exported regression red then green against the supplied repair.
- [x] Share the full schema and semantic input-validation boundary across Node and browser, with coordinated manifest-rehashed attack tests.
- [x] Re-test and reject the unchanged pre-start V1 Sol candidate under V2 instead of relabeling it.
- [x] Capture a fresh post-start candidate under a recorded `gpt-5.6-sol` / `ultra` request, keep it quarantined, and verify its exact browser-IR and Node signatures without claiming served-model attestation.
- [x] Create the first dated post-start checkpoint (`21405c8`) and preserve the non-rewritten provenance ledger.
- [x] Pass `npm ci` and the complete release verifier from fresh local clones on macOS with Node 22.15.0 and 24.14.0 at checkpoint `a056fe3`.
- [x] Pass the current combined-tree release verifier with `104/104` core and `5/5` rendered tests, plus hydrated Chrome compile/export/verify/replay/recompile QA with zero console errors or warnings.
- [x] Pass `npm ci` and the complete release verifier from a fresh local clone of release-code checkpoint `15f1aee` on Node 24.14.0.
- [x] Fix the README development-server first-request failure and pass the expanded verifier from a fresh clone of `9f2cd8d`, including the real HTTP smoke.
- [x] Freeze judge-facing title, elevator pitch, truthful tags, three exact product screenshots, a timed founder script, and original visual-asset provenance.
- [ ] Obtain at least one health-AI builder workflow interview.
- [ ] Obtain a scoped licensed-physician fixture review, or preserve `pending` everywhere.
- [ ] Choose public licensed repository or private judge-shared repository and verify access.
- [ ] Deploy the replay and verify it from a clean browser with no privileged session.
- [ ] Record and upload the founder-voiced public video under three minutes with audio explaining both Codex and GPT-5.6.
- [ ] Capture the `/feedback` Codex Session ID from the task where the majority of core functionality was built.
- [ ] Confirm both brothers' eligibility/registration and designate the team representative.

## Stop rule

Do not submit a broad “AI safety for healthcare” story. If the real target diff, fail-closed V2 proof, before/after provenance, and external validation cannot all be shown honestly, frame WitnessPatch as a narrow temporal contract compiler with one synthetic reference—not a complete healthcare safety platform.
