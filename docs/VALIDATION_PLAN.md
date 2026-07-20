# Validation plan

WitnessPatch has a strong local V2 software demonstration. Its largest remaining credibility gaps are external workflow evidence and licensed clinical review. More internal tests cannot close either gap.

The operational protocol is `docs/SAME_DAY_VALIDATION_PROTOCOL.md`; its fillable record is `docs/VALIDATION_EVIDENCE_TEMPLATE.md`. The same-day minimum is one qualified healthcare-AI builder clean run plus workflow interview and one licensed-physician fixture/wording review. Each remains `n=1` and must be reported with its exact scope, environment, assistance, objections, and limitations.

## Primary user hypothesis

**User:** a clinical-safety or AI-evaluation engineer building a patient-facing healthcare agent.

**Buyer:** a Head of Clinical AI, engineering leader, or AI-governance owner at a healthtech company.

**Job:** turn a discovered unsafe response into a reproducible regression that can gate the next release.

## Current evidence

Verified local V2 software evidence:

- urgent baseline `50/100`, retained repair `100/100`;
- exact-fact negative control `100/100`, always-escalate mutation `25/100`;
- `23/23` exact artifact hashes against the same-build manifest, reference `2/2` fresh browser regrades, and `4/4` V2 holdouts;
- a 9→3 static `INV-02` witness over facts revealed through T+02, with recorded decisions fixed;
- a distinct fresh post-start candidate, retained but not installed, whose browser-safe JSON-IR interpretation and Node execution match `2/2` authored cases and `4/4` software mutation signatures;
- exact candidate `87dee97` passing `npm ci` and `npm run verify:release` from fresh macOS 26.5.2 arm64/Node 24.14.0 and local Debian 12 arm64/Node 22.23.1 clones; macOS passed `158/158` aggregate test executions, Debian passed `157/158` with one expected case-insensitive-filesystem skip, and both passed `136` discovered core tests, `6/6` rendered checks, `1/1` real development-server HTTP smoke, `9/9` submission-package checks, `6/6` deployment-rendered checks, the zero-argument judge proof, detached-bundle verification coverage, the threat-model boundary check, build, lint, typecheck, the distribution-license gate, byte-identical bundled third-party notices, and the 59-asset Wrangler dry run; both produced the same canonical physical 55-file `dist/client` byte manifest with SHA-256 `1133339d1b372491084a06f889acd97399f2de2988d6267eb13baa48dd4b3721`;
- current source-hash-bound production-Chrome reference `50 → 100` verification plus included-sample local compilation, nine-file browser/CLI byte parity, red/green regression execution, no requests after the two expected sample fetches, no `/.rsc`/`404` same-page navigation, and zero console errors or warnings;
- bidirectional lexical marker check against urgent copy hidden behind safe action labels;
- numeric-inference contradiction marker;
- old pre-start V1 Sol candidate rejected under V2 rather than relabeled.

What this does **not** establish:

- semantic completeness or clinical correctness;
- numerical blood-pressure classification beyond two fixture-supplied endpoints;
- middle, borderline, discordant, measurement-accuracy, or repeat-reading behavior;
- counterfactual target behavior from the static witness compiler;
- generalization to other cases, models, teams, or production systems;
- independently attested served-model identity—the receipt records the requested `gpt-5.6-sol` / `ultra` configuration only;
- current workflow pain, willingness to adopt, time saved, patient outcomes, or business impact.

The judge-facing path also remains deliberately outside automated high-stakes medical decision-making: it uses synthetic fixtures, produces developer evidence, and leaves any patch installation and clinical interpretation to human review. Testing must remain limited to the team's own reference adapter or explicitly authorized targets.

## Three interviews that matter most

1. A physician who reviews or governs patient-facing AI behavior.
2. An engineer who owns evaluations, red-teaming, or release quality for a healthcare agent.
3. A product or safety leader accountable for approving healthcare AI changes.

The founder being a medical student is relevant domain context, not a substitute for these reviewers and not licensed clinical validation.

## Fifteen-minute builder interview

Ask about a real recent workflow before showing the product:

