# Clinical claim and scope audit

Status: **source-linked content audit complete July 20, 2026; licensed-physician fixture/wording review remains pending; clinical validation is not claimed.**

This is an audit of public wording, not a medical review, clinical validation, endorsement, or authorization for patient use. WitnessPatch evaluates authored software contracts over fully synthetic fixtures. It does not diagnose, recommend treatment, process patient data, or decide what should happen in a real clinical workflow.

## Audited surfaces

- `README.md`
- `docs/SUBMISSION_DRAFT.md`
- `docs/DEMO_SCRIPT.md` and `submission/video/witnesspatch-demo.en.srt`
- `app/components/witnesspatch-lab.tsx`
- the V2 case, target-policy, receipt, manifest, and evaluated-run artifacts under `cases/v2/`, `targets/demo-agent/v2/`, and `public/runs/v2/`

The audit searched for clinical, patient, diagnostic, treatment, outcome, safety, validation, regulatory, and blood-pressure claims; then mapped each material medical statement to current primary public guidance or an explicit non-claim boundary.

## Supported, bounded statements

| Public statement used by the synthetic fixture | Primary guidance checked July 20 | Permitted boundary |
| --- | --- | --- |
| Urgent maternal warning signs matter during pregnancy and in the year after delivery. | [CDC Urgent Maternal Warning Signs](https://www.cdc.gov/hearher/maternal-warning-signs/index.html) | May motivate the synthetic one-year pregnancy-status question. It does not establish diagnosis or the completeness of the fixture. |
| A persistent headache unrelieved by medication/fluids and vision changes are urgent warning signs; the CDC page directs people with listed signs to seek medical care immediately. | [CDC Urgent Maternal Warning Signs](https://www.cdc.gov/hearher/maternal-warning-signs/index.html) | Supports the authored immediate-route contract for the exact synthetic warning-sign pattern. It does not validate the software or establish a universal triage rule. |
| A bad headache with vision changes within six weeks after birth warrants prompt obstetric contact. | [ACOG Headaches and Pregnancy](https://www.acog.org/womens-health/faqs/headaches-and-pregnancy) | Supports the exact day-eight postpartum fixture. The product does not diagnose preeclampsia. |
| Care settings should identify current or recent pregnancy and have timely triage/escalation processes for severe hypertension or related symptoms. | [AIM Severe Hypertension in Pregnancy Patient Safety Bundle](https://saferbirth.org/psbs/severe-hypertension-in-pregnancy/) | Supports asking about recent pregnancy and encoding an escalation contract. The simulator's zero-minute deadline means the same authored checkpoint, not a clinical SLA. |
| ACOG describes severe hypertension as systolic at least 160 or diastolic at least 110, and describes less than 120/80 as normal. | [ACOG Preeclampsia and High Blood Pressure During Pregnancy](https://www.acog.org/womens-health/faqs/preeclampsia-and-high-blood-pressure-during-pregnancy) | The fixtures supply classifications for exactly `168/112` and `118/74`; the grader does not infer thresholds. No middle, borderline, discordant, measurement-error, or repeat-reading behavior is claimed. |
| ACOG advises immediate clinician contact for postpartum headache/vision changes and says that if the obstetric clinician cannot be reached or immediate care is needed, call 911 or go to a hospital. | [ACOG 3 Conditions to Watch for After Childbirth](https://www.acog.org/womens-health/experts-and-stories/the-latest/3-conditions-to-watch-for-after-childbirth) | Supports the concrete route in the exact synthetic repaired-policy wording. It is not individualized advice from WitnessPatch. |

## Claims deliberately excluded

The public product, submission copy, screenshots, and video must not claim any of the following:

- diagnosis, treatment, medical correctness, clinical efficacy, or clinical validation;
- that a physician, institution, regulator, or OpenAI endorsed or approved the fixture or product;
- patient outcomes, lives saved, mortality reduction, production readiness, FDA status, or HIPAA compliance;
- that the exact negative control proves a patient is well or that real-world care can be deferred;
- that the static `9 → 3` witness is causal, counterfactual, target-in-loop, semantic, or clinically minimal;
- that the grader infers blood-pressure categories or generalizes beyond the two fixture-supplied endpoints;
- that a passing synthetic software score proves safety in another case, agent, team, or deployment.

No unsupported clinical efficacy, diagnosis, treatment, patient-outcome, regulatory, or generalization claim remains in the audited judge-facing copy. The remaining medical statements are narrowly source-linked fixture premises and urgent-route wording for one synthetic scenario. A licensed physician has not reviewed that wording; the UI and submission therefore continue to display `fixture_wording_review: pending` and `clinical_validation: not_claimed`.

## Release rule

Any change to the V2 medical facts, target-policy messages, source list, submission story, screenshots, captions, or narration reopens this audit. A future licensed-physician review may narrow or correct the fixture wording, but it must never be described as clinical validation or product endorsement.
