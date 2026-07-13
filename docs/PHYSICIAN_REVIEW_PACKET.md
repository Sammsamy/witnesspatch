# WitnessPatch V2 licensed-physician fixture and wording review

Use the generated five-page PDF in `output/pdf/witnesspatch-physician-review-packet.pdf` with the licensed-physician session in `docs/SAME_DAY_VALIDATION_PROTOCOL.md`. The generator is an optional facilitator tool, separate from the Node judge path. In a dedicated virtual environment, install its pinned dependency and generate from a clean frozen checkout with:

```bash
python3 -m venv .venv-physician-pdf
.venv-physician-pdf/bin/python -m pip install -r build/requirements-physician-pdf.txt
.venv-physician-pdf/bin/python build/generate-physician-review-packet.py
```

On Windows, use `.venv-physician-pdf\Scripts\python.exe` for the final two commands. Do not commit the environment or the generated PDF.

The packet deliberately separates the review into two exposures:

1. Page 1 contains only the exact synthetic timelines, intended-use boundary, case-embedded public sources, and neutral first-look prompts.
2. Pages 2–5 reveal the complete distinct retained-display and executable-reference wording, exact artifact fingerprints, all seven structurally extracted UI contract cards, eight bounded contract claims, five separate source representations, the ninth overall source item, and closeout fields.

Do not show Pages 2–5 until the reviewer has recorded the Page 1 answers. The generated PDF is the authoritative participant record: the reviewer must complete Pages 2–5, while `docs/EXTERNAL_REVIEW_PACKET.md` and the facilitator's notes only mirror the prompts and may not replace the completed PDF. Do not prefill agreement, invent a reviewer, coach toward approval, add patient facts, or call the result clinical validation. Keep the completed packet, credential-check evidence, conflict details, license numbers, contact details, signatures, and raw notes outside the repository; commit only a participant-approved deidentified summary.

The closeout disposition totals cover the nine numbered review items only. The five source-specific sub-dispositions under Item 9 provide audit detail and must not be added to those totals as five extra claims.

## Frozen review target

The generator refuses to create a final packet from a dirty tree. Its explicit `--preview-dirty` mode writes a watermarked preview under `tmp/pdfs/` for visual QA and must never be given to a reviewer. If code or artifacts change after review, preserve the first result and conduct a separately labeled review of the changed wording.

## Authoritative clinical evidence set

The packet uses only the five source URLs embedded in the V2 cases:

- CDC, [Urgent Maternal Warning Signs and Symptoms](https://www.cdc.gov/hearher/maternal-warning-signs/index.html)
- AIM, [Severe Hypertension in Pregnancy Patient Safety Bundle](https://saferbirth.org/psbs/severe-hypertension-in-pregnancy/)
- ACOG, [Headaches and Pregnancy](https://www.acog.org/womens-health/faqs/headaches-and-pregnancy)
- ACOG, [Preeclampsia and High Blood Pressure During Pregnancy](https://www.acog.org/womens-health/faqs/preeclampsia-and-high-blood-pressure-during-pregnancy)
- ACOG, [3 Conditions to Watch for After Childbirth](https://www.acog.org/womens-health/experts-and-stories/the-latest/3-conditions-to-watch-for-after-childbirth)

The exact routing phrases `obstetric triage`, `do not wait for another reply or blood-pressure reading`, and `do not delay to repeat the reading at home` are synthesized product wording. The reviewer must explicitly decide whether each is supported as scoped, should be revised, is outside their scope, or remains unresolved. A source-linked implementation is not semantic review or clinical validation.

## Permitted closeout language

Only after all requested revisions are re-reviewed may the project use a participant-approved statement of this form:

> One licensed [practice area] physician in [jurisdiction] reviewed two synthetic V2 fixtures and nine bounded wording/source claims at commit [hash]: [x] supported as scoped, [y] revise, [z] outside scope, and [u] unresolved. This was fixture-level wording and source review, not product approval, clinical validation, medical advice, or evidence of patient outcomes.

If any material item is unresolved, any required revision has not been re-reviewed, or the reviewer declines that scope statement, keep `licensed physician fixture review pending` everywhere.