1. Tell me about the last unsafe or borderline AI response your team found before release.
2. Where was it stored, and what happened next?
3. Did it become a regression? If so, how long did that take?
4. Who specified the expected behavior and evidence?
5. What makes the team distrust a model-generated evaluation or repair?
6. Which artifact is required for approval: trace, rule, test, diff, audit log, or something else?
7. Would a static recorded-decision witness be useful, or is target-in-loop counterfactual replay required?
8. What would prevent this workflow from entering the existing CI process?

Then show the real 60-second demo and ask:

9. Which part changes your workflow and which part is demo theater?
10. Would you test it on one existing synthetic failure next week? If not, what exact condition is missing?

Do not ask only “Would you use this?” and do not treat courtesy interest as validation.

## Evidence to capture

- Reviewer role and relevant experience; identity only with permission.
- Exact current workflow and tools.
- Observed time from failure discovery to running regression, if available.
- Whether failures are lost in screenshots, tickets, or prompt documents.
- Minimum artifact required for approval.
- Direct objections, non-use reasons, and conditions for a trial.
- Permission to quote or identify the reviewer.

For the builder clean run, also capture the frozen commit and manifest hash, OS/Node/npm/browser versions, dependency-cache state, observed milestone times, every failed command or broken link, and every facilitator intervention verbatim. Pre-task forecast and confidence, post-task confidence, actual completion time, and assistance count must remain separate measures. Do not compare the observed synthetic repository task to a historical production workflow as if they were equivalent.

For the physician review, capture the participant's concerns before showing project wording, then one of `supported as scoped / revise / outside reviewer scope / unresolved` for each of nine bounded items. Preserve source pages actually opened, requested changes, scope-statement disposition, and any re-review commit. Do not collapse disagreement into a pass percentage.

## Honest MVP metrics

- Exact-hash verification rate for the released bundle.
- Fresh regrade agreement on retained artifacts.
- Seeded software mutations correctly rejected.
- False positives on declared passing fixtures, with authorship chronology preserved.
- Exact-control result for an over-escalation mutation.
- Failure-to-regression time observed in a real builder workflow; currently unmeasured.
- Reviewer agreement and disagreement with each clinical wording claim.
- Clean-browser completion rate once a public deployment exists.

For a single builder, report a result label (`independent completion`, `assisted completion`, `incomplete`, or `invalid`) rather than a completion rate. For a single physician, report raw disposition counts and unresolved objections rather than an accuracy or agreement percentage.

Do not report patient outcomes, lives saved, clinical accuracy, or regulatory readiness from synthetic fixtures. Do not promote the pre-start V1 `113.770`-second observation as V2 evidence or a speed claim.

## Physician review gate

Until a licensed physician has reviewed the two V2 fixtures, sources, and exact rules:

- retain canonical `fixture_wording_review: pending` and `clinical_validation: not_claimed` in the V2 clinical scope and visible receipt; per-artifact inputs, outputs, receipts, and captured model-provenance records keep the legacy `clinician_validation: pending` field for schema and provenance compatibility, not as a review-completion or clinical-validation state;
- retain `licensed-physician fixture/wording review pending; clinical validation not claimed` in visible copy;
- do not change provenance to `validated`;
- do not use reviewer-style badges or implied endorsement;
- do not generalize beyond the exact authored facts;
- keep classifications fixture-supplied and the two-endpoint boundary visible.

After a real review, preserve reviewer scope, date, requested changes, conflicts, disagreements, and limitations. Only the fixture/wording-review field may move to a completed state after every closeout gate passes; clinical validation remains `not_claimed`. Review of two fixtures is not validation of the product.

## Submission evidence gates

- One recorded health-AI builder interview and concrete workflow finding.
- One clean builder replay against a frozen commit, including environment, elapsed time, assistance, failures, teach-back, and strongest objection.
- One scoped licensed-physician review, or a fully visible pending status.
- Public clean-browser verification of the exact submission build.
- Final founder-voiced video showing the real receipt and limitations.
- Dated post-start checkpoint `21405c8` and retained V1/V2 before-after ledger; preserve both without rewriting history.
- Preserve the fresh V2 candidate's quarantined/not-installed state, requested-model wording, browser JSON-IR boundary, Node execution proof, and exact manifest links in the final release.
- Final repository/license choice, `/feedback` Session ID, public deployment, and founder-voiced video.
- Authenticated Devpost form audit and every human eligibility/representative item in `docs/SUBMISSION_FORM_CHECKLIST.md`.
