# WitnessPatch

**When an AI agent acts too late, WitnessPatch turns the exact miss into a test.**

Give WitnessPatch a synthetic case with timestamped facts and a WitnessPatch run file that records what an agent said and did. It finds the first required action the agent missed, then exports that failure as a standard `node:test` package developers can keep in CI. Teams can import up to six structured run files tagged with different model names and check all of them against the same rules. The app does not call a model, and model labels from imported files are marked as unverified.

Codex helped build the compiler and write adversarial tests. A separate workflow requested GPT-5.6 Sol with Ultra reasoning to return repair data in a restricted JSON format. The software calculates every displayed result. The recorded request does not independently prove which model was served.

[Live demo](https://witnesspatch.ankigpt.workers.dev) | [Public MIT repository](https://github.com/Sammsamy/witnesspatch) | [Current default-branch CI](https://github.com/Sammsamy/witnesspatch/actions/workflows/verify.yml?query=branch%3Acodex%2Fbuild-week)

![The original run fails, the repaired run passes, and an overreacting version is rejected](submission/media/05-reference-success-closure.png)

The reference case is not clinical decision support, does not process patient data, and does not certify clinical safety. No physician review or clinical validation was performed; clinical validation is not claimed.

## The judge proof

1. The synthetic case reveals facts over time.
2. At minute two, the agent has enough facts to act but tells the user to wait.
3. WitnessPatch turns that missed deadline into a Node test.
4. The original run fails the test, and the separate example repair passes it.
5. Four extra checks reject an overreacting version that treats every case as urgent.

The downloadable package contains the case, failed run, evidence, receipt, and test. It runs without the original agent or a model call. These checks cover only the authored synthetic rules. They do not prove clinical correctness or real-world safety.

The [threat model](docs/THREAT_MODEL.md) maps concrete tampering and resource-exhaustion attacks to the exact failing checks, and separates bundle integrity from publisher authenticity, clinical correctness, and host compromise.

## Run it without an API key

Requires Node.js 22.15 or newer; `.nvmrc` pins the minimum version exercised by the repository.

For the shortest judge path, install the dependencies and run one command. It creates a nine-file test from the failed run, confirms that the original still fails and the example repair passes, then rejects a deliberately overreacting version:

```bash
npm ci
npm run judge:proof
```

Expected six-line proof:

```text
WITNESSPATCH JUDGE PROOF PASS
1 COMPILE  9-file red regression, INV-02 at T+02
2 RED      baseline failed the compiled regression as required, exit 1
3 GREEN    retained repair passed that same regression, exit 0
4 MUTATION FAIL (expected), always-escalate rejected at 25/100
BOUNDARY   synthetic software proof only, with no clinical validation or runtime model call
```

The final failure is expected: the deliberately overreacting version must fail. The command uses only saved synthetic files and local software. It makes no model or network call and is not clinical validation.

```bash
npm run artifacts:v2:verify
npm run verify:release
npm run dev
```

Open `http://localhost:3000`. Select **Turn failure into test** to create and export the nine-file package. Then select **Check example repair** to recalculate both saved runs and run four extra checks. The browser never runs saved JavaScript, calls a model, reruns the original agent, or applies a patch. `npm run artifacts:v2:verify` runs the saved JavaScript in Node and confirms that its results match. Any error leaves the failed run visible.

### Compare saved runs

Select **Compare your runs** in the top bar. Choose one synthetic `case.json` and up to six WitnessPatch `run.json` files. Confirm that the files contain no patient or production data, then select **Compare saved runs**. WitnessPatch checks every file against the same case and rules. Select a failed run and choose **Create test from selected failure** to export its nine-file test package.

Each result comes from a separate imported file. Changing the selection changes the file being checked, not just its label. Model names and reasoning settings come from the file and appear as unverified. Passing runs can be compared, but only failed runs can become tests.

Selected bytes are processed in the browser and are not submitted by WitnessPatch. Each file is limited to 512 KiB. The receipt says `2 hashes computed, 0 externally verified`. Local SHA-256 values identify the exported files, but they do not prove who created them. WitnessPatch checks the synthetic data declarations in its schemas but cannot detect undisclosed patient information or prove deidentification. The fixed maternal reference remains available as a one click judge path.

The verifier's trust anchor is the manifest shipped with the same app build; it is an integrity check, not a publisher signature. Judges need no OpenAI API key, model call, database, or hosting login to inspect or replay the reference.

The prior public checkpoint passed its own production Chrome replay. The current plain-language build now has a fresh local desktop and mobile replay, new screenshots, a 167-second silent screen master, and the static fingerprint below. It still needs a commit, current public CI, deployment byte matching, and a founder-narrated final video. The historical checkpoint remains in the [clean checkout receipt](docs/CLEAN_CHECKOUT_RECEIPT.md).

Exact candidate `87dee97` passed `npm ci` followed by `npm run verify:release` from fresh clones on macOS 26.5.2 arm64 with Node 24.14.0/npm 11.9.0 and a local Debian 12 arm64 container with Node 22.23.1/npm 10.9.8. macOS passed all `158/158` aggregate test executions: `136/136` core, `6/6` rendered-product, `1/1` real development-server HTTP smoke, `9/9` submission-package, and `6/6` deployment-rendered checks. Debian passed `157/158`, with only the expected case-insensitive-filesystem check skipped on its case-sensitive filesystem. Both passed the zero-argument judge proof, detached-bundle verification coverage, threat-model boundary check, build, lint, typecheck, the distribution-license gate, byte-identical bundled third-party notices, and a 59-asset Wrangler dry run. Their physical 55-file `dist/client` snapshots matched byte-for-byte; the SHA-256 of each canonical 55-line manifest was `1133339d1b372491084a06f889acd97399f2de2988d6267eb13baa48dd4b3721`. CI also promotes the six-line proof to the GitHub job summary and retains it as a release artifact. `npm run verify:release` fails if the built client differs from that reviewed fingerprint. The submission gate also binds the recaptured media assets to thirteen rendered/computed source fingerprints. See the [clean-checkout receipt](docs/CLEAN_CHECKOUT_RECEIPT.md). Every final tip must receive public CI and the final replay; Windows remains unverified.

Prior independently verified static-release checkpoint `7dd4df9275d5df75f6da4bc4c3722fdc92a2138e` passed the full local release verifier: macOS `158/158` aggregate executions, license inventory, build, lint, typecheck, and a 59-asset Cloudflare dry run. Its exact public `Verify` push run [`29781423832`](https://github.com/Sammsamy/witnesspatch/actions/runs/29781423832) passed, GitHub detected MIT, and all 51 public files byte-matched the deployment. The unchanged 55-file client incorporates the security-updated dependency lock, corrected distributed notice, final public claim, narration, and release-gate cleanup and is locked to static fingerprint `9238879c5d87b96557f0988af01c0998fb185dbe56ff533b1e6e5605e60e595a`; `.assetsignore`, `.vite/manifest.json`, `404.html`, and `_headers` are generated hosting-control files rather than public assets. The final freeze will recheck the then-current default-branch tip, public CI, deployed bytes, video, and `/feedback` record together.

The current plain-language working tree builds to 55 files with local static fingerprint `4a5bc546ef3b55c76b48b7901432cbe17f6c5b4c192d8eee5259aacb4931e509`. That hash is local review evidence only until the current tip is committed, checked by public CI, and deployed.

The release bundle can also be built and checked without publishing:

```bash
npm run deploy:dry-run
```

The earlier `148.000` second screen master and its Piper narrated candidate show the prior interface. They are superseded historical evidence and must not be uploaded or used for founder recording. Their hashes remain in the repository only to document the earlier checkpoint. The Apple System Voice rehearsal also remains prohibited from public sharing under the [macOS license](https://www.apple.com/legal/sla/docs/macOSTahoe.pdf).

A founder-narrated video is still required. The reviewed silent screen master is `output/playwright/witnesspatch-founder-screen-master-v9-plain-copy.mp4`: `167.000` seconds, H.264 at `1400 x 900`, SHA-256 `1876dd490082d9de93901ebe411b4a1d63e6f3c85ceaa7f6a579deb2fa7014bf`. The entrant must record the approved script, then review the complete assembled video with headphones before upload.

The preflight command must fail for this working tree because it is still tied to the old media and fingerprint. After the new deployment and media are recorded, it will rerun the automated checks and leave the public video, `/feedback`, and final submission as human steps.

```bash
npm run release:preflight
```

After the repository, deployment, YouTube video, and `/feedback` ID are ready, run `release:freeze`. It checks the clean commit, public CI, deployed files, local video format and hash, YouTube reachability, and required entrant confirmations, then writes the final receipt. The founder-voice route is:

```bash
npm run release:freeze -- \
  --repository-url "PUBLIC_GITHUB_URL" \
  --deployment-url "PUBLIC_DEPLOYMENT_URL" \
  --video-url "PUBLIC_YOUTUBE_URL" \
  --video-file "LOCAL_FINAL_VIDEO_PATH" \
  --feedback-session-id "CODEX_FEEDBACK_SESSION_ID" \
  --feedback-confirmed \
  --video-public-confirmed \
  --founder-voice-confirmed \
  --narration-human-reviewed-confirmed
```

For an AI-generated voice, omit `--founder-voice-confirmed` and use all three flags below. Before doing so, the delivered video itself must identify the AI narration, its public YouTube description must say that it uses an AI-generated voice, and the entrant must watch and listen to the complete uploaded cut for script accuracy, pronunciation, intelligibility, and synchronization. The same human-review flag is mandatory for founder narration:

```bash
  --ai-narration-confirmed \
  --ai-narration-disclosed-confirmed \
  --narration-human-reviewed-confirmed
```

The gate rejects missing or mixed narration modes and records the selected mode and confirmations in the receipt. It does not infer speaker identity, inspect the words in the audio, verify the public disclosure automatically, or prove that YouTube serves the same bytes as the local file.

The command refuses to overwrite a prior final receipt. Preserve an unsuccessful or superseded freeze before starting a separately labeled attempt.

The entrant authorized a public source release under the MIT License plus a public static demo. The checkout carries that license in `LICENSE`, `package.json`, and `package-lock.json`; logged-out source access, detected MIT metadata, exact-commit CI, and byte-matched deployment were verified for the latest public checkpoint. `release:freeze` must re-prove each condition for the exact final submitted commit.

### Verified platform boundary

| Surface | Current evidence | Claim boundary |
| --- | --- | --- |
| Source install and release verification | Static-release checkpoint `7dd4df9` passes the complete verifier on macOS (`158/158`) plus exact-commit `Verify` push run `29781423832`; prior source checkpoint `87dee97` also passed local Debian 12 arm64 (`157/158`, one expected filesystem skip) | The exact final submitted commit still requires its own release freeze; Windows remains unverified |
| Browser replay | A fresh local production-Chrome session passed the current reference and saved-run paths. It fetched the three included JSON files, switched the selected saved run, created the failed run's nine-file test, recorded zero console warnings or errors, and had no horizontal overflow at 390 x 844. | Local Chrome on macOS is verified for these paths. Current public deployment matching and a broad browser matrix are not claimed. |
| Static hosting package | The prior public checkpoint is live and its 51 public assets matched that reviewed build. | The current plain-language build still needs its own commit, CI run, deployment, and byte match. |
| Linux | Fresh-clone commit `87dee97` passes locally in a Debian 12 arm64 container with Node 22.23.1; `157/158` aggregate tests pass and the one case-insensitive-filesystem test is expectedly skipped | This is one local Linux environment, not a browser matrix; Windows remains unverified |
| Windows | No clean checkout or browser run | Unverified |

## Portable evaluator and compiler

The JSON-only evaluator freshly grades raw run inputs and exits `0` for pass, `1` for a valid deterministic failure, and `2` for invalid input:

```bash
npm run witnesspatch -- evaluate \
  --case cases/v2/postpartum-warning-signs.json \
  --candidate engine/fixtures/v2/postpartum-warning-signs-repaired.input.json \
  --out output/evaluated-v2.json
```

The compiler converts a supported failing action-invariant trace into an atomic witness bundle:

```bash
npm run witnesspatch -- compile \
  --case public/runs/v2/postpartum-warning-signs-case.json \
  --run public/runs/v2/postpartum-warning-signs-baseline.json \
  --out-dir output/compiled-witness-v2 \
  --fact-scope failure-prefix
```

It independently regrades the supplied run, selects the earliest failed critical action invariant by default, records earlier noncritical and coincident failures, and emits canonical snapshots, a failing prefix, static witness, red `node:test` regression, receipt, and exact-byte SHA-256 manifest. With the two exact manifest-listed public inputs and `--fact-scope failure-prefix` above, the shipped CLI emits the same nine bytesets as the browser export. Use `--fact-scope full-trace` to begin reduction from every authored timeline fact instead. The CLI refuses existing or symlinked output paths and invokes neither a model nor a target adapter.

Verify a detached bundle before running its regression:

```bash
npm run witnesspatch -- verify --bundle output/compiled-witness-v2
```

The verifier rejects extra, missing, linked, or non-regular files; invalid UTF-8/JSON and schemas; broken case/run/rule links; hash or byte-count mismatches; nondeterministic evaluations; and any bytes that do not reproduce the compiler-exact nine-file bundle. A pass establishes local bundle consistency, not publisher identity, origin, or external provenance.

The compiler holds the supplied decisions fixed while reducing fact identifiers for the encoded contract predicate. Its result is a static recorded-decision contract witness. It is not target-in-loop minimization, a counterfactual claim about what the agent would do on changed inputs, or clinical minimality.

From the repository root, a generated regression auto-detects `./bin/witnesspatch.mjs`; from any other working directory it falls back to `witnesspatch` on `PATH`. `WITNESSPATCH_CLI` can override either choice. The first command below is expected to fail on `INV-02`; the second proves the same test turns green for the supplied repaired run:

```bash
node --test output/compiled-witness-v2/regression.test.mjs

WITNESSPATCH_CANDIDATE="$PWD/engine/fixtures/v2/postpartum-warning-signs-repaired.input.json" \
  node --test output/compiled-witness-v2/regression.test.mjs
```

## What GPT-5.6 contributes and what it cannot do

The default Codex workflow requests GPT-5.6 Sol with Ultra reasoning and is used to build and audit the post-start extension. It assists with code, adversarial tests, fixture wording, and declarative repair exploration. It cannot edit the locked result at runtime:

- the case, timeline, and action contracts are retained inputs;
- deterministic code recomputes grades and holdouts;
- the target patch is inspectable and installation remains review-gated;
- the browser fails closed if artifacts or declared expectations drift.

The unchanged pre-start V1 Sol candidate is preserved only as lineage. Under V2 it scores `85/100` on the urgent fixture and cannot execute the exact-fact negative control, so it is rejected rather than relabeled as a V2 model result.

A post-start Codex run requested `gpt-5.6-sol` with `ultra` reasoning and returned restricted JSON. WitnessPatch converted it into a separate candidate and tested it on two cases plus four checks the model had not received. The candidate was never installed. The receipt records the requested settings, not which model actually answered.

The retained V2 reference repair and the fresh candidate remain separate evidence. Neither passing result is clinical validation, proof of generalization, or permission to install a model-authored patch without review.

| AI-accelerated work | Human decision retained |
| --- | --- |
| Codex implemented and attacked the post-start compiler, browser verifier, test suite, and release workflow | The entrant chose the problem, narrowed the claim, rejected causal and clinical overclaims, and owns every submitted line and product decision |
| A fresh Codex CLI workflow requested GPT-5.6 Sol with Ultra reasoning to produce one schema-constrained declarative repair candidate | The entrant authored the contracts and fixed compiler, withheld the holdout definition, quarantined the candidate, and did not install it |
| Codex helped enumerate adversarial verifier attacks and release checks | Deterministic code executes every displayed grade; AI commentary cannot change the verdict |
| GPT-5.6 output is retained byte-for-byte with prompt/input links and hashes | The retained reference repair is separately inspectable and is never relabeled as the fresh model candidate |

```text
Synthetic case and fixed rules
  -> Codex-assisted implementation
  -> recorded run
  -> software grading
  -> failing Node test
  -> separate repair checks
```

## Clinical claim boundary

The V2 blood-pressure behavior covers exactly two authored endpoints: `118/74` and `168/112`. Their classifications are supplied by the fixtures. The grader does **not** infer a numeric threshold, and the project does not test middle, borderline, discordant, measurement-accuracy, or repeat-reading behavior.

The exact-fact negative control activates only when every authored fact in that fixture is present. Its purpose is to reject one always-escalate mutation. Passing it does not prove a patient is benign, rule out illness, or establish that real-world care can be deferred.

The declared rules link to current public guidance from:

- [CDC Hear Her: Urgent Maternal Warning Signs](https://www.cdc.gov/hearher/maternal-warning-signs/index.html)
- [Alliance for Innovation on Maternal Health: Severe Hypertension in Pregnancy Patient Safety Bundle](https://saferbirth.org/psbs/severe-hypertension-in-pregnancy/)
- [ACOG: Headaches and Pregnancy](https://www.acog.org/womens-health/faqs/headaches-and-pregnancy)
- [ACOG: Preeclampsia and High Blood Pressure During Pregnancy](https://www.acog.org/womens-health/faqs/preeclampsia-and-high-blood-pressure-during-pregnancy)
- [ACOG: 3 Conditions to Watch for After Childbirth](https://www.acog.org/womens-health/experts-and-stories/the-latest/3-conditions-to-watch-for-after-childbirth)

The software verifies that declared source IDs resolve; it does not prove that a rule is semantically complete or clinically correct. The [clinical claim audit](docs/CLINICAL_CLAIM_AUDIT.md) maps every remaining medical statement to primary public guidance or an explicit non-claim boundary. No physician fixture/wording review was performed. The [external review packet](docs/EXTERNAL_REVIEW_PACKET.md) defines what evidence a future review would need, and the [33-minute builder packet](docs/BUILDER_REVIEW_PACKET.md) makes that software review reproducible; neither is completed submission evidence.

## Repository map

```text
app/                 product UI and fail-closed browser replay
bin/                 JSON-only evaluator and static witness compiler CLI
cases/v2/            post-start synthetic V2 cases and locked rules
contracts/           machine-readable artifact contracts
engine/              deterministic grading, holdouts, build, and verification
public/runs/v2/       post-start hash-listed V2 artifact bundle
public/runs/          immutable pre-start V1 lineage plus V2 namespace
targets/demo-agent/v2 executable V2 target policies and exact patch
proof/                preserved pre-start V1 lineage and post-start V2 capture
.codex/               bounded project roles and repository workflow skill
docs/                 requirements, provenance, demo, and validation records
```

## Build Week provenance

Under the [official rules](https://openai.devpost.com/rules), only meaningful post-start extensions are judged. WitnessPatch discloses its pre-start V1 prototype. Build Week work includes the portable test maker, browser checker, narrower V2 fixtures, and saved-run comparison; the [before-and-after ledger](docs/BUILD_WEEK_PROVENANCE.md) separates old and new work.

## Safety and privacy

- Synthetic data only; do not add protected health information.
- Developer tooling only; never present output to patients as medical advice.
- No automated medical decision is made: the tool evaluates authored software contracts, and every proposed repair remains subject to human review.
- Test only the included reference adapter or systems whose owners have authorized testing; WitnessPatch is not for unsolicited safety testing.
- No claim of HIPAA compliance, clinical validation, regulatory clearance, or production readiness.
- Codex credentials and private traces must never be committed or exposed by the app.
- Every visible pass must be reproducible from retained inputs and executable checks.

The remaining external release gates are complete entrant audition, a public narrated YouTube demo, the Codex-returned `/feedback` Session ID, and a final release freeze that rechecks exact-tip CI and deployed bytes. Devpost submission remains a separate entrant-controlled action.

## License

The Build Week release plan is a public static demo plus a public MIT-licensed source repository. Third-party components retain the licenses and notices recorded in `THIRD_PARTY_NOTICES.md`. The MIT license applies to WitnessPatch source authored or controlled by the entrant; it does not replace upstream third-party terms.
