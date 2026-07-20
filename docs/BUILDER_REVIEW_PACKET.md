# Independent builder review packet

Use this packet to run one **33-minute, frozen, external software review** of WitnessPatch. The evidence target is narrow: can one qualified healthcare-AI or AI-evaluation builder reproduce and interpret the supplied synthetic proof without coaching?

This is not physician review, clinical validation, a patient-safety study, a comparison with the participant's normal work, or evidence of adoption or time saved. The task uses only checked-in synthetic fixtures, runs locally, requires no API key or paid model call, and must never include patient data, private prompts, employer material, or proprietary incidents.

## Fast schedule — 33 minutes total

| Clock | Phase | Facilitator rule |
| --- | --- | --- |
| `0:00–0:03` | consent, qualification, and privacy boundary | Do not show the repository, interface, screenshots, artifact names, or mechanism. |
| `0:03–0:08` | pre-exposure workflow interview | Ask only the four abstract questions below. Do not request a case example. |
| `0:08–0:28` | frozen independent clean run | Start a visible 20-minute timer immediately before `git clone`. Give no product or command coaching. |
| `0:28–0:33` | debrief and summary permission | Ask the five neutral closeout questions. Stop at 33 minutes. |

An incomplete or failed attempt is still a valid observation. Preserve it; do not silently restart, extend the timer, or replace it with a cleaner rerun.

## 1. Recruit without pre-exposure

Use this exact scope or a shorter faithful version:

> Could you spend 33 minutes independently testing one frozen, open-source developer-tool task built around a fully synthetic healthcare-agent trace? I am looking for honest usability and evidence-quality feedback, not endorsement. The run is local, needs Git, Node.js 22.15+, npm, and Chrome, and uses no patient data, private work material, API key, or paid model call. I will not publish your identity, employer, or words without your explicit permission.

Do not send the repository, live demo, screenshots, video, product name, artifact list, or task mechanism before the pre-exposure interview is complete. Sharing the runtime requirements above is permitted.

### Qualification gate

Record the participant's own statement. A qualified reviewer must:

- be external to the submission and have made no code, asset, evaluation, or submission contribution;
- have hands-on work in the last 12 months building or evaluating a healthcare-AI system, agent, model evaluation, safety test, red-team workflow, or ML/AI CI system;
- be able to run a public repository locally in a fresh directory; and
- disclose any family, supervisory, financial, competitive, employer, or other conflict.

A close relative, team member, current supervisor, direct report, or person paid contingent on a positive result may provide usability feedback, but the result must **not** be labeled independent. If the participant is an AI-evaluation builder without healthcare-AI experience, identify that narrower role accurately. No medical credential is required because this protocol asks no clinical question and supports no clinical claim.

## 2. Facilitator preparation — before the call

Freeze the public commit that the participant will actually test. From a clean repository root, privately record:

```bash
git status --short
git rev-parse HEAD
git remote get-url origin
node -e "const fs=require('node:fs'),c=require('node:crypto');process.stdout.write(c.createHash('sha256').update(fs.readFileSync('public/runs/v2/manifest.json')).digest('hex')+'\n')"
```

`git status --short` must print nothing. Prepare three out-of-band values:

- `REPOSITORY_URL_FROM_FACILITATOR`
- `COMMIT_FROM_FACILITATOR` — exactly 40 lowercase hexadecimal characters
- `MANIFEST_SHA256_FROM_FACILITATOR` — exactly 64 lowercase hexadecimal characters

Have a private notes copy of the session record below ready. Do not prefill participant answers. Do not commit raw notes, names, email addresses, employer details, recordings, credentials, local paths, or consent records.

## 3. Minute `0:00–0:03` — consent, qualification, privacy

Read:

> This is a synthetic developer-tool review, not a clinical review. Please do not share patient information, real case facts, employer or client material, private prompts, credentials, screenshots, or proprietary incidents. I will take process notes. You may stop at any time. I will not publish your identity, organization, quote, or a summary attributed to you without separate explicit permission.

Confirm:

