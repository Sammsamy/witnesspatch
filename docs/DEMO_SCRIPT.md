# 75-second judge demo

## Current status

The two-stage product flow passed real Chrome: it compiled `2/2` exact inputs into a nine-file red bundle, then verified `23/23` retained artifacts and both proof signatures with zero console warnings or errors. The final public, founder-voiced video required by the [Official Rules](https://openai.devpost.com/rules) is not yet recorded or uploaded. Keep the final video under three minutes; this 75-second cut leaves margin and avoids unsupported claims.

## Script

**0:00–0:08 — Failure and user**

> Healthcare-agent safety teams still lose failures in screenshots. WitnessPatch compiles one synthetic failure into a red regression and review-gated target patch.

Show the `50/100` baseline and **2 critical failures** immediately.

**0:08–0:18 — Time-fenced failure**

> At T-plus-two, this agent knows the patient is eight days postpartum with unrelieved headache and visual changes, but delays the declared urgent route.

Point to the time-locked facts and failed `INV-02`/`INV-03`. Do not characterize the fixture as clinically validated.

**0:18–0:28 — Trust boundary**

> Our Codex workflow requested GPT-5.6 Sol with Ultra reasoning to help build and audit this. It never grades itself. Locked code owns every verdict.

Point to the locked grader and the real target-policy diff. Say that recorded decisions remain fixed; do not call the witness target-in-loop, counterfactual, or clinically minimal.

**0:28–0:43 — Compile the failure**

Select **Compile failure**.

> Nothing was pre-rendered as generated. This browser hashes and fully validates the two exact synthetic inputs, regrades the failure, and compiles an exportable nine-file red regression ZIP for INV-02 at T-plus-two—9 facts down to 3. No model or target rerun.

Show **BASELINE RED**, `2/2 exact inputs`, the generated `regression.test.mjs`, `9 → 3`, and **Export complete 9-file ZIP**. You do not need to open the download tray in the final cut.

**0:43–0:58 — Verify the repair**

Select **Verify retained repair**.

> Now the separate verifier checks 23 retained artifacts, freshly regrades the reference, reruns its mutations, and safely interprets the quarantined candidate's JSON proposal. Locked code—not the model—owns the pass.

Let the actual `50 → 100` transition finish. Keep the exact-control and always-escalate results visible.

**0:58–1:08 — Evidence and honesty**

> Reference proof: two regrades and four holdouts. The fresh post-start run requested Sol Ultra; its distinct candidate is quarantined and separately matches two cases and four mutations. The old V1 candidate still fails.

Open the receipt. Show `23/23`, **JSON IR only in browser**, **not installed**, and the fresh `2/2` plus `4/4` signatures. Then show the unchanged V1 candidate's `85/100` urgent result and `not executable` exact-control result. Say “requested `gpt-5.6-sol` / `ultra`”; the receipt is not independent served-model attestation. Do not call the fresh candidate the retained reference repair.

**1:08–1:15 — Founder and boundary**

> I'm a third-year medical student building this with my brother. That motivates us; it is not clinical authority. Synthetic developer tooling. Physician review pending.

End inside the product, with **No API key required**, **Fixture-supplied BP class**, and **Physician validation pending** visible.

## Recording checklist

- Use founder voice, clear audio, and a publicly accessible YouTube URL; keep the submitted cut under three minutes.
- Explain both Codex and GPT-5.6 contributions, as the rules require.
- Record at 1440p or higher with the browser around 1200–1400 CSS pixels wide.
- Hide bookmarks, notifications, credentials, unrelated tabs, and private Codex traces.
- Capture the real verification animation and receipt; do not splice in a fake success state.
- Capture the live **Compile failure** step first: `2/2` inputs, nine generated files, `RED`, `INV-02`, T+02, and `9→3`. The initial screen must not imply that a generated regression already exists.
- Keep **BASELINE RED** and **RETAINED REPAIR PASS** visibly distinct after verification; the exported baseline regression is supposed to remain red until pointed at a repaired candidate.
- Show `23/23` exact hashes; the reference `2/2` regrades and `4/4` holdouts; and the fresh candidate's separate `2/2` JSON-IR regrades and `4/4` mutation checks—not V1's 16-file/13-check proof.
- State that the browser interprets declarative JSON and does not execute retained candidate JavaScript or apply patches; the Node verifier executes the candidate.
- Describe `gpt-5.6-sol` and `ultra` as the requested configuration recorded by the receipt, not independently attested served identity.
- Say **exact-fact negative control**, never “benign twin.”
- State that classifications are fixture-supplied at exactly `118/74` and `168/112`; do not claim threshold inference.
- Distinguish the retained V2 reference patch, fresh post-start quarantined candidate, and rejected pre-start V1 candidate.
- Never say “clinically validated,” “certifies safety,” “saves lives,” “production-ready,” or “HIPAA compliant.”
- Keep the first visible failure inside the first ten seconds.
