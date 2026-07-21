# Submission draft

This file preserves the exact public project copy aligned to the published [OpenAI Build Week Official Rules](https://openai.devpost.com/rules). The entrant authorized an individual submission; the [public MIT repository](https://github.com/Sammsamy/witnesspatch), exact-commit CI, and [live static replay](https://witnesspatch.ankigpt.workers.dev) exist. External form state and private account workflow are intentionally not recorded here.

## Exact project overview fields

**Project name**

> WitnessPatch: Turn Late Agent Actions Into Tests

**Elevator pitch**

> When an AI agent acts too late, WitnessPatch saves the missed deadline as a Node test that teams can rerun against imported WitnessPatch run files before every release.

**Category**

> Developer Tools. WitnessPatch takes a synthetic, timestamped agent trace, finds the first required action it missed, and exports that exact failure as a Node test. It does not provide patient advice or make clinical decisions.

<!-- DEVPOST_STORY_START -->

## Inspiration

An AI agent can eventually give the right answer and still fail because it acted too late.

The demo uses a fully synthetic healthcare scenario. At two minutes, the agent has enough authored facts to trigger a required action, but it tells the user to wait. A later fact arrives at six minutes. That later fact cannot change what the agent knew when the earlier deadline passed.

A screenshot records the mistake but cannot catch it again. A model-written critique may let a model judge its own output. Developers need a test they can keep.

[OpenAI HealthBench](https://openai.com/index/healthbench/) shows why realistic scenarios and worst-case reliability matter. WitnessPatch handles engineering after an authored failure; it does not perform clinical evaluation.

I am a third-year medical student, which motivated the healthcare setting. I am not a licensed physician, and no physician reviewed this project. WitnessPatch does one narrow job: turn a synthetic missed deadline into a test before anyone trusts a repair.

## Approach

WitnessPatch follows four steps:

1. **Read the timeline.** It records which authored facts were visible when the agent made each decision.
2. **Find the first miss.** Locked code checks whether every required action happened before its deadline.
3. **Make a real test.** The first missed action becomes a standard nine-file Node test package with the original inputs, evidence, receipt, and failing test.
4. **Compare and repair.** Teams can load up to six WitnessPatch run files tagged with different model names and check each one against the same rules. A separate repair must pass the original test and extra checks for overreaction.

## Why this is different

Replay, evaluation, and repair tools already exist. WitnessPatch focuses on a narrower handoff. It takes a failure that happened at a specific deadline and turns it into an ordinary test file developers can keep in CI.

The test belongs to the failure, not one model vendor. Users can import several structured run files and apply the same rules to each one. Selecting another run changes the file being checked, not just its label.

The package and CLI run offline without an account, API key, model call, or original agent. The hosted demo checks and compiles files in the browser. Imported model names and reasoning settings are unverified declarations.

## How I built it

A V1 prototype existed before Build Week. Build Week additions are the portable test maker, browser checker, narrower V2 suite, saved-run comparison, and a new receipt from a workflow that requested GPT-5.6. The repository labels V1 separately.

Codex helped build the test maker, comparison screen, browser grader, and release checks. Tests caught path traversal, stale results, malformed or truncated files, and browser tampering.

In a separate Codex run, I requested GPT-5.6 Sol with Ultra reasoning to propose a repair as JSON. Software tested the proposal on four checks the model had not received and kept it separate from the example repair. The receipt records requested settings, not which model actually answered.

The app never calls a model at runtime or lets a model grade itself.

## What the demo proves

The failed run scores 50 out of 100 because it misses two required actions. WitnessPatch turns the first miss at minute two into a test that fails on the original run and passes on the example repair.

Four extra checks reject an overreacting version that treats every situation as urgent. The original run stays visible, so a passing repair cannot hide the failure that created the test.

## Challenges

The hardest problem was preventing future information from changing an earlier verdict. The next challenge was making the browser and CLI produce the same result while safely rejecting changed, missing, extra, linked, or malformed files. The repair also had to survive a test designed to catch overreaction.

## What I learned

I learned that a hash can prove two files are the same, but it cannot prove that their claims are true. I also learned that a passing repair means little unless the original failure stays visible and a nearby control catches overreaction.

## Safety boundary

WitnessPatch uses declared synthetic fixtures only. No patient data was used, and the product provides no medical advice, diagnosis, treatment recommendation, automated clinical decision, HIPAA claim, or permission to deploy a model-authored repair. It cannot detect undisclosed patient information or prove de-identification. No physician reviewed the fixture or wording, and no clinical validation is claimed. The software verifies authored engineering contracts; human reviewers remain responsible for whether those contracts are clinically appropriate.

<!-- DEVPOST_STORY_END -->

## Built with

Devpost normalized the saved selection to these `22/25` tags:

`GPT-5.6`, `Tailwind`, `Cloudflare`, `JSON`, `Web`, `Crypto`, `GitHub`, `AI`, `Agent`, `Regression`, `Synthetic`, `Healthcare`, `Node.js`, `JavaScript`, `TypeScript`, `React`, `Next.js`, `Vite`, `OpenAI`, `Developer`, `Open`, `CI/CD`

Do not add `OpenAI API`; the product does not use it.

## What is different

Most evaluation tools report that a run failed. WitnessPatch takes a recorded action that happened too late and turns it into a Node test. The package includes the case, failed run, evidence, and receipt. It works offline and can test a separate repair.

Existing tools such as Trajectly, ORP, Braintrust, Promptfoo, and AgentRx already cover replay, repair, evaluation, or CI. WitnessPatch claims one narrower contribution: it preserves what the agent knew when the deadline passed, then creates the test before a repair is trusted.

- **Checks the deadline:** the grader uses only facts that were visible when the agent acted.
- **Creates a normal test:** the exported nine-file package includes a standard `node:test` file that teams can keep in CI.
- **Uses the same rules for every run:** model names come from imported files and remain unverified; the software owns the result.
- **Keeps the original failure visible:** the old run stays red while a separate repair is checked.
- **Rejects changed files:** the browser and downloaded bundle stop when required files are missing, changed, linked, malformed, or inconsistent.
- **Checks for overreaction:** an authored control rejects one version that treats every situation as urgent.
- **Needs no API key for judging:** the demo and downloaded test run without billing, a database, or a model call.
- **Keeps a narrow clinical boundary:** the fixture supplies only two blood pressure examples. The software does not infer other thresholds.

## OpenAI technology

Codex helped implement and test the Build Week additions. A separate workflow requested GPT-5.6 Sol with Ultra reasoning and returned a restricted JSON proposal. WitnessPatch turned it into a separate candidate, tested it against two cases plus four checks the model had not received, and did not install it. Software, not the model, calculated every published result.

The unchanged pre-start V1 Sol policy candidate is preserved as lineage and deliberately tested against V2. It fails the urgent V2 contract at `85/100` and has no executable branch for the exact-fact negative control, so it is rejected and not relabeled as current model evidence.

The receipt records the requested settings, not which model actually answered. The example repair remains separate from that proposal. Software, not either file or a model, owns the verdict.

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
- Prior deployed checkpoint: 55-file static fingerprint `9238879c5d87b96557f0988af01c0998fb185dbe56ff533b1e6e5605e60e595a`; exact checkpoint CI and 51 deployed public files passed.
- Current plain-language working tree: 55-file local static fingerprint `4a5bc546ef3b55c76b48b7901432cbe17f6c5b4c192d8eee5259aacb4931e509`. This is not public-deployment or current-CI evidence; the final freeze must recheck the committed tip after the video and `/feedback` fields exist.
- Current local production-Chrome QA: the reference path visibly completed `50 → create nine-file test → 100`, `2/2` compiler inputs, `23/23` retained artifacts, and all four extra checks. The saved-run path fetched the three included JSON files, compared both complete runs, switched the selected file, and created the nine-file test from the failed one. The final desktop flow recorded zero console errors or warnings. Exact `390 x 844` reference and saved-run checks had no horizontal overflow. This is local evidence; current public CI and deployment matching remain pending.
- Bidirectional message/action checking rejects urgent wording hidden behind safe labels.
- A numeric-inference contradiction marker fails even when the supplied-classification action label is present.

This is strong implementation evidence for one synthetic software oracle, not evidence of clinical correctness, patient outcomes, or generalization.

## Build Week before/after disclosure

WitnessPatch began as a V1 prototype before July 13 and does not claim that work as part of Build Week. Build Week additions are the portable test maker, browser checker, narrower V2 files, saved-run comparison, and new requested-model receipt. The linked ledger records the before-and-after evidence.

## Entrant

Fuzlullah Syed is the sole entrant. He is a third-year medical student; that training motivates the problem choice but is not licensed clinical authority.

## Safety and validation status

WitnessPatch is developer safety tooling, not clinical decision support. It uses no real patient data. The V2 rules link to public CDC, AIM, and ACOG guidance, but source-ID linkage is not semantic validation. No physician fixture/wording review or clinical validation was performed; clinical validation is not claimed. A health-AI builder workflow interview has also not yet been performed. The project does not certify safety, diagnose, recommend treatment, or replace organizational clinical governance.

## Judge testing instructions

No account, API key, payment, database, or model call is required.

### Fast live test

1. Open the submitted **Try it** URL in desktop Chrome.
2. Select **Turn failure into test**.
3. Confirm `2/2 exact inputs`, `BASELINE RED`, nine generated files, `INV-02` at T+02, and the `9 → 3` recorded-decision witness. The baseline remains `50/100`.
4. Optionally select **Export complete 9-file ZIP**.
5. Select **Check example repair**.
6. Confirm `23/23` exact retained artifacts, reference `2/2` regrades plus `4/4` holdouts, and fresh-candidate JSON-IR `2/2` regrades plus `4/4` mutation checks.
7. The final display should show `100/100` while the original failed run remains red.
8. Select **Compare your runs**, load the included sample, confirm the synthetic data declaration, and select **Compare saved runs**.
9. Confirm that both included runs show their file-provided model labels, scores, and file fingerprints. Choose the failed run and create its nine-file test.

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
- **Video boundary:** the submitted public demo must remain shorter than three minutes, explain the product plus Codex and GPT-5.6 use, and include audio. The current reviewed asset is a 167-second silent founder screen master. No final narrated video exists yet. The older Apple System Voice and Piper candidates show superseded interfaces and must not be uploaded. The entrant must record, assemble, watch, and listen to the complete founder-narrated cut before final freeze.
- **Validation boundary:** no external builder review, physician fixture review, or clinical validation is claimed without a retained participant-confirmed record.

## Prepared public video descriptions

The updated interface requires a new video. Use exactly one narration route. The founder voice route is preferred because Fuzlullah plans to appear on camera. Do not publish either description until the new video has been recorded and reviewed in full.

### Founder voice route

**YouTube title:** `WitnessPatch: Turn a Missed Agent Deadline into a Test | OpenAI Build Week`

> WitnessPatch turns one fully synthetic missed deadline into a Node test, then checks a separate example repair against the same rules.
>
> I built WitnessPatch during OpenAI Build Week with Codex. In a separate development workflow, I requested GPT-5.6 Sol with Ultra reasoning to return a repair in a restricted JSON format. The software, not the model, calculated every result shown in the demo.
>
> The included failed and repaired runs are authored examples, not captured model responses. Imported model names are marked as unverified.
>
> Narrated by Fuzlullah Syed. No patient data. No clinical use. No physician review. No clinical validation.
>
> Live demo: https://witnesspatch.ankigpt.workers.dev
>
> Source: https://github.com/Sammsamy/witnesspatch

### Piper fallback only

Use this fallback only if the final video actually uses the disclosed Piper voice. Do not use it for founder narration.

**YouTube title:** `WitnessPatch: Turn a Missed Agent Deadline into a Red Test | OpenAI Build Week`

> WitnessPatch turns one fully synthetic missed-deadline failure into a portable red-test bundle, then verifies a separate repair offline.
>
> Built during OpenAI Build Week with Codex and a requested GPT-5.6 Sol / Ultra workflow. Deterministic code owns every public pass/fail verdict; the receipt records requested configuration, not independently attested served-model identity.
>
> The passing retained repair shown in the demo is a separate reference artifact; the GPT-5.6 proposal remains quarantined and is not installed.
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
