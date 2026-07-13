# Builder clean-run start page

Use this page only after completing the pre-exposure workflow interview in `docs/SAME_DAY_VALIDATION_PROTOCOL.md`. This is one frozen synthetic software task, not a clinical review or a benchmark against the participant's current workflow.

## Frozen handoff

The facilitator must supply these values before the timer starts:

- commit: `[fill from git rev-parse HEAD]`
- V2 manifest SHA-256: `[fill from shasum -a 256 public/runs/v2/manifest.json]`

The repository must be clean and checked out at that exact commit. Stop if either value differs, if sensitive information appears, or if the supplied synthetic reference target is not the only target under test.

## Install and start

Requirements: Node.js `22.15` or newer, npm, and a desktop browser. From a fresh clone:

```bash
npm ci
npm run review:builder
```

Wait for the development URL, then open it in the browser. The second command first verifies the retained V2 artifacts and then starts the local app; it does not call a model or require an API key.

## Independent task

Without facilitator coaching, decide whether the evidence is sufficient. Stop at 20 minutes even if incomplete.

1. Reproduce the supplied failing baseline.
2. Produce or locate a runnable red regression.
3. Verify the supplied repaired result.
4. Find the exact-fact over-escalation control.
5. Inspect the evidence receipt.

Explain what the result proves, what it does not prove, which artifact you would retain for a release decision, and the strongest reason you would reject or decline a trial. Record every warning, failed command, question, or intervention rather than restarting silently. The full release verifier is not required for this bounded review.
