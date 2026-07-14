# 2:53 founder-voice judge demo

## Current status

The product flow is locally verified and recordable. The final public YouTube video required by the [Official Rules](https://openai.devpost.com/rules) has not been recorded or uploaded. Record a real one-take product run targeting `2:50–2:55`, never `3:00`; the controlling rule says the video must be shorter than three minutes.

Do not say the brother is a teammate until he has joined the Devpost draft and contributed. The founder may truthfully say, “I’m a third-year medical student”; that explains motivation, not clinical authority.

## Cut-ready script

| Time | Exact narration | Screen action and proof |
|---|---|---|
| `0:00–0:13` | “I’m Fuzlullah Syed, a third-year medical student. Healthcare-agent failures die as screenshots. WitnessPatch turns one failed answer into a CI gate.” | Start at the top of the reference page. Keep `50`, `2` critical breaches, `T+02`, **Locked rules**, and **Healthcare-agent release gate** visible. |
| `0:13–0:29` | “At T-plus-two, the agent knows the synthetic patient is eight days postpartum, with an unrelieved headache and visual changes. It still waits for blood pressure arriving four minutes later, breaking two locked rules.” | Point from `T+02` to the failed response and locked verifier. Do not scroll yet. |
| `0:29–0:46` | “I chose the synthetic case and review boundary. During Build Week, Codex built and stress-tested the compiler. A separate GPT-5.6 Sol run proposed repair data; locked code decides every score.” | Point to **GPT-5.6 Sol requested**, **Codex · Ultra requested configuration**, then **Locked rules—not model-graded**. |
| `0:46–1:00` | “Compile Failure checks two saved inputs, recalculates the baseline, and builds a nine-file Node test bundle. It calls no model and does not rerun the agent.” | Select **Compile failure**. Wait until the button becomes **Verify retained repair**, then use **How it works** to move to the artifact panel. |
| `1:00–1:14` | “It pinpoints INV-02 at T-plus-two and narrows nine facts to three with the response fixed. The exported test stays red; the repair is checked separately.” | Show `2/2 exact inputs`, the judge-readable nine-file map, `INV-02`, `T+02`, `9→3`, and **BASELINE RED**. Briefly select **View complete test**, return to **View bundle map**, then select **Export complete 9-file ZIP**. |
| `1:14–1:38` | “But this is not just a canned replay. Compile Your Files accepts a synthetic case and failed run, hashes and regrades them only in this browser, labels them zero externally verified, and exports the same nine-file format.” | Return to the top with the **WitnessPatch** button and select **Compile your files**. Select **Load included sample**, wait until both loaded filenames appear, check the fully synthetic confirmation, and select **Compile red witness**. Show **COMPILED RED**, `2 hashes computed · 0 externally verified`, and `9 files`; then select **Return to reference demo**. |
| `1:38–1:55` | “Back on the reference, the verifier checks 23 saved files, recalculates both scores, and runs four challenges. Same case and rules: 50 becomes 100 with no critical failures.” | Select **Verify retained repair** and wait for **Freshly verified in this browser**. Hold on the explicit original-failure-red / retained-repair-pass hero, `100`, `0`, and **Contract satisfied**. |
| `1:55–2:17` | “The retained reference repair and Sol’s proposal stay separate. The reference repair passes four checks. Sol’s proposal remains quarantined; the browser reads constrained data, and only the local verifier runs its code.” | Use **How it works** to show **Repair diff** and `4/4`, then select **Audit receipt**. Point to **quarantined · not installed** and **Node only · browser interprets JSON IR**. |
| `2:17–2:37` | “The receipt records all 23 file checks, both new scores, and four checks on Sol’s proposal. It records the requested model setup, not proof of which model was served.” | Show `23/23`, fresh `2/2`, fresh `4/4`, and the requested model configuration. |
| `2:37–2:53` | “The intended user is a healthcare-agent evaluation engineer moving a captured failure into code review. No patient data, API key, or live model call. Physician review is pending; this proves one synthetic path, not clinical safety.” | End on the receipt with **None · fully synthetic**, **API key Not required**, **Licensed-physician fixture/wording review pending**, **Clinical validation not claimed**, and **Clinical use Not permitted** visible. |

## Recording preflight

- Load the page and wait at least five seconds before recording so hydration is complete.
- Record around `1400` CSS pixels wide at 1440p or higher, with clear English founder narration.
- Start from a fresh baseline. Do not precompile, splice in success, or begin on a generated artifact.
- Hide bookmarks, notifications, credentials, local paths, unrelated tabs, and private Codex traces.
- Use the **How it works** and **WitnessPatch** navigation buttons for controlled movement instead of free scrolling.
- Capture the real verification transitions and wait for their visible completion states.
- Keep the exported baseline explicitly **BASELINE RED** after repair verification; only the separate retained repair passes.
- Keep the uploaded cut below three minutes after YouTube processing, and add accurate captions.
- Upload `submission/video/witnesspatch-demo.en.srt`; the submission gate verifies every cue, millisecond boundary, readability limit, and word against this exact narration.
- Use no unlicensed music, third-party logos, reviewer identity, or patient information.

## Claims that are prohibited

- Do not say “Sol fixed it” or “the AI repair passed.” The retained reference and quarantined Sol candidate are distinct.
- Do not say tamper-proof, signed, publisher-authenticated, or independently attested model identity.
- Do not claim clinical validity, medical correctness, safety certification, production readiness, HIPAA compliance, lives saved, or patient outcomes.
- Do not say the browser executes candidate JavaScript or applies the patch.
- Do not imply blood-pressure threshold inference beyond the two exact fixture-supplied endpoints.
- Do not say the baseline regression turns green. It remains **BASELINE RED** beside **RETAINED REPAIR PASS**.
- Do not call the displayed patch a complete diff; it is an abridged verified behavior-diff excerpt.
- Do not call the static witness target-in-loop, counterfactual, clinically minimal, or proof of generalization.
