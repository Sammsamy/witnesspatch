# WitnessPatch

**Compile a time-fenced healthcare-agent contract failure into a red regression, then verify a review-gated target repair.**

WitnessPatch is synthetic developer safety tooling for teams building patient-facing healthcare agents. Codex workflows configured to request GPT-5.6 Sol with Ultra reasoning assist implementation and fixture/repair authoring; deterministic software owns every displayed verdict. The post-start V2 reference demonstrates a real executable policy change, an exact-fact negative control, a portable static witness compiler, and browser-side verification that fails closed.

The reference case is not clinical decision support, does not process patient data, and does not certify clinical safety. Licensed-physician review and external health-AI builder validation are still pending.

## The 75-second proof

1. A fully synthetic agent receives facts on a locked timeline.
2. At T+02 it knows the patient is eight days postpartum, has a persistent unrelieved headache, and reports visual changes, but it delays the declared urgent route.
3. Locked, source-ID-linked action contracts score the baseline `50/100` with two critical failures.
4. The live browser compiler hashes the exact synthetic case and failing run, freshly regrades them, and turns the earliest failed critical contract into an exportable nine-file red regression ZIP plus a static recorded-decision witness, reducing the T+02 predicate from 9 facts to 3 while holding recorded decisions fixed. Its generated files match the Node compiler byte for byte.
5. A retained V2 reference patch changes the executable target policy, not the case or grader.
6. The unchanged urgent fixture passes at `100/100`; an exact-fact negative control remains at `100/100`; and an always-escalate mutant fails at `25/100`.
7. Only after the red bundle exists does the browser verify `23/23` exact retained-artifact hashes, freshly regrade both reference runs, and rerun `4/4` reference software holdouts before showing the repaired state.
8. It separately interprets the fresh post-start candidate's declarative JSON IR for `2/2` case regrades and `4/4` mutation holdouts without executing retained JavaScript; the Node verifier executes that quarantined candidate and checks the same exact signature.

Those checks establish the declared synthetic software behavior only. They do not establish semantic completeness, diagnosis, treatment, physician review, or real-world safety.

## Run it without an API key

Requires Node.js 22.15 or newer; `.nvmrc` pins the minimum version exercised by the repository.

```bash
npm ci
npm run artifacts:v2:verify
npm run verify:release
npm run dev
```

Open `http://localhost:3000`. First select **Compile failure**: the browser verifies the exact case and baseline bytes, applies the same schema and semantic input validation as Node, freshly regrades the failure, and materializes the nine-file red bundle—including the generated `node:test` regression, receipt, and manifest. **Export complete 9-file ZIP** downloads the usable bundle. Then select **Verify retained repair**. The browser hashes the complete 23-artifact same-build V2 profile, checks its case fingerprint, recomputes the 9→3 static witness, regrades the two retained reference runs, and reruns four reference holdouts locally. It also verifies the fresh model receipt, exact input and prompt links, proposal, compiled candidate, and patch, then safely interprets the declarative JSON IR across two cases and four mutation holdouts. It does **not** execute the generated test or retained JavaScript candidates, rerun a target, invoke a model, or apply either patch in-browser; `npm run artifacts:v2:verify` performs the Node-side policy execution and exact-signature checks. Any compilation or verification error fails closed and leaves the failing baseline active.

The verifier's trust anchor is the manifest shipped with the same app build; it is an integrity check, not a publisher signature. Judges need no OpenAI API key, model call, database, or hosting login to inspect or replay the reference.

The current two-stage build passed a real Chrome replay with a visible `50 → nine-file RED bundle → 100` flow: `2/2` exact compiler inputs, `INV-02` at T+02, `9→3` facts, `23/23` retained artifact responses, reference `2/2` regrades plus `4/4` holdouts, fresh-candidate IR `2/2` plus `4/4`, all artifact requests HTTP 200, and zero console warnings or errors. The downloaded ZIP passed `unzip -t` for all nine files; its default regression exited red and the supplied repaired candidate exited green. Release-code checkpoint `15f1aee` passed `npm ci` followed by `npm run verify:release` from a fresh local clone on Node 24.14.0: `104/104` core tests, `5/5` rendered-product tests, build, lint, typecheck, the 624-package/15-static-package license gate, byte-identical deployed notices, and a 56-file Wrangler dry run. At checkpoint `a056fe3`, the earlier documented path also passed from fresh local clones on macOS with Node 22.15.0 and Node 24.14.0. See the [clean-checkout receipt](docs/CLEAN_CHECKOUT_RECEIPT.md). The exact submitted commit must still be replayed after the repository and submission documentation are frozen; these remain local macOS results, not Linux or Windows verification.

