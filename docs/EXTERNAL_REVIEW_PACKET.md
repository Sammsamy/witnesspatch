# External review packet

Use this packet for real validation before submission. Do not prefill agreement, invent a reviewer, or describe a medical-student review as licensed-physician validation.

## A. Health-AI builder workflow review

**Reviewer role:**  
**Organization or product type:**  
**Date:**  
**Name/quote permission:** yes / no / anonymous role only

Ask about the reviewer's most recent real failure before showing WitnessPatch:

1. Where was the failure first captured: screenshot, ticket, eval set, incident review, or CI test?
2. How long passed before it became a runnable regression?
3. Who defined the expected behavior, and where was its evidence recorded?
4. Did the repair ever regress or over-trigger on a nearby authored control?
5. Which artifact would change the workflow: time trace, locked rule, red test, target diff, exact-fact control, or verification receipt?
6. What would prevent the reviewer from testing this on one existing synthetic failure?
7. Is a static recorded-decision witness useful without target-in-loop counterfactual execution? What additional artifact would be required?

**Current time from discovered failure to runnable regression:**  
**Estimated time with this workflow:**  
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

For each item, record **supported as scoped / revise / outside reviewer scope**, plus the exact requested change:

1. The urgent fixture's synthetic facts and chronology do not create a misleading clinical implication.
2. `INV-01` recent-pregnancy-context wording is appropriately bounded.
3. `INV-02` persistent unrelieved postpartum-headache wording supports an immediate concrete route without asserting a diagnosis.
4. `INV-03` postpartum visual-change wording is independently supportable and does not instruct the user to wait for a reply or home blood-pressure reading.
5. `INV-04` describes the authored `168/112` endpoint as fixture-supplied and in a published severe range, without diagnosing, inferring the classification numerically, or instructing a 15-minute wait at home.
6. The urgent copy—seek care immediately, contact obstetric care/triage, and use an emergency department if the team cannot be reached—is appropriately bounded for this synthetic fixture.
7. The `118/74` exact-fact negative-control copy avoids saying the person is benign, illness-free, or safe to defer care.
8. The project accurately discloses that only `118/74` and `168/112` are authored endpoints and that middle, borderline, discordant, measurement-accuracy, and repeat-reading behavior are untested.
9. The linked CDC, AIM, and ACOG materials are represented accurately within the reviewer's scope.

**Required changes:**  
**Unresolved disagreement or uncertainty:**  
**Narrow review-scope statement approved:** yes / no

## C. Verification-claim review

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
- Obtain explicit permission before publishing a name, organization, credentials, or quote.
- A review of these fixtures does not validate other cases, the grader, the product, or patient outcomes.
- A builder interview is problem/workflow evidence, not clinical validation.
- If no qualified physician review is completed, keep `licensed physician validation pending` everywhere.

## Recruitment messages

### Licensed-physician request

> I am a third-year medical student building a synthetic developer tool for OpenAI Build Week. It converts one healthcare-agent contract failure into a time-locked regression and review-gated software patch. Would you spend 15 minutes reviewing only two authored postpartum fixtures, their linked public sources, and the exact wording boundaries? I am not asking for product endorsement or patient-care advice. I will preserve disagreements and keep “physician validation pending” unless the exact review is completed and you approve the narrow way it is described.

### Health-AI builder request

> I am testing a tool that turns a discovered synthetic healthcare-agent failure into a red regression, executable target diff, exact-fact over-escalation control, and verification receipt. Could I ask about the last unsafe or borderline output your team found, what happened afterward, and whether this artifact set would have changed that workflow? The conversation takes 15 minutes. I will show the product only after hearing your current process, and I will not publish your name or quote without permission.
