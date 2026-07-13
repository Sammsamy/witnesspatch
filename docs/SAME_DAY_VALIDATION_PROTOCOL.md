# Same-day external validation protocol

This protocol turns two small external reviews into bounded, reproducible evidence: one healthcare-AI builder clean run plus workflow interview, and one licensed-physician review of the two synthetic V2 fixtures. It is designed for same-day execution. Neither session may use patient data, a real patient question, a participant's proprietary case, or an unauthorized target.

The target is credible `n=1` evidence, not a survey result, clinical validation, product endorsement, or a time-saved claim. Copy-ready recruiting language is in `docs/VALIDATION_OUTREACH_DRAFTS.md`; outreach and scheduling remain human actions outside the repository.

## Freeze the evidence before recruiting

Do not start a session from a dirty or changing tree. Record the exact build being reviewed:

```bash
git status --porcelain
git rev-parse HEAD
shasum -a 256 public/runs/v2/manifest.json
```

The first command must return no output. Put the commit and manifest hash on the participant's task card and in the session record. If either value changes, close the current record and begin a separately labeled rerun; never replace an unfavorable result with a patched rerun under the same session ID.

Before either session, read this boundary aloud:

> Please do not share patient information, a real patient question, client or employer secrets, private prompts, credentials, or proprietary incidents. Use only the supplied synthetic fixtures and the team's reference target. This is a developer-tool review, not medical advice or patient care. If sensitive information appears, we will stop and exclude it from the record.

Store raw notes, recordings, contact details, and credential-check material outside the repository. A deidentified summary may be added to the repository only after the participant confirms it and explicitly chooses whether a role, credentials, name, organization, or quote may be published. Screenshots must omit usernames, email addresses, local paths, access tokens, and unrelated tabs.

## Session 1: healthcare-AI builder

### Qualification and timing

Use one person who has directly built, evaluated, red-teamed, or release-gated a healthcare AI system within the last 12 months. A teammate does not count as external evidence. Record the participant's role and relevant experience, but not their employer or identity without permission.

Budget 35 minutes:

- 3 minutes: consent, scope, environment, and privacy boundary;
- 7 minutes: pre-exposure workflow interview;
- 20 minutes: clean run with no coaching;
- 5 minutes: post-run teach-back and objections.

### Pre-exposure measures

Do not show the product, pitch, artifact list, or demo before this section. Ask the participant to describe the most recent relevant failure only at an abstract workflow level. Do not request case text, patient facts, screenshots, prompts, customer names, or proprietary policy.

Record:

1. where the failure was first captured;
2. the steps and number of handoffs required to reach a runnable regression;
3. whether it ever became a regression;
4. elapsed time, only if known, and its evidence grade: `observed record`, `contemporaneous estimate`, `memory estimate`, or `unavailable`;
5. who specified expected behavior and who approved it;
6. the minimum artifact required for release approval;
7. one reason a generated regression or repair would be rejected.

Then give only this neutral task card:

> Starting from the supplied frozen repository and its README, reproduce the supplied synthetic failure, produce or locate its runnable regression, and verify the supplied repair and scoped over-escalation control. Stop when you believe the evidence is sufficient—or when you conclude it is not—and explain why.

Before opening the repository, record the participant's forecast in minutes and confidence from `1` (not confident) to `5` (very confident). This forecast is a usability expectation, not a current-workflow baseline and not a speed claim.

### Clean-run observation

The participant uses a fresh directory or clean clone on their own machine and follows the checked-in instructions. Record, without exposing hostnames or usernames:

- OS family and version, architecture, Node version, npm version, browser and version;
- repository-access method, network or policy constraints, and whether dependencies were already cached;
- start time, end time, and time to each independently recognized milestone;
- every warning, failed command, broken link, and participant question verbatim;
- each facilitator intervention, its exact wording, and whether it supplied navigation, a command, interpretation, or a workaround;
- whether the participant independently observed the failing baseline, a runnable red regression, the repaired result, the exact-fact control, and the evidence receipt;
- whether the participant noticed any hash, verifier, browser, or build failure.

Do not answer product questions during the independent window. A safety/privacy intervention does not count as product help, but it must still be logged. After the window, assistance is allowed and the result must be labeled `assisted`.

Classify the run before discussing the product:

- `independent completion`: all five milestones, no substantive product help;
- `assisted completion`: all five milestones after one to three substantive interventions;
- `incomplete`: a milestone is missing at 20 minutes or more than three substantive interventions were required;
- `invalid`: wrong commit, changed manifest, prior product exposure, or unusable record.

An environment or documentation failure remains part of the result. Do not silently reset the timer, edit instructions, or switch builds. A separately labeled rerun may follow after the first record is closed.

### Post-run measures and non-leading questions

Before explaining anything, ask:

1. “What, in your words, did the evidence prove?”
2. “What did it not prove?”
3. “Which artifact, if any, would you retain for a release decision, and why?”
4. “Where, if anywhere, would this add, replace, or duplicate a step in your current workflow?”
5. “What is the strongest reason you would not trial it on one authorized synthetic failure?”
6. “What exact condition would have to be met before a trial?”
7. “Which part felt like evidence, and which part felt like demo theater?”

Record post-run confidence from `1` to `5` that the participant could repeat the frozen synthetic task without help. Report the pre/post confidence pair, actual completion time, assistance count, and outcome label separately. Do not compare the observed repository run to the participant's historical workflow time as if the tasks were equivalent.

