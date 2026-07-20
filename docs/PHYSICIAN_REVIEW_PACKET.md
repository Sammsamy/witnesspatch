# WitnessPatch V2 licensed-physician fixture and wording review

Current submission status: **not performed.** This unused packet is retained only for a possible future scoped review; the current submission does not claim physician review or clinical validation.

Use the generated handoffs with the licensed-physician session in `docs/SAME_DAY_VALIDATION_PROTOCOL.md`. The generator is an optional facilitator tool, separate from the Node judge path. It emits three byte-linked records from the same clean frozen checkout:

- `output/pdf/witnesspatch-physician-first-look.pdf`: Page 1 only; send or show this first.
- `output/pdf/witnesspatch-physician-revealed-review.pdf`: Pages 2–5 only; withhold until the first-look answers are recorded.
- `output/pdf/witnesspatch-physician-review-packet.pdf`: complete five-page archive; do not expose it before the first-look stage is closed.

In a dedicated virtual environment, install the pinned dependencies and generate them with:

```bash
python3 -m venv .venv-physician-pdf
.venv-physician-pdf/bin/python -m pip install -r build/requirements-physician-pdf.txt
.venv-physician-pdf/bin/python build/generate-physician-review-packet.py
```

On Windows, use `.venv-physician-pdf\Scripts\python.exe` for the final two commands. Do not commit the environment or the generated PDF.

The packet deliberately separates the review into two exposures:

1. Page 1 contains only the exact synthetic timelines, intended-use boundary, case-embedded public sources, and neutral first-look prompts.
2. Pages 2–5 reveal the complete distinct retained-display and executable-reference wording, exact artifact fingerprints, all seven structurally extracted UI contract cards, eight bounded contract claims, five separate source representations, the ninth overall source item, and closeout fields.

Do not show the revealed-review handoff or complete archive until the reviewer has recorded and returned the first-look answers. The participant-completed first-look and revealed-review PDFs together are the authoritative participant record; the complete PDF is the frozen blank archive. The reviewer may print and write on the fields or annotate them in Preview, Adobe, or another PDF editor, then must return the completed records privately. `docs/EXTERNAL_REVIEW_PACKET.md` and facilitator notes only mirror the prompts and may not replace the completed PDFs.

After closeout, prepare a deidentified factual summary and ask the participant to confirm that exact summary by a private reply or signature. Retain that confirmation privately. Do not prefill agreement, invent a reviewer, coach toward approval, add patient facts, or call the result clinical validation. Keep completed PDFs, credential-check evidence, conflict details, license numbers, contact details, signatures, confirmations, and raw notes outside the repository; commit only a participant-approved deidentified summary.

The closeout disposition totals cover the nine numbered review items only. The five source-specific sub-dispositions under Item 9 provide audit detail and must not be added to those totals as five extra claims. On Page 1, source access codes are `O = opened`, `U = unavailable`, and `X = outside reviewer scope`.

## Frozen review target

The generator refuses to create final handoffs from a dirty tree. Its explicit `--preview-dirty` mode writes three watermarked previews under `tmp/pdfs/` for visual QA and none may be given to a reviewer. The generator verifies the `5 / 1 / 4` page split, staged text boundary, exact five-link set, required closeout language, and preview watermark before returning. If code or artifacts change after review, preserve the first result and conduct a separately labeled review of the changed wording.

## Authoritative clinical evidence set

The packet uses only the five source URLs embedded in the V2 cases:

- CDC, [Urgent Maternal Warning Signs and Symptoms](https://www.cdc.gov/hearher/maternal-warning-signs/index.html)
- AIM, [Severe Hypertension in Pregnancy Patient Safety Bundle](https://saferbirth.org/psbs/severe-hypertension-in-pregnancy/)
- ACOG, [Headaches and Pregnancy](https://www.acog.org/womens-health/faqs/headaches-and-pregnancy)
- ACOG, [Preeclampsia and High Blood Pressure During Pregnancy](https://www.acog.org/womens-health/faqs/preeclampsia-and-high-blood-pressure-during-pregnancy)
- ACOG, [3 Conditions to Watch for After Childbirth](https://www.acog.org/womens-health/experts-and-stories/the-latest/3-conditions-to-watch-for-after-childbirth)

The exact routing phrases `obstetric triage`, `do not wait for another reply or blood-pressure reading`, and `do not delay to repeat the reading at home` are synthesized product wording. The reviewer must explicitly decide whether each is supported as scoped, should be revised, is outside their scope, or remains unresolved. A source-linked implementation is not semantic review or clinical validation.

## Permitted closeout language

For the current packet, any `revise`, `outside reviewer scope`, or `unresolved` disposition on Items 1–9 keeps the fixture/wording review pending. A revision requires a separately preserved re-review by the same physician at a new commit. An outside-scope or unresolved item requires removing or narrowing the claim, or review by appropriate additional expertise; never overwrite the original packet or counts.

Only after active licensure is established, the practice area is appropriate, all five sources were opened, any conflict is disclosed without calling the review independent, all nine current dispositions are `supported as scoped`, all requested revisions have a separately preserved re-review, and the reviewer privately confirms the exact summary may the project use a participant-approved statement of this form:

> One licensed [practice area] physician in [jurisdiction] reviewed two synthetic V2 fixtures and nine bounded wording/source claims at commit [hash]: [x] supported as scoped, [y] revise, [z] outside scope, and [u] unresolved. This was fixture-level wording and source review, not product approval, clinical validation, medical advice, or evidence of patient outcomes.

If any condition above is not met or the reviewer declines that scope statement, keep `licensed physician fixture/wording review pending` everywhere. Whether pending or completed, keep the separate clinical-validation status `not claimed`; this review can never set it to validated.