The release bundle can also be built and checked without publishing:

```bash
npm run deploy:dry-run
```

Publication remains an explicit release action. The official rules require free, unrestricted judge access through judging, so any final deployment and repository visibility choice must be verified before submission.

### Verified platform boundary

| Surface | Current evidence | Claim boundary |
| --- | --- | --- |
| Source install and release verification | Release-code checkpoint `15f1aee` passed from a fresh local clone on macOS 26.5.2 Apple silicon with Node 24.14.0 and npm 11.9.0; earlier checkpoint `a056fe3` also passed on Node 22.15.0 and 24.14.0 | macOS is verified; rerun the exact submitted commit after final freeze |
| Browser replay | Two-stage live compile and retained-repair verification passed a real Chrome session on macOS with zero console warnings or errors | Chrome on macOS is verified; no broad browser matrix is claimed |
| Static hosting package | Wrangler dry run passes with 56 static files | Packaging is verified; no public deployment exists yet |
| Linux | GitHub Actions workflow is authored but has never run publicly | Unverified |
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
  --case cases/v2/postpartum-warning-signs.json \
  --run engine/fixtures/v2/postpartum-warning-signs-baseline.input.json \
  --out-dir output/compiled-witness-v2
```

It independently regrades the supplied run, selects the earliest failed critical action invariant by default, records earlier noncritical and coincident failures, and emits canonical snapshots, a failing prefix, static witness, red `node:test` regression, receipt, and exact-byte SHA-256 manifest. It refuses existing or symlinked output paths and invokes neither a model nor a target adapter.

The compiler holds the supplied decisions fixed while reducing fact identifiers for the encoded contract predicate. Its result is a static recorded-decision contract witness. It is not target-in-loop minimization, a counterfactual claim about what the agent would do on changed inputs, or clinical minimality.

From the repository root, a generated regression auto-detects `./bin/witnesspatch.mjs`; from any other working directory it falls back to `witnesspatch` on `PATH`. `WITNESSPATCH_CLI` can override either choice. The first command below is expected to fail on `INV-02`; the second proves the same test turns green for the supplied repaired run:

```bash
node --test output/compiled-witness-v2/regression.test.mjs

WITNESSPATCH_CANDIDATE="$PWD/engine/fixtures/v2/postpartum-warning-signs-repaired.input.json" \
  node --test output/compiled-witness-v2/regression.test.mjs
```

## What GPT-5.6 contributes—and what it cannot do

The default Codex workflow requests GPT-5.6 Sol with Ultra reasoning and is used to build and audit the post-start extension. It assists with code, adversarial tests, fixture wording, and declarative repair exploration. It cannot edit the locked result at runtime:

- the case, timeline, and action contracts are retained inputs;
- deterministic code recomputes grades and holdouts;
- the target patch is inspectable and installation remains review-gated;
- the browser fails closed if artifacts or declared expectations drift.

The unchanged pre-start V1 Sol candidate is preserved only as lineage. Under V2 it scores `85/100` on the urgent fixture and cannot execute the exact-fact negative control, so it is rejected rather than relabeled as a V2 model result.

A separate post-start Codex CLI run requested `gpt-5.6-sol` with `ultra` reasoning through ChatGPT-plan authentication. It produced schema-constrained declarative JSON that fixed code compiled into a distinct candidate. That candidate is quarantined and was not installed. The urgent and exact-control contracts were supplied to the run; the four-check holdout definition and checked-in repaired policy were not. Browser-safe IR interpretation and Node execution both match the exact `2/2` case and `4/4` software-holdout signature. The receipt records the requested model and reasoning effort; it is not independent attestation of served-model identity. Its empty `credential_environment_scrubbed` list means no matching credential variables were present to remove, not that active secrets were scrubbed.

The retained V2 reference repair and the fresh candidate remain separate evidence. Neither passing result is clinical validation, proof of generalization, or permission to install a model-authored patch without review.

| AI-accelerated work | Human decision retained |
| --- | --- |
| Codex implemented and attacked the post-start compiler, browser verifier, test suite, and release workflow | The team chose the problem, narrowed the claim, rejected causal and clinical overclaims, and owns every submitted line and product decision |
| A fresh Codex CLI workflow requested GPT-5.6 Sol with Ultra reasoning to produce one schema-constrained declarative repair candidate | The team authored the contracts and fixed compiler, withheld the holdout definition, quarantined the candidate, and did not install it |
| Codex helped enumerate adversarial verifier attacks and release checks | Deterministic code executes every displayed grade; AI commentary cannot change the verdict |
| GPT-5.6 output is retained byte-for-byte with prompt/input links and hashes | The retained reference repair is separately inspectable and is never relabeled as the fresh model candidate |

```text
synthetic case + locked action contracts
                  │
       Codex (Sol/Ultra requested) assists
         implementation and authoring
                  │
        executable target policy
                  │
       deterministic grading kernel
                  │
 static recorded-decision contract witness
                  │
      red regression + target patch
                  │
 urgent fixture + exact-fact negative control
                  │
 reference + quarantined candidate receipts