- consent to participate and to process notes: yes / no;
- relevant hands-on work in the last 12 months and role category;
- external-to-submission status and conflicts;
- prior exposure to this project beyond the recruiting message; and
- publication permission is initially `private only` unless changed during closeout.

Stop if consent or the privacy boundary is not accepted. Additional product exposure does not prevent a useful session, but it prevents a clean pre-exposure result and must be disclosed.

## 4. Minute `0:03–0:08` — four pre-exposure questions

Ask for an abstract workflow only:

1. In your most recent relevant work, where did a model or agent failure enter the engineering process?
2. What steps and handoffs, if any, turned it into a runnable regression, and who specified expected behavior?
3. What minimum evidence would you require before approving a repair or release?
4. What is the strongest reason you might refuse to trial a tool in this part of the workflow?

If the participant supplies elapsed time, label it `observed record`, `contemporaneous estimate`, `memory estimate`, or `unavailable`. It is context, not a baseline comparable to the frozen task and not a time-saved claim.

After recording the answers, give the three frozen handoff values and direct the participant to [`docs/BUILDER_REVIEW_START.md`](BUILDER_REVIEW_START.md). Do not reveal navigation or expected outputs beyond that checked-in page.

## 5. Minute `0:08–0:28` — independent clean run

Start the timer immediately before the participant runs the clone command. The participant must use a fresh directory and follow the checked-in start page. The five task outcomes are:

1. reproduce the supplied failing baseline;
2. compile, export, and execute its runnable red regression;
3. execute that same regression green with the supplied retained repair;
4. find the exact-fact over-escalation control; and
5. inspect the evidence receipt.

For the executable bundle milestone, screenshot or ZIP visibility is insufficient. The participant must run the checked-in `review:bundle` command and reach all three exact software results:

- browser/CLI byte parity: `9/9`;
- supplied baseline regression: `RED exit 1`; and
- same regression with supplied retained repair: `PASS exit 0`.

### Independence rule

During the timer, the facilitator may only:

- repeat the written task verbatim;
- state remaining time;
- stop the session for sensitive information, credentials, an unauthorized target, or another safety issue; or
- resolve a call/remote-control failure unrelated to the product, recording the intervention verbatim.

Any navigation hint, command correction, interpretation, workaround, expected-output hint, or product explanation is substantive assistance. Record it and label the outcome `assisted completion` or `incomplete`, never `independent completion`. A wrong commit, failed fingerprint, dirty checkout, use of a non-synthetic target, sensitive information, or missing raw record makes the run `invalid`.

At 20 minutes, stop the task even if setup or installation consumed the window. Preserve exact errors and the furthest milestone reached.

## 6. Minute `0:28–0:33` — neutral closeout

Ask:

1. What, if anything, did the evidence prove?
2. What did it not prove?
3. Which one artifact would you retain for a release decision, if any?
4. What is the strongest reason you would reject the tool or decline a trial?
5. Under what exact condition, if any, would you test it on one authorized synthetic failure?

Then read back a short factual summary, including the failure or assistance record and the `n=1` limitation. Ask the participant to correct it. Separately record permission for: private use only / anonymous role summary / name and organization / exact quote. Silence is not permission.

## 7. Private session record — copy once per attempt

Do not fill this checked-in file. Copy this section into a private record named with a non-identifying session ID.

### Identity boundary and qualification

**Session ID:**  
**Date, start/end, timezone:**  
**Role category:** healthcare-AI builder / AI-evaluation builder / AI safety or CI builder / other  
**Relevant work in last 12 months, in participant's words:**  
**Qualification evidence:** participant attestation / public work / unavailable  
**External to submission:** yes / no  
**Conflict disclosure:** none / disclosed  
**Prior product exposure:** recruiting scope only / additional exposure disclosed  
**Consent to notes:** yes / no  
**Publication permission:** private only / anonymous role / named / exact quote only  
**Sensitive information encountered:** no / yes — stopped and excluded  

### Frozen environment

