---
name: witnesspatch
description: Run or audit the repository's offline synthetic health-AI trace, static witness, executable repair, and artifact-verification workflow.
---

# WitnessPatch workflow

Use this skill for requests to run, extend, repair, or audit WitnessPatch.

## Safety boundary

- Accept only fully synthetic cases. Stop if a fixture may contain patient data or protected health information.
- This repository is developer safety tooling, not clinical decision support, diagnosis, treatment, patient care, or a substitute for local policy.
- Keep physician validation `pending` until a real, documented licensed review is supplied.
- The engine validates declared source-ID linkage only. Semantic clinical support requires qualified human review.
- Never let a model assign the final pass/fail verdict; deterministic grading is authoritative.
- Never call the V2 exact-fact negative control a benign patient or evidence that care can be deferred.
- Never claim numeric blood-pressure inference. V2 consumes fixture-supplied classes only for `118/74` and `168/112`; middle, borderline, discordant, and repeat-reading behavior is untested.

## Provenance boundary

- Treat `public/runs/manifest.json`, its 16-file V1 bundle, its 13 checks, and the captured V1 Sol candidate as immutable pre-start lineage.
- Treat `public/runs/v2/` as the post-start Build Week artifact namespace.
- The unchanged V1 candidate is rejected under V2: urgent `85/100`, exact-fact negative control not executable. Do not present it as a V2 model repair.
- The retained reference policy remains the source of the primary `50 → 100` result. A distinct fresh post-start candidate is retained in the 23-file profile, quarantined, not installed, and separately validated through browser-safe JSON-IR interpretation and Node execution. Never conflate it with the reference.
- Treat `gpt-5.6-sol` / `ultra` as the configuration requested in the fresh receipt, not independent served-model attestation. Its empty credential-scrub list means no matching variables were present to remove.

## Standard V2 run

From the repository root:

1. Run `npm run artifacts:v2:build`.
2. Run `npm run artifacts:v2:verify`.
3. Run `npm run test:core`.
4. Run `npm run lint`, `npm run typecheck`, and `npm run build`.
5. Inspect `public/runs/v2/manifest.json` and report scores, exact-control results, hash count, 9→3 witness, reference regrades/holdouts, fresh candidate proof and quarantine boundary, clinical scope, and V1 compatibility result.

Expected V2 result:

- urgent baseline `50/100`; urgent reference repair `100/100`;
- exact-fact negative control `100/100`; always-escalate mutation `25/100`;
- `23/23` exact hashes, reference `2/2` fresh regrades, and reference `4/4` V2 holdouts;
- T+02 `INV-02` witness reduced from 9 facts to 3 with recorded decisions fixed;
- fresh candidate browser-safe JSON-IR and Node execution each match `2/2` cases and `4/4` mutations; candidate quarantined and not installed;
- `npm run verify:release` must pass completely on the frozen release; report the actual suite totals. On a case-sensitive filesystem, only the case-folded-output-alias test is expected to skip. Current `npm audit` must report zero known vulnerabilities;
- unchanged pre-start Sol candidate rejected under V2.

The four holdouts cover the repaired path, required consumption of a fixture-supplied classification, future-fact leakage, and numeric-inference contradiction copy. Additional engine tests close a bidirectional lexical-label bypass. None is clinical validation.

## Portable compile

Use the model-free compiler for a validated synthetic failing run:

```sh
node bin/witnesspatch.mjs compile \
  --case PATH \
  --run PATH \
  --out-dir NEW_PATH
```

The command must emit an atomic, hash-listed bundle and an initially red regression. It regrades the supplied recorded run, then holds those decisions fixed while reducing the encoded fact predicate. Never describe the result as target-in-loop minimization, a counterfactual target response, or clinical minimality. Verify that the bundle records earlier noncritical and coincident critical failures, contains no absolute source paths or credentials, and refuses existing or symlinked output paths. Claim browser/CLI byte parity only for the two manifest-listed public inputs with explicit `--fact-scope failure-prefix`; generic inputs and full-trace scope are outside that claim.

From the repository root, the generated test auto-detects `./bin/witnesspatch.mjs`; elsewhere it falls back to `witnesspatch` on `PATH`. `WITNESSPATCH_CLI` overrides either choice. Use `WITNESSPATCH_CANDIDATE` to point the same test at a repaired run for the green check.

## Optional local Sol work

- Use the local Codex CLI only through ChatGPT sign-in; remove matching API-key, organization, project, endpoint, and alternate-provider credential variables if present, and retain the exact names found.
- Ask for schema-constrained data, not arbitrary executable source, when exploring a policy repair.
- Treat every completion as untrusted until V2 deterministic evaluation and provenance review pass.
- Do not install a candidate automatically or overwrite the retained V2 reference.
- Do not reuse the legacy `npm run codex:repair` receipt as V2 evidence; it belongs to the pre-start V1 lineage.
- For every fresh V2 candidate, retain raw/normalized hashes, exact requested model and reasoning effort, prompt boundary, evaluation against both V2 fixtures, holdout result, and installation status. Do not claim the requested model field independently attests the served backend.

## Repair loop

Use focused reviewers when useful:

- a scenario adversary attacks the encoded software oracle and scope;
- a clinical-claim critic checks wording against primary sources without granting validation;
- a repair engineer makes the smallest reviewable target change plus regression;
- an artifact verifier recomputes hashes, grades, holdouts, and lineage checks.

Close the loop only when deterministic verification passes. Report failures and untested behavior plainly.