```

## Clinical claim boundary

The V2 blood-pressure behavior covers exactly two authored endpoints: `118/74` and `168/112`. Their classifications are supplied by the fixtures. The grader does **not** infer a numeric threshold, and the project does not test middle, borderline, discordant, measurement-accuracy, or repeat-reading behavior.

The exact-fact negative control activates only when every authored fact in that fixture is present. Its purpose is to reject one always-escalate mutation. Passing it does not prove a patient is benign, rule out illness, or establish that real-world care can be deferred.

The declared rules link to current public guidance from:

- [CDC Hear Her — Urgent Maternal Warning Signs](https://www.cdc.gov/hearher/maternal-warning-signs/index.html)
- [Alliance for Innovation on Maternal Health — Urgent Maternal Warning Signs](https://saferbirth.org/aim-resources/aim-cornerstones/urgent-maternal-warning-signs/)
- [AIM Obstetric Emergency Readiness Resource Kit](https://saferbirth.org/wp-content/uploads/2023-aim-oerrk.pdf)
- [ACOG — Headaches and Pregnancy](https://www.acog.org/womens-health/faqs/headaches-and-pregnancy)
- [ACOG — Preeclampsia and High Blood Pressure During Pregnancy](https://www.acog.org/womens-health/faqs/preeclampsia-and-high-blood-pressure-during-pregnancy)

The software verifies that declared source IDs resolve; it does not prove that a rule is semantically complete or clinically correct. See the [validation plan](docs/VALIDATION_PLAN.md) and [external review packet](docs/EXTERNAL_REVIEW_PACKET.md).

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

The [OpenAI Build Week Official Rules](https://openai.devpost.com/rules) allow an existing project only when it is meaningfully extended with Codex and/or GPT-5.6 after the July 13, 2026 submission start; only the post-start additions are judged. WitnessPatch therefore discloses its pre-start V1 prototype and presents the portable compiler, fail-closed browser verifier, and clinically narrower V2 namespace as the Build Week work. See [the before/after ledger](docs/BUILD_WEEK_PROVENANCE.md).

## Safety and privacy

- Synthetic data only; do not add protected health information.
- Developer tooling only; never present output to patients as medical advice.
- No automated medical decision is made: the tool evaluates authored software contracts, and every proposed repair remains subject to human review.
- Test only the included reference adapter or systems whose owners have authorized testing; WitnessPatch is not for unsolicited safety testing.
- No claim of HIPAA compliance, clinical validation, regulatory clearance, or production readiness.
- Codex credentials and private traces must never be committed or exposed by the app.
- Every visible pass must be reproducible from retained inputs and executable checks.

See the [OpenAI Build Week submission checklist](docs/SUBMISSION_FORM_CHECKLIST.md) for the remaining human, repository, video, and release gates.

## License

The current Build Week release plan is a public static demo plus a private source repository shared with the two required judging accounts. WitnessPatch source remains all rights reserved; third-party components retain the licenses and notices recorded in `THIRD_PARTY_NOTICES.md`. If the team later chooses a public source repository, it must first select a deliberate project license and repeat the distribution-scoped audit.
