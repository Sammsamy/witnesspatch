# External review packet

Use this packet with `docs/SAME_DAY_VALIDATION_PROTOCOL.md` and record the result in `docs/VALIDATION_EVIDENCE_TEMPLATE.md`. Do not prefill agreement, invent a reviewer, coach toward approval, or describe a medical-student review as licensed-physician validation.

## A. Health-AI builder workflow review

**Reviewer role:**  
**Organization or product type:**  
**Date:**  
**Name/quote permission:** yes / no / anonymous role only

Ask about the reviewer's most recent relevant workflow before showing WitnessPatch. Request only an abstract process; do not request patient facts, case text, private prompts, screenshots, employer secrets, or proprietary incidents:

1. Where was the failure first captured: screenshot, ticket, eval set, incident review, or CI test?
2. How long passed before it became a runnable regression?
3. Who defined the expected behavior, and where was its evidence recorded?
4. Did the repair ever regress or over-trigger on a nearby authored control?
5. What artifact, if any, is the minimum required for release approval?
6. What would prevent the reviewer from testing this on one existing synthetic failure?
7. Is a static recorded-decision witness useful without target-in-loop counterfactual execution? What additional artifact would be required?

**Historical time from discovered failure to runnable regression and evidence grade:**

**Pre-exposure forecast for the frozen reviewer task, not a savings estimate:**
**Most important objection:**  
**Would test on one existing synthetic failure:** yes / no / conditional  
**Condition:**

Do not turn an estimate into a published time-saved claim without observing a real baseline and follow-up under comparable conditions.

## B. Licensed-physician fixture review

This review is only about the two authored V2 postpartum fixtures, their public sources, and their wording. It is not product approval, a clinical study, patient-care advice, or validation of the software.

**Reviewer credentials and jurisdiction:**  
**Relevant practice area:**  
**Date:**  
**Conflict disclosure:**  
**Name/quote permission:** yes / no / anonymous credentials only

First show only the two synthetic timelines, their declared limits, and public sources. Record the physician's independently stated implications, misleading implications, omissions, and local-policy boundaries before revealing the project rules or copy.

Then, for each item, record **supported as scoped / revise / outside reviewer scope / unresolved**, the reason in the reviewer's words, and the exact requested change. Use these neutral prompts:

1. What clinical implication, if any, does the urgent fixture's exact chronology support, and what implication would be misleading?
2. Review `INV-01`. What is supported, what should change, and what is outside your scope?
3. Review `INV-02`. What is supported, what should change, and does any wording assert more than an urgent-routing contract?
4. Review `INV-03`. What is supported, what should change, and does any wording introduce a wait for a reply or home reading?
5. Review `INV-04`. Which statements about the authored `168/112` endpoint, supplied classification, diagnosis, numerical inference, or timing should remain, change, or be removed?
6. Review the displayed urgent route. Which parts are supported for this synthetic fixture, and which depend on local policy or need revision?
7. Review the `118/74` exact-fact control. Does any wording imply a benign state, absence of illness, or real-world permission to defer care? Record exact changes.
8. Review the two-endpoint and untested-behavior disclosure. What is missing, unclear, or overstated?
9. For each linked CDC, AIM, and ACOG representation actually opened, record accurate as scoped, revise, outside scope, or unavailable.

**Required changes:**  
**Unresolved disagreement or uncertainty:**  
**Disposition counts — supported / revise / outside scope / unresolved:**

**Narrow review-scope statement:** accepted / revise / declined

**Revisions re-reviewed at commit:** not applicable / pending / hash

## C. Optional verification-claim follow-up

This is a separately consented 10-minute software-claim follow-up after the 35-minute builder session. It is not part of the independent task window and must not delay or relabel the original run.

Ask a software/evaluation reviewer to confirm that the public wording matches what the implementation proves:

1. `23/23` means exact bytes match the same-build manifest; it is not a publisher signature, origin proof, or independent timestamp attestation.
2. Reference `2/2` means two retained V2 runs were freshly regraded in the browser; reference `4/4` means four declared software expectations matched, not four clinical outcomes.
3. The fresh post-start candidate is distinct from the retained reference, quarantined, and not installed.
4. The fresh browser `2/2` and `4/4` results come from safe interpretation of retained declarative JSON IR; the browser does not execute the retained JavaScript or apply its patch. The Node verifier executes the candidate and checks the same exact signature.
5. The receipt records that the Codex CLI requested `gpt-5.6-sol` with `ultra` reasoning. It is not independent served-model identity attestation, and an empty credential-scrub list means no matching variables were present to remove.
6. The exact-fact control rejects one always-escalate mutation only.
7. The 9→3 static compiler witness holds recorded decisions fixed and makes no target-in-loop, counterfactual, or clinical-minimality claim.
8. The old V1 Sol candidate is rejected under V2, not presented as either passing repair.

**Misleading wording found:**  
**Required correction:**  
**Would trust the receipt for its stated software scope:** yes / no / conditional

## Evidence handling

- Preserve original notes, requested edits, date, reviewer scope, and disagreements.
- Preserve the exact commit, V2 manifest hash, environment, assistance, errors, and objections; never overwrite an initial result with a rerun.
- Obtain explicit permission before publishing a name, organization, credentials, or quote.
- A review of these fixtures does not validate other cases, the grader, the product, or patient outcomes.
- A builder interview is problem/workflow evidence, not clinical validation.
- A single clean run is usability evidence for one environment, not adoption or time-saved evidence.
- If no qualified physician review is completed, keep `licensed physician validation pending` everywhere.

## Recruitment messages

### Licensed-physician request

> I am a third-year medical student building a synthetic developer tool for OpenAI Build Week. It converts one healthcare-agent contract failure into a time-locked regression and review-gated software patch. Would you spend 30 minutes reviewing only two authored postpartum fixtures, their linked public sources, and the exact wording boundaries? I am not asking for product endorsement, diagnosis, treatment, or patient-care advice. I will preserve disagreements, will not request any patient information, and will not claim clinical validation from this review.

### Health-AI builder request

> I am testing a tool whose compiler turns a supplied synthetic healthcare-agent timeline-contract failure into a red regression; a separate verifier checks the retained target patch, exact-fact control, mutations, and evidence receipt. Could I ask about your current regression workflow at an abstract level, then watch you try the frozen synthetic repository from a clean directory without coaching? The session takes about 35 minutes. Please do not share patient data, client details, private prompts, or proprietary incidents; I will not publish your identity, employer, or quote without permission.
