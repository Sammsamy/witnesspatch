# Release verification evidence

This is entrant-authored reproducibility evidence, not independent validation, a broad platform guarantee, or proof of clinical correctness.

## Current notice-corrected candidate

- Static client: `55` physical files, canonical manifest SHA-256 `7a3c932575d2357725132a811a38d1e1462616c23087ce30a7cdea80d1230fed`.
- Local release command: `npm run verify:release` exits `0` on macOS and reports `136/136` core tests, `6/6` rendered-product checks, `1/1` development-server smoke check, `9/9` submission-package checks, and `6/6` deployment-rendered checks: `158/158` aggregate executions.
- The same run passes deterministic V1/V2 artifact verification, the zero-argument judge proof, build, lint, typecheck, the 624-entry license audit, byte-identical bundled notices, the static fingerprint, and a 59-asset Cloudflare dry run.
- The corrected `THIRD_PARTY_NOTICES.md` now describes the public MIT source/static route and confirmed entrant-authored visual assets. Because that file is distributed, its byte change intentionally produced the new static fingerprint above.
- The exact final commit still requires successful public CI, byte-matched deployment, a public narrated video, the Codex-returned `/feedback` Session ID, and `npm run release:freeze`.

## Completed public checkpoint

- Commit: `94297a475b09aacf14478a11aff2ebbcf4266bdc` on public default branch `codex/build-week`.
- Repository: `https://github.com/Sammsamy/witnesspatch`; public access and MIT detection confirmed.
- CI: successful exact-commit `Verify` push run `29777845724` at `https://github.com/Sammsamy/witnesspatch/actions/runs/29777845724`.
- Deployment: `https://witnesspatch.ankigpt.workers.dev`; the checkpoint's reviewed public bytes and clean Chrome reference/local-input flows were verified with zero console warnings or errors.
- Cross-platform replay: macOS passed `158/158`; local Debian 12 arm64 passed `157/158`, with only the expected case-insensitive-filesystem test skipped on its case-sensitive filesystem.

## Platform and claim boundary

- Chrome on macOS is verified for the documented reference and included-sample flows; this is not a broad browser matrix.
- One local Debian 12 arm64 source verification is recorded; Windows remains unverified.
- Same-build hashes establish integrity against the reviewed app build, not publisher identity, independent timestamping, or a signature.
- Every case is fully synthetic. No physician fixture/wording review or clinical validation was performed; clinical validation is not claimed.
