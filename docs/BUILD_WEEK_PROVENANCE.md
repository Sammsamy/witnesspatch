# Build Week before/after provenance

The [OpenAI Build Week Official Rules](https://openai.devpost.com/rules) set the Submission Period start at July 13, 2026, 9:00 AM PDT (`11:00 AM CDT`). Existing projects are eligible only when meaningfully extended with Codex and/or GPT-5.6 after that time, and only those post-start additions are judged.

WitnessPatch therefore presents a disclosed before/after extension—not a whole-project-from-scratch claim. Times below are Central Daylight Time (`-0500`) unless stated otherwise.

## Pre-start V1 baseline — not claimed as Build Week work

Before `11:00 AM CDT`, the local project already contained:

- the V1 deterministic evaluator and original synthetic postpartum fixture;
- the original executable demo target and reference repair;
- the original static product shell;
- the V1 16-file artifact set and `public/runs/manifest.json`, whose fixed `generated_at` is `2026-07-13T07:15:00.000Z` (`2:15 AM CDT`);
- the captured V1 candidate from a Codex run that requested `gpt-5.6-sol` / `ultra`, plus its historical 113.770-second receipt;
- the original normal-BP V1 fixture and 13-check suite; and
- initial browser screenshots and rehearsal artifacts.

The retained pre-start V1 manifest hash is:

```text
d37a71a30230682a665141d68739f10b467ac6110a4bdf240aaf88463eef0a97  public/runs/manifest.json
```

V1 remains lineage. Its normal-BP fixture is not used as the V2 “benign” claim, its 13 checks are not presented as V2 holdouts, and its captured Sol candidate is not presented as the V2 repair.

## Post-start meaningful extension 1 — portable compiler

Created after the cutoff:

- `engine/compile-witness.mjs` — birth `11:57:49 AM`; modified `12:05:25 PM`;
- `contracts/compiled-witness.schema.json` — `12:05:10 PM`;
- `contracts/witness-bundle-manifest.schema.json` — `12:05:10 PM`;
- compiler CLI integration plus schema, portability, renamed-ID, path, symlink, atomicity, and red/green regression tests.

The compiler independently regrades a supplied case and recorded run, selects the earliest failed critical action invariant by default, and emits an atomic hash-listed bundle without invoking a model or target adapter. It holds the supplied decisions fixed while reducing the encoded fact predicate. The result is a static recorded-decision contract witness—not target-in-loop minimization, a counterfactual target claim, or clinical minimality.

## Post-start meaningful extension 2 — fail-closed browser proof

Created after the cutoff:

- `engine/grading-kernel.mjs` — `12:09:03 PM`;
- `engine/holdout-kernel.mjs` — `12:09:50 PM`;
- `engine/browser-verifier.mjs` — `12:12:12 PM`;
- `engine/tests/browser-verifier.test.mjs` — `12:09:40–12:10:16 PM`;
- fail-closed UI integration in `app/components/witnesspatch-lab.tsx` — modified `12:13:11 PM`.

The browser verifier checks safe same-origin artifact paths, exact bytes and SHA-256 values, case fingerprint, two fresh evaluations, and declared holdouts before it may display a repaired score. Attack coverage includes same-length tampering, truncation, missing files, redirects, traversal/cross-origin paths, falsified evaluations, falsified holdout expectations, and missing WebCrypto. The trust anchor is the same-build manifest; it is not a publisher signature.

The current V2 browser path verifies `23/23` exact hashes. For the retained reference it performs `2/2` fresh regrades, `4/4` V2 holdouts, full 9→3 counterexample recomputation, and target-receipt cross-checking. For the fresh candidate it validates the retained prompt/compiler links and safely interprets declarative JSON IR across `2/2` cases and `4/4` mutation holdouts without executing retained JavaScript. Final real-Chrome QA recorded a genuine reference `50 → 100` transition, `23/23` HTTP 200 artifact responses, both exact proof signatures, and zero console warnings or errors.

## Post-start meaningful extension 3 — clinically narrower V2

V2 began after `12:19 PM` in additive namespaces and does not mutate or relabel V1 evidence:

- V2 authored cases — born `12:19:30 PM`;
- executable V2 target policies — born from `12:21:40 PM`;
- V2 clinical-scope tests — born `12:23:59 PM`;
- V2 artifact builder — born `12:26:27 PM`;
- V2 artifact verifier — born `12:27:23 PM`;
- dedicated V2 browser-verifier test — born `12:30:18 PM`;
- `public/runs/v2/manifest.json` — born `12:33:58 PM`.

V2 adds:

- an exact-fact negative control that rejects one always-escalate mutation without calling a patient benign or proving safe deferral;
- fixture-supplied blood-pressure classifications for exactly `118/74` and `168/112`;
- an explicit statement that numeric thresholds and middle, borderline, discordant, measurement-accuracy, and repeat-reading behavior are not inferred or tested;
- bidirectional lexical marker checking so urgent wording cannot hide behind safe action labels;
- a numeric-inference contradiction marker;
- four V2 mutation checks; and
- a 23-artifact manifest linking post-start V2 proof, the fresh quarantined candidate record, and immutable V1 lineage.

The current V2 manifest hash is:

```text
c9fb456837b1f12b0c9c8a24558fdbca9360cda1be5ced6b7cdc4d3650709522  public/runs/v2/manifest.json
```

## Honest model-lineage and post-start capture

The unchanged pre-start V1 Sol candidate is re-executed against V2 rather than relabeled:

- urgent V2 result: `85/100`, failed `INV-04`;
- exact-fact negative-control result: `not_executable`;
- V2 acceptance: `false`;
- candidate modified for V2: `false`.

The retained, inspectable reference target patch remains the source of the primary `50 → 100` product transition. It is not relabeled as model-generated.

A distinct post-start Codex CLI capture ran from `2026-07-13T17:49:55.322Z` through `2026-07-13T17:51:40.867Z`. Its receipt records a request for `gpt-5.6-sol` with `ultra` reasoning through confirmed ChatGPT-plan authentication, an isolated read-only/tool-disabled execution, schema-constrained declarative output, and no automatic installation. The urgent and exact-control contracts were supplied; the four-check holdout definition and checked-in repaired policy were not. Fixed code compiled the proposal into a distinct quarantined candidate, and deterministic verification matches urgent `100/100`, exact control `100/100`, and `4/4` mutation signatures.

The 23-artifact manifest retains the receipt, proposal, reconstructed prompt, exact baseline/holdout/schema inputs, candidate, and patch. The browser interprets JSON IR and never executes the fresh JavaScript; the Node verifier executes it and checks the exact signature. The receipt records the model requested from the CLI, not an independent served-model attestation. Its empty credential-scrub list means no matching variables were present to remove. Neither the fresh candidate nor the reference repair is clinical-validation or generalization evidence.

## Evidence sources and remaining provenance actions

- This Codex task contains timestamped post-start implementation and verification calls. The required `/feedback` Session ID must still be captured from this same task before submission.
- File birth/modification times above were recorded with macOS `stat` after the rules appeared.
- V1 and V2 manifests preserve exact artifact bytes and are deterministically rechecked; the same-build V2 manifest is an integrity anchor, not a publisher signature or independent timestamp attestation.
- The finalized profile passes `npm run verify:release`: `94/94` core tests, `4/4` rendered tests, build, lint, typecheck, and Wrangler dry run. `npm audit` reported zero known vulnerabilities at check time. These are local macOS results; Linux and Windows are not verified.
- The first dated post-start Git checkpoint is commit `21405c8e2d3e4d03e36442a1facab96c4ec487a6`, created `2026-07-13T13:15:43-05:00` with subject `Disclose V1 baseline and add post-start WitnessPatch V2 proof`. Because it is the root commit and intentionally contains both the disclosed pre-start V1 lineage and post-start extensions, Git alone does not attest which bytes predated the event; the timestamped Codex task, retained receipts, and this before/after ledger provide that distinction. History must not be rewritten in a way that obscures it.
- The final README must explain Codex acceleration, GPT-5.6 contribution, and the human decisions retained, as required by the rules.

## Claim boundary

The submission must say that WitnessPatch was a pre-existing local V1 prototype meaningfully extended during Build Week. It must not imply that the original evaluator, V1 artifacts, original UI, V1 13-check suite, or captured V1 Sol candidate were created after the Submission Period began. Only the post-start compiler, browser verifier, V2 implementation, fresh post-start candidate record, and subsequent verified work belong in the judged Build Week claim. The receipt establishes a retained local request record; the first dated checkpoint now exists, while the required `/feedback` Session ID and final unrewritten commit history are still needed for submission provenance.
