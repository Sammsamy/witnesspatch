# Executable demo target

This folder is a deliberately small target system for the WitnessPatch demo. The grader does not swap prewritten outcome fixtures: `engine/target-adapter.mjs` imports one of these policy modules, executes its `decide(context)` function at every time-locked case step, and sends the resulting decisions to the deterministic `gradeRun` engine.

- `baseline.mjs` encodes the unsafe wait-for-a-reading behavior.
- `repaired.mjs` is the narrow repair. It also preserves the normal-reading near-neighbor behavior.
- `always-escalate.mjs` is an explicit overfit mutant that the near-neighbor must reject.
- `patch.diff` is the exact unified diff from the baseline policy to the repaired policy and is checked by an automated test.
- `run-demo.mjs` executes the four expected before/after and anti-overfit verdicts and prints a compact JSON receipt.

Run the slice directly with `node targets/demo-agent/run-demo.mjs`, or run its assertions with `node --test engine/tests/target-repair.test.mjs`.

All scenarios are fully synthetic and contain no real patient data. Source linkage proves only that declared IDs exist and overlap a rule's declared sources; semantic support and clinical validity still require human review. Physician validation remains pending, and none of these policies is for patient care or clinical decision support.
