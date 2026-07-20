# Release verification evidence

This is entrant-authored reproducibility evidence, not independent validation, a broad platform guarantee, or proof of clinical correctness.

## Current notice-corrected candidate

- Static client: `55` physical files, canonical manifest SHA-256 `9238879c5d87b96557f0988af01c0998fb185dbe56ff533b1e6e5605e60e595a`.
- Local release command: `npm run verify:release` exits `0` on macOS and reports `136/136` core tests, `6/6` rendered-product checks, `1/1` development-server smoke check, `9/9` submission-package checks, and `6/6` deployment-rendered checks: `158/158` aggregate executions.
- The same run passes deterministic V1/V2 artifact verification, the zero-argument judge proof, build, lint, typecheck, the 624-entry license audit, byte-identical bundled notices, the static fingerprint, and a 59-asset Cloudflare dry run.
- The corrected `THIRD_PARTY_NOTICES.md` now describes the public MIT source/static route and confirmed entrant-authored visual assets. Because that file is distributed, its byte change intentionally produced the new static fingerprint above.
- Static-release checkpoint `7dd4df9275d5df75f6da4bc4c3722fdc92a2138e` has successful exact-commit public CI and a 51-file byte-matched deployment. The final freeze will recheck the then-current default-branch tip together with the public video and Codex-returned `/feedback` Session ID.

## Completed public static-release checkpoint

- Commit: `7dd4df9275d5df75f6da4bc4c3722fdc92a2138e` on public default branch `codex/build-week` at verification time.
- Repository: `https://github.com/Sammsamy/witnesspatch`; public access and MIT detection confirmed.
- CI: successful exact-commit `Verify` push run `29781423832` at `https://github.com/Sammsamy/witnesspatch/actions/runs/29781423832`.
- Deployment: `https://witnesspatch.ankigpt.workers.dev`; all 51 public files matched the reviewed static fingerprint, excluding only the four documented generated hosting-control files.
- Clean Chrome replay: the reference and local-input paths passed with zero console warnings or errors; an independent network audit returned `23/23` exact V2 manifest-listed files.
- Cross-platform replay: macOS passed `158/158`; prior source checkpoint `87dee97` passed local Debian 12 arm64 `157/158`, with only the expected case-insensitive-filesystem test skipped on its case-sensitive filesystem.

## Platform and claim boundary

- Chrome on macOS is verified for the documented reference and included-sample flows; this is not a broad browser matrix.
- One local Debian 12 arm64 source verification is recorded; Windows remains unverified.
- Same-build hashes establish integrity against the reviewed app build, not publisher identity, independent timestamping, or a signature.
- Every case is fully synthetic. No physician fixture/wording review or clinical validation was performed; clinical validation is not claimed.