### Builder stop rules

Stop immediately if patient information, a real patient question, credentials, employer-confidential material, or an unauthorized system appears. Stop and mark `invalid` if the commit or manifest differs. End the independent window at 20 minutes, after three substantive interventions, or when the participant says the evidence is insufficient. Preserve failures and objections exactly; do not coach the participant toward a positive answer.

## Session 2: licensed physician

### Qualification and timing

Use a physician who attests to an active license and states the licensing jurisdiction and relevant practice area. Record how status was checked as `reviewer attestation` or `public registry checked`; keep license numbers and screenshots private. A teammate is not external. A relative, mentor, financial relationship, or other conflict does not automatically erase the review, but it must be disclosed and the review must not be called independent.

Budget 30 minutes:

- 3 minutes: credential scope, conflict, consent, and privacy boundary;
- 7 minutes: pre-wording review of the two synthetic timelines and cited public sources;
- 15 minutes: exact claim and wording review;
- 5 minutes: unresolved issues, scope statement, and publication permission.

This is a fixture and wording review. The participant must not be asked to approve the software, diagnose a case, recommend treatment, validate patient outcomes, or endorse the project.

### Pre-wording measures

First show only the two synthetic timelines, declared intended-use limits, and linked source material—without the project's rules, repaired responses, scores, or proposed review statement. Ask:

1. “Which clinical implications, if any, are supportable from these exact authored facts and sources?”
2. “Which implications would be misleading or exceed the sources?”
3. “What important ambiguity or omitted scenario should remain explicitly untested?”
4. “Which routing or warning-language boundaries require local policy or additional expertise?”

Record the participant's concerns before revealing project wording. This is a prior review state, not a diagnostic exercise and not a measure of clinical accuracy.

### Exact claim review

Reveal the frozen rules, displayed response copy, `clinical-scope.json`, and source summaries. For each item in `docs/EXTERNAL_REVIEW_PACKET.md`, require one disposition:

- `supported as scoped`;
- `revise`;
- `outside reviewer scope`;
- `unresolved`.

Record the reason and exact requested change in the participant's own words. The facilitator must not paraphrase a `revise`, `outside reviewer scope`, or `unresolved` disposition into agreement.

Do not edit a fixture during the session. If changes are requested, preserve the original disposition, make a new commit after the session, and ask the same physician to re-review only the changed lines. Until that re-review is confirmed, `licensed physician fixture review pending` remains the public status.

### Physician post measures

Record:

- claims reviewed and counts in each disposition;
- source pages actually opened, unavailable, or outside scope;
- pre-wording concerns that remain addressed, unaddressed, or newly introduced;
- required changes and severity in the reviewer's words;
- unresolved disagreement or uncertainty;
- scope statement disposition: `accepted`, `revise`, or `declined`;
- whether any revisions were re-reviewed, with the new commit hash;
- permission level: private evidence only, anonymous credentials, named credentials, or approved exact quote.

There is no aggregate clinical score and no majority vote. A completed review with disagreement is still useful evidence, but it is not permission to use `validated`. After every material item is disposed and requested changes are re-reviewed, the strongest permitted status is a reviewer-approved statement such as `one licensed physician completed a scoped fixture and wording review; clinical validation not claimed`.

### Physician stop rules

Stop if active licensure cannot be established, the participant is outside the scope they are being asked to judge, source material cannot be accessed, the discussion becomes patient-specific advice, sensitive information appears, or the participant asks to approve the product rather than the bounded claims. Keep the fixture review `pending` if any required revision has not been re-reviewed, any material item remains unresolved, or the participant does not approve the narrow public summary. Never set a `clinician_validation` or equivalent field to `validated` from this review.

## Evidence tiers and judge-safe reporting

Assign each session one evidence tier:

- `E1 — facilitator record`: dated notes only;
- `E2 — participant-confirmed`: participant confirmed the deidentified summary by reply or signature;
- `E3 — reproducible`: E2 plus a frozen commit/hash and, for the builder, timestamped clean-run output or a consented recording.

Do not publish raw personal data to raise the tier. A reviewer-confirmed deidentified record is stronger than an unapproved named quote.

Acceptable builder wording:

> One external healthcare-AI evaluation builder completed the frozen synthetic replay on [environment] in [time] with [number] substantive interventions, then identified [artifact] as the minimum useful release evidence. This is one observed repository run and one workflow interview; no real system, patient data, adoption, or time savings were tested.

Acceptable physician wording:

> One licensed [practice area] physician in [jurisdiction] reviewed two synthetic V2 fixtures and nine bounded wording/source claims at commit [hash]: [x] supported as scoped, [y] revise, [z] outside scope, and [u] unresolved. This was fixture-level wording and source review, not product approval, clinical validation, medical advice, or evidence of patient outcomes.

If revisions were requested, add whether they were implemented and re-reviewed. If objections remain, lead with them. Never use `physician validated`, `clinically safe`, `proven faster`, `developers want this`, or a percentage derived from either single participant.

## Same-day closeout

Within one hour of each session:

1. preserve the unedited raw record privately and compute its SHA-256;
2. complete `docs/VALIDATION_EVIDENCE_TEMPLATE.md` without names or contact details;
3. send that summary to the participant for factual confirmation and publication permission;
4. retain their reply privately and record the evidence tier;
5. add only the participant-approved, deidentified summary to the submission evidence;
6. keep every negative result, assistance event, conflict, requested edit, and unresolved objection.
