# Competitive positioning

## Blunt conclusion

“Healthcare AI crash-test and repair lab” is too broad and too crowded to win on concept alone. Deterministic agent replay, behavioral contracts, exact witness steps, trace shrinking, failure-to-regression workflows, healthcare CI gates, synthetic clinical environments, and prompt repair all exist publicly.

The defensible demonstration is narrower:

> WitnessPatch turns a missed safety deadline into a portable red test. It freezes what the agent knew at each timestamp, checks whether the required action happened on time, and compiles that exact failure into a hash-bound `node:test` bundle that runs offline before any repair can be trusted.

That is the specific composition demonstrated here, not a claim of a new regression-testing algorithm, shrinking algorithm, replay system, agent-evaluation category, or proven market differentiation.

## Closest public collisions

| Product or prior art | Verified public overlap | WitnessPatch's narrower demo distinction |
|---|---|---|
| [PatchWitness](https://github.com/kyawzinIT99/PatchWitness) | Public Build Week candidate with an inverse name and a failed AI automation → minimal repair → replay assertions → portable proof-bundle story | WitnessPatch's dated local history predates that repository's public creation; the product must nevertheless avoid generic patch/proof language and lead with time-fenced action deadlines plus offline red-test compilation |
| [PatchWitness PR evidence CLI](https://github.com/Varunsls/patchwitness) | Earlier public local CLI executes one reproduction command against base and candidate Git revisions, records digests/logs/changed-file scope, exports evidence, and can publish a GitHub job summary | WitnessPatch does not claim fail-before/pass-after evidence or CI summaries as novel; its demonstrated wedge starts from a recorded agent trace, freezes time-available facts, and compiles the missed action deadline into a conventional red test before a repair is trusted |
| [ApprenticeOS](https://github.com/igd27400-ctrl/ApprenticeOS), [Counterexample Studio](https://github.com/sravan27/counterexample-studio), [Aegis](https://github.com/Abi5678/aegis), and [CrossPatch](https://github.com/asadvendor-boop/CrossPatch) | Public Build Week candidates cover expert correction to regression, minimized replayable traces, competing repairs, protected holdouts, evidence bundles, mutation controls, and human gates | The narrow wedge is not generic repair or proof: it compiles a supplied, already-observed missed action deadline using only facts available at that time into a conventional offline red test |
| [RENKEVIA](https://github.com/Elbrak17/renkevia) | Public Build Week healthcare change compiler with deterministic synthetic-patient regressions, provenance, specialist review, and a human gate | WitnessPatch starts from a captured incident, preserves time-of-knowledge boundaries, and exports a red `node:test` handoff before evaluating any separate repair |
| [Trajectly](https://github.com/trajectly/trajectly) / [product site](https://www.trajectly.dev/) | Deterministic offline fixture replay, behavioral contracts, exact witness steps, shortest-trace shrinking, one-command reproduction, CI exit codes, and no-key execution; public releases existed by March 5, 2026 | Its public documentation does not show this exact conventional `node:test` package plus inspectable repair, exact-fact control, always-escalate mutant, and manifest-listed browser/CLI `failure-prefix` byte-parity composition |
| [Open Reflection Protocol](https://github.com/Fujo930/ORP) | Its headline turns agent failures into regression tests; it compiles captured evidence into runnable evals and compares before/after behavior | Time-fenced facts, a deterministic healthcare action oracle, reduced fixed-decision witness, exact control/mutation closure, and byte-bound browser/CLI verification are not documented there |
| [Braintrust failure-to-regression workflow](https://www.braintrust.dev/articles/turn-llm-production-failures-into-regression-tests) | Failed trace to labeled/versioned regression dataset, deterministic or model scorer, and CI/release gate—the broad title framing is an exact collision | Emits a portable conventional test bundle rather than a platform dataset/scorer row, with a static witness, target diff, exact control, mutant, and cross-runtime integrity closure |
| [Promptfoo agent trajectory testing](https://www.promptfoo.dev/docs/red-team/agents/) | Time-ordered agent trajectories, tool/order/budget assertions, red-team findings promoted into targeted CI regressions, and JUnit output | Does not document this exact known-failure-to-portable-bundle handoff or the time-fact witness plus repair/control/mutation and manifest-listed browser/CLI `failure-prefix` parity closure |
| [Pacific AI Gatekeeper](https://pacific.ai/gatekeeper/) | Healthcare-specific CI/CD gates, per-commit reruns, thresholds, and pull-request blocking | A retained time-fenced trace is compiled into a static witness, regression, executable target diff, and browser-verifiable artifact bundle |
| [Microsoft AgentRx](https://www.microsoft.com/en-us/research/blog/systematic-debugging-for-ai-agents-introducing-the-agentrx-framework/) | Guarded executable constraints, stepwise evidence, and first critical-failure localization | Final V2 verdicts are deterministic and pair the urgent trace with an exact-fact over-escalation control |
| [Contradish](https://github.com/michelejoseph/contradish) | Replay failures become cases, prompt rewrites, reruns, and CI gates | Explicit fact reveal times, source-ID-linked action contracts, and a retained executable target-policy diff |
| [Hippocratic AI RWE-LLM](https://hippocraticai.com/real-world-evaluation-llm/) | Healthcare-agent testing, clinician review, error resolution, and continuous feedback | A repo-local developer compiler and exact-byte judge replay; WitnessPatch does not claim comparable clinical validation |
| [Mirra](https://mirrahealth.io/) | Healthcare data/simulation infrastructure, adversarial scenarios, failure mapping, and revalidation | One narrow failure-to-regression artifact chain rather than a broad simulation or data platform |
| [Synset](https://www.synset.ai/) | Synthetic clinical timelines, separation of answer key from visible evidence, audit trails, and regression suites | A compiled static contract witness plus executable target patch and fail-closed browser receipt |
| [Verial](https://verial.ai/) | Deterministic healthcare-agent sandboxes, synthetic patients, persistent state, and evaluation suites | A portable JSON compiler that emits a red regression from a supplied recorded run |
| [STELLA](https://www.medrxiv.org/content/10.64898/2025.12.11.25342078v2) / [PromptSafe](https://www.prompt-safe.com/) | Multi-turn simulated health scenarios, rubrics, scoring, and suggested fixes | A locked software oracle, executable target diff, and exact-byte replay rather than a model-judged final verdict |
| [Pythia](https://clai-group.github.io/Pythia/) | Held-out-dataset clinical prompt optimization, automated rewriting, reruns, and backtracking | Time-fenced fact references and an exact authored control against one always-escalate mutation |

[OpenAI HealthBench](https://openai.com/index/healthbench/), [Microsoft HealthAgentBench](https://github.com/microsoft/HealthAgentBench), [Doctorina MedBench](https://arxiv.org/abs/2603.25821), [AgentClinic](https://arxiv.org/abs/2405.07960), and [MedDialogRubrics](https://arxiv.org/abs/2601.03023) further show that medical conversations, sequential environments, simulated patients, safety traps, and regression evaluation are established categories. [ExAnte](https://aclanthology.org/2026.eacl-long.72/) covers temporal leakage as an adjacent primitive. [Hypothesis](https://hypothesis.readthedocs.io/en/latest/tutorial/replaying-failures.html) is established prior art for shrinking, replaying, and preserving failing examples, so WitnessPatch's `9→3` result must remain labeled a bounded recorded-decision predicate witness rather than a minimal counterexample.

These are point-in-time public capability comparisons, not independent evidence of adoption, accuracy, commercial traction, or legal clearance. The official Build Week gallery was still unpublished during the July 20 recheck, so the linked Build Week repositories are public candidates rather than confirmed final Devpost entries.

## The narrow wedge

The demo must show this chain in one uninterrupted flow:

1. Every authored fact has a reveal time.
2. A locked software contract identifies the earliest critical failing prefix.
3. The compiler holds recorded decisions fixed and emits a static contract witness plus red regression.
4. A retained patch changes the executable target policy, not the case or locked grader.
5. The unchanged urgent fixture passes, the exact-fact negative control stays green, and an always-escalate mutation fails.
6. The browser verifies 23 exact hashes, freshly regrades the two reference runs, reruns four reference holdouts, and recomputes the 9→3 static witness before unlocking the result.
7. A distinct fresh post-start candidate, produced under a recorded `gpt-5.6-sol` / `ultra` request, remains quarantined while browser-safe JSON-IR interpretation and Node execution separately match its exact two-case/four-mutation software signature.
8. The unchanged pre-start Sol candidate fails the new V2 contract and is rejected rather than relabeled.

The exact-fact control is intentionally narrow. It does not prove a benign patient state, safe deferral, or generalization. The compiler's witness is not target-in-loop, counterfactual, or clinically minimal.

## The sentence to own

> Most evals ask whether an answer was acceptable. WitnessPatch asks whether the required action happened before its deadline, using only facts available at that moment—and packages the missed deadline as a portable red test.

## Revised pitch

WitnessPatch is a portable red-test compiler for time-critical AI agents. It turns one synthetic missed deadline into a conventional offline test by freezing what the agent knew, checking the declared action deadline, and preserving the observed failure as an executable handoff. A separate verifier checks the retained target patch, exact-fact control, mutations, and artifact bytes. Codex assists the build and authoring workflow; a retained post-start receipt records a `gpt-5.6-sol` / `ultra` request and a distinct quarantined candidate, while deterministic code owns every verdict.

## Branding risk

The earlier working name “Hippocratic CI” could imply affiliation with Hippocratic AI, an established healthcare-agent company publishing safety-validation work. WitnessPatch avoids that direct collision. Two separate public repositories use `PatchWitness`: an earlier pull-request-evidence CLI and a Build Week automation-repair candidate with the inverse name. The dated `21405c8` checkpoint preserves independent WitnessPatch usage before the Build Week candidate's public creation, but it does not remove branding or confusion risk. Do not rename during the final release window; use the distinctive subtitle **portable red-test compiler for time-critical AI agents** consistently. This is provenance evidence, not trademark or legal clearance.

## Claims to avoid

- first healthcare AI evaluation, CI, simulation, or repair platform;
- first tool to turn an agent failure into a regression;
- deterministic replay, behavioral contracts, exact failure localization, shrinking, or offline CI as novel primitives;
- first temporal clinical benchmark or failure-localization workflow;
- “minimal counterexample,” “proof-carrying,” “formal safety case,” or “provenance attestation”;
- “clinically validated,” “production-ready,” “regulatory-ready,” or “safety certified”;
- the exact-fact control proves a benign patient or safe delay;
- the grader inferred a blood-pressure threshold from numeric values;
- the compiler found a target-in-loop, counterfactual, or medically minimal scenario;
- source-ID linkage proves semantic clinical correctness;
- same-build hashes prove publisher identity or untampered origin;
- the rejected V1 Sol candidate is the passing V2 repair;
- a “reviewed” patch without an identified reviewer and retained record.
