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

The current V2 browser path verifies `23/23` exact hashes. For the retained reference it performs `2/2` fresh regrades, `4/4` V2 holdouts, full 9→3 counterexample recomputation, and target-receipt cross-checking. For the fresh candidate it validates the retained prompt/compiler links and safely interprets declarative JSON IR across `2/2` cases and `4/4` mutation holdouts without executing retained JavaScript.

The browser proof was then meaningfully extended again in the same post-start task:

- `engine/compile-witness-core.mjs` — born `3:11:22 PM`;
- `engine/browser-witness-compiler.mjs` — born `3:15:05 PM`;
- `engine/input-validation.mjs` — born `3:33:35 PM`;
- `engine/browser-bundle-zip.mjs` — born `3:34:14 PM`;
- browser compiler and ZIP tests — born `3:15:40 PM` and `3:34:14 PM`.

The UI now begins with no pre-rendered generated test. It hash-checks and fully validates the exact case and failing run through the same semantic boundary as Node, compiles an exportable nine-file baseline-red ZIP, and only then unlocks the separate retained-repair verification. Coordinated manifest-rehashed schema attacks fail closed. For the two manifest-listed public inputs, the shipped CLI with `--fact-scope failure-prefix` produces the same nine file contents as the browser; generic inputs and full-trace scope are outside that byte-parity claim. A deterministic ZIP parser independently verifies paths, sizes, CRCs, offsets, and contents.

The same post-start compiler was then extended into a separate judge-supplied-input workspace. It accepts one declared-synthetic case and raw or evaluated run, applies fatal UTF-8 and JSON/schema/semantic validation, freshly grades the run, binds bundle identity to normalized content and both raw-input hashes, limits browser work, and exports the same portable nine-file format. Imported files never enter the authored maternal dashboard or unlock the retained repair. A declaration is required but is explicitly not a PHI scanner or proof of de-identification. Runtime manifest verification is reported separately from the detached bundle: the reference browser session can verify `2/2` manifest inputs, while the byte-identical portable bundle conservatively carries only computed source hashes and an unverified-input declaration so it does not pretend to preserve publisher provenance after export.

The current local production-Chrome desktop replay passed both paths. The reference flow recorded `50 → 2/2 exact manifest inputs → nine-file original-run failure → 100`, `23/23` retained files, both proof signatures, and the four-case original/repair/control/overreaction check. The saved-run flow fetched the three included same-origin JSON files, compared both complete runs, switched the selected file, and created the nine-file test from the failed one. The local ZIP passed `unzip -t`, all nine files were byte-identical to the shipped CLI output, its default regression exited red (`1`), and the supplied repaired candidate exited green (`0`). The final desktop flow recorded zero console warnings and zero console errors. Exact `390 x 844` reference and saved-run checks had no horizontal overflow. This is local evidence for the current working tree, not current public-CI or deployment evidence.

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
3e72fd8cf8edc0a00bbc513eb6bf498d24a550f8717d9df24d2837350f608541  public/runs/v2/manifest.json
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

- This Codex task contains timestamped post-start implementation and verification calls. The final entry still requires the Codex-returned `/feedback` Session ID from the primary build task; the technical task/thread UUID is not a confirmed substitute.
- File birth/modification times above were recorded with macOS `stat` after the rules appeared.
- V1 and V2 manifests preserve exact artifact bytes and are deterministically rechecked; the same-build V2 manifest is an integrity anchor, not a publisher signature or independent timestamp attestation.
- Exact source/media checkpoint `1086426e933cc5f5874cde62232b66f422d52157` passes `npm ci` followed by `npm run verify:release` from fresh clones on macOS 26.5.2 arm64 with Node 24.14.0/npm 11.9.0 and a local Debian 12 arm64 container with Node 22.23.1/npm 10.9.8. macOS passes all `151/151` aggregate test executions; Debian passes `150/151`, with only the expected case-insensitive-filesystem test skipped. Both pass `131` discovered core tests, `6/6` rendered checks, `1/1` real development-server HTTP smoke, `7/7` submission-package checks, `6/6` deployment-rendered checks, build, lint, typecheck, the distribution-license gate, byte-identical bundled third-party notices, and a 59-asset Wrangler dry run. Their physical 55-file `dist/client` snapshots match byte-for-byte; the SHA-256 of each canonical manifest is `1133339d1b372491084a06f889acd97399f2de2988d6267eb13baa48dd4b3721`.
- Exact candidate `ff5ce1f8a9fd3c0a0e824415e62e312380d93485` adds the zero-argument judge proof, hardened detached-bundle verification, current rules/credit records, and release-template guard without changing the reviewed static-client fingerprint. Fresh macOS and Debian clones both pass `npm ci` and `npm run verify:release`: macOS passes `157/157` aggregate executions; Debian passes `156/157` plus the one expected filesystem skip; both report zero dependency vulnerabilities and canonical static manifest SHA-256 `1133339d1b372491084a06f889acd97399f2de2988d6267eb13baa48dd4b3721`.
- Exact candidate `87dee97607354081f17eca78fcf5c93ca722ddb1` adds a checked threat model and promotes the six-line judge proof into the GitHub Actions job summary and retained artifact without changing the reviewed static-client fingerprint. Fresh macOS and Debian clones both pass `npm ci` and `npm run verify:release`: macOS passes `158/158` aggregate executions; Debian passes `157/158` plus the one expected filesystem skip; both report zero dependency vulnerabilities, `9/9` submission-package checks, and canonical static manifest SHA-256 `1133339d1b372491084a06f889acd97399f2de2988d6267eb13baa48dd4b3721`.
- Submission-package checkpoint `b4c8217fd93ac764d9d48bb72e8f105559fc3782` and checkpoints `9f2cd8da2ea03f294a247cb91795571e744a68fb`, `15f1aee67b419822cab54310ae9bec7cd321cb9c`, and `a056fe337208c0f377918bb8502d2bc6324ba19a` preserve earlier release and cross-runtime evidence. See `docs/CLEAN_CHECKOUT_RECEIPT.md`. Completed public checkpoints have exact-commit GitHub Actions evidence; an exact replay and CI run for the final submitted commit, Windows verification, and independent external reproduction remain outstanding. The Linux claim is limited to the exact local Debian container above.
- The first dated post-start Git checkpoint is commit `21405c8e2d3e4d03e36442a1facab96c4ec487a6`, created `2026-07-13T13:15:43-05:00` with subject `Disclose V1 baseline and add post-start WitnessPatch V2 proof`. Because it is the root commit and intentionally contains both the disclosed pre-start V1 lineage and post-start extensions, Git alone does not attest which bytes predated the event; the timestamped Codex task, retained receipts, and this before/after ledger provide that distinction. History must not be rewritten in a way that obscures it.
- The final README must explain Codex acceleration, GPT-5.6 contribution, and the human decisions retained, as required by the rules.

## Claim boundary

The submission must say that WitnessPatch was a pre-existing local V1 prototype meaningfully extended during Build Week. It must not imply that the original evaluator, V1 artifacts, original UI, V1 13-check suite, or captured V1 Sol candidate were created after the Submission Period began. Only the post-start compiler, browser verifier, V2 implementation, fresh post-start candidate record, and subsequent verified work belong in the judged Build Week claim. The receipt establishes a retained local request record; the first dated checkpoint now exists, while the required `/feedback` Session ID is still needed for final submission provenance.