**Repository URL label:**  
**Frozen commit:**  
**V2 manifest SHA-256:**  
**OS/architecture:**  
**Git, Node.js, npm, Chrome versions:**  
**Dependency cache:** known / none / unknown  
**Preflight before and after install:** pass / fail  
**Private terminal transcript SHA-256:**  

### Pre-exposure workflow record

**Failure entry point:**  
**Steps/handoffs to runnable regression:**  
**Expected-behavior specifier/approver:**  
**Minimum approval evidence:**  
**Strongest trial refusal reason:**  
**Historical elapsed time and evidence grade:**  

### Timed observation

**Timer start/end:**  
**Final label:** independent completion / assisted completion / incomplete / invalid  
**Substantive assistance count:**  

| Milestone | Time | Outcome or exact warning |
| --- | --- | --- |
| Clone complete | | |
| First preflight | | pass / fail |
| `npm ci` complete | | |
| Repeated preflight and V2 verification | | pass / fail |
| Local server ready | | |
| Failing baseline reproduced | | yes / no |
| Nine-file ZIP exported | | yes / no |
| Bundle/CLI byte parity | | `9/9` / fail / not reached |
| Baseline regression | | `RED exit 1` / other / not reached |
| Supplied-repair regression | | `PASS exit 0` / other / not reached |
| Exact-fact control found | | yes / no |
| Evidence receipt inspected | | yes / no |

| Time | Question or block | Facilitator intervention, verbatim | Type |
| --- | --- | --- | --- |
| | | | navigation / command / interpretation / workaround / safety |

**Browser ZIP SHA-256:**  
**Private bundle receipt SHA-256:**  
**Warnings, errors, broken links, or unexpected behavior:**  

### Participant closeout in their own words

**Evidence proves:**  
**Evidence does not prove:**  
**Artifact to retain:**  
**Strongest rejection/non-use reason:**  
**Condition for one authorized synthetic trial:**  
**Participant corrections to facilitator summary:**  
**Participant confirmed exact deidentified summary:** pending / yes, date / declined  
**Exact quote permission and text:** none / approved exact text  

### Facilitator integrity check

- [ ] No answer, agreement, success, or quote was prefilled.
- [ ] The original attempt, errors, timeout, and assistance remain preserved.
- [ ] No patient, employer, client, credential, private-prompt, or proprietary material was retained.
- [ ] Historical workflow time is not compared directly with this synthetic task.
- [ ] No physician review, clinical-validation, patient-outcome, adoption, efficacy, or time-saved claim was created.
- [ ] Every public role, identity, organization, quote, and factual summary has explicit permission.

## 8. Evidence tier and publication gate

Use the highest tier whose complete evidence exists:

- **E1 — interview only:** qualified external participant plus preserved pre-exposure answers; no clean-run result.
- **E2 — observed frozen attempt:** E1 plus exact commit/manifest, environment, timer, assistance log, outcome label, milestone record, a private transcript hash, and a receipt hash if one was created. The attempt may pass or fail.
- **E3 — participant-confirmed record:** E2 plus the participant's confirmation of the exact deidentified factual summary and explicit publication scope.

Target E3. Do not publish a reviewer-derived claim from E1 or E2, an unconfirmed summary, or an unresolved correction. Raw records stay private. If a product change follows, preserve this attempt and run a separately labeled session at the new commit; do not retroactively upgrade the first result.

### Bounded public-summary template

Use only participant-confirmed fields and remove any bracket that cannot be supported:

> At commit `[40-character commit]`, one external `[accurate role category]` `[independently completed / independently attempted but did not complete / completed with disclosed assistance]` the frozen 20-minute WitnessPatch task in `[environment]`. The observed run reached `[exact milestones]`; the participant's strongest objection was `[confirmed wording]`. This is one synthetic, single-environment software-usability observation (`n=1`), not physician review, clinical validation, adoption, efficacy, a patient-safety result, or evidence of time saved.

Never change `attempted` to `completed`, omit assistance or a timeout, identify an AI-evaluation reviewer as a healthcare-AI reviewer, or call a conflicted participant independent.
