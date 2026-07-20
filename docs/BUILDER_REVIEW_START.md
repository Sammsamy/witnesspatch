# Builder clean-run start page

This is the participant-facing task page. The facilitator must run the consent, qualification, pre-exposure interview, independence rules, evidence capture, and closeout in [`docs/BUILDER_REVIEW_PACKET.md`](BUILDER_REVIEW_PACKET.md); do not use this page alone as a completed review protocol.

Use this page only after a pre-exposure workflow interview that avoids revealing the interface or exact mechanism. This is one frozen synthetic software task, not a clinical review or a benchmark against the participant's current workflow.

## Frozen out-of-band handoff

Before the timer starts, the facilitator must privately supply all three values below. Do not edit this checked-in page to fill them; that would dirty the repository being reviewed.

- repository clone URL: `REPOSITORY_URL_FROM_FACILITATOR`
- exact 40-character commit: `COMMIT_FROM_FACILITATOR`
- exact 64-character V2 manifest SHA-256: `MANIFEST_SHA256_FROM_FACILITATOR`

Record the repository-access method without recording credentials. Stop if a value is missing, the preflight rejects it, sensitive information appears, or any external or unauthorized target is introduced. The bundled synthetic reference policies, quarantined candidate, and declared mutations are expected parts of the supplied suite.

## Requirements and current platform boundary

Use Git, Node.js `22.15` or newer, npm, and a current desktop Chrome browser. The review launcher uses a Node process rather than a POSIX-only shell assignment, but that is not a claim of broad platform support. Before this review, the browser path was verified only in Chrome on macOS; source verification also passed one local Debian environment, while Windows and a Linux browser run remained unverified. Record the exact environment and preserve any failure as part of the result.

## Fresh clone, pin, and preflight

Replace each quoted uppercase token below with the exact out-of-band value. Start the 20-minute independent timer immediately before the clone command and record separate clone, install, server-ready, product-task, and bundle-execution milestone times.

```bash
git clone "REPOSITORY_URL_FROM_FACILITATOR" witnesspatch-review
cd witnesspatch-review
git checkout --detach "COMMIT_FROM_FACILITATOR"
node build/review-preflight.mjs --expected-commit "COMMIT_FROM_FACILITATOR" --expected-manifest "MANIFEST_SHA256_FROM_FACILITATOR"
npm ci
npm run review:builder -- --expected-commit "COMMIT_FROM_FACILITATOR" --expected-manifest "MANIFEST_SHA256_FROM_FACILITATOR"
```

The preflight fails unless the repository is clean and both supplied fingerprints match. The final command repeats that preflight, verifies the retained V2 artifacts, and starts the local app without calling a model or requiring an API key. Keep that terminal running and open the exact development URL it prints.

## Independent task

Without facilitator coaching, decide whether the evidence is sufficient. Stop at 20 minutes even if incomplete.

1. Reproduce the supplied failing baseline.
2. Produce and execute its runnable red regression.
3. Verify the supplied repaired result and execute that same regression green against the supplied repair.
4. Find the exact-fact over-escalation control.
5. Inspect the evidence receipt.

When the browser has compiled the baseline, export its complete nine-file ZIP. Keep the development server running, open a second terminal at the same repository root, and run the command below after replacing the three uppercase tokens. Use a new non-identifying session label and a receipt path under ignored `output/`; do not overwrite an earlier attempt.

```bash
npm run review:bundle -- --expected-commit "COMMIT_FROM_FACILITATOR" --expected-manifest "MANIFEST_SHA256_FROM_FACILITATOR" --bundle-zip "BROWSER_EXPORTED_ZIP_PATH" --receipt "output/review/SESSION_ID/bundle-execution-receipt.json"
```

The command accepts only the exact safe nine-entry stored ZIP emitted by the browser, checks every internal hash, recompiles the frozen reference with the CLI, requires `9/9` byte parity, executes the exported regression red on the baseline, and executes the same test green with the supplied retained repair. The milestone is not complete from seeing or downloading a ZIP alone; record the command's `RED exit 1`, `PASS exit 0`, and private receipt SHA-256. The receipt does not establish clinical validity, publisher identity, target-in-loop behavior, adoption, or time saved.

Explain what the result proves, what it does not prove, which artifact you would retain for a release decision, and the strongest reason you would reject or decline a trial. Record every warning, failed command, question, or intervention rather than restarting silently. The full release verifier is not required for this bounded review.
