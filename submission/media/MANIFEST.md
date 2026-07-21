# Devpost media manifest

Recaptured on July 20, 2026 from the current local production build after the plain-language and run-comparison update. The images bind the exact source bytes below. They are not proof of a public deployment or final-commit CI. Public release remains blocked until the current tip is committed, checked by CI, deployed, and paired with the final video.

## Source state

The hashes below match the source bytes used for the five final captures. Every source is release-gated against its exact SHA-256; a change requires recapture or explicit visual revalidation.

| Rendered or computed source | SHA-256 at capture |
| --- | --- |
| `app/components/witnesspatch-lab.tsx` | `afed540dc72026fffeaf1fee0ebab50d634d1efd9a4f1af128ca11fc70e649cc` |
| `app/components/local-witness-compiler.tsx` | `60324468123bcead7566a71522b5eaab64597caa60f11676bbf35aebf17239aa` |
| `app/globals.css` | `ab17f19ec133a65445318193957a3ba595ddfbacbaa8c454b701c5b468cc4e6b` |
| `app/layout.tsx` | `bb9450c4204bad86f0ed9b4cdc378b704aeadffc1a702ba8925e434366331013` |
| `app/page.tsx` | `c2eaa4d27f54d044c6b8040ef6054a73226efc3e7d00569af2e98bc596ac53ee` |
| `engine/browser-witness-compiler.mjs` | `88ebe6637387793e58c2878b455d354e340f734dd6a299135da0626e9d93ed8f` |
| `engine/browser-verifier.mjs` | `5223b8a99b9f643f3a1430740afc18dd9c2c85e0f0186f1673c9465c82273473` |
| `public/runs/v2/clinical-scope.json` | `025fb0040461e9aabc199ff177a2cf191811b24b2a17b2b8991530ec082b8de7` |
| `public/runs/v2/manifest.json` | `3e72fd8cf8edc0a00bbc513eb6bf498d24a550f8717d9df24d2837350f608541` |
| `public/runs/v2/postpartum-warning-signs-baseline.json` | `bad5fe7128857a4585e04bd86f5635d4686fefa513292d64073b139d24577e7e` |
| `public/runs/v2/postpartum-warning-signs-case.json` | `d2a33d13a6bc6814031dd1771ad8f137e02415b06d46dd0f6d53e33caa8761bc` |
| `public/runs/v2/postpartum-warning-signs-repaired.json` | `bb908405163162379c3ec274afc4176805d2d0efbc507bee26bd2abc882e0ad2` |
| `public/favicon.svg` | `0f78d301d822f76f60f9f591365dc45ab4025cd87af5fc46a9916e49267a6b08` |

## Capture method

1. Built the current source state for production and served that exact local static export.
2. Used a fresh named Playwright Chromium session at exactly `1200 x 800` CSS pixels without account state, credentials, or unrelated tabs.
3. Captured direct viewport PNGs. No image was cropped, padded, scaled, retouched, or regenerated after capture.
4. For the comparison frame, used **Load included sample**, affirmed the synthetic-data declaration, and checked both complete saved runs against the same case.
5. For the reference frames, selected **Turn failure into test**, then **Check example repair**, before capturing the generated test, repair checks, and receipt.
6. Inspected all five images at original resolution. The browser session recorded zero console errors and zero console warnings.

## Assets

| File | Caption | Capture state | Dimensions | Bytes | SHA-256 |
| --- | --- | --- | ---: | ---: | --- |
| `01-thumbnail-failure.png` | The agent waited after the minute two deadline. | Fresh synthetic reference before any action: failed run `50/100`, two required actions missed, first missed deadline `T+02`, and **Turn failure into test** ready. | 1200 x 800 | 165010 | `cb0d679bfd196b5e3d7f6c240b4f3ff1f4b01c077db973f2b0cf4f7e2bed55b1` |
| `02-model-run-comparison.png` | Compare complete saved runs with the same rules. | The included authored failed and repaired runs are both visible. The selected failed run scores `50/100`; the repaired run scores `100/100`. The screen states that model names are unverified and that real cross-model use requires one saved run from each model. | 1200 x 800 | 138828 | `1ea323424dcd5585a06179c4bc56e90f37e23b59c6362a7292e3767ab1266e8d` |
| `03-reference-compiled-test.png` | The missed action becomes a portable Node test. | After **Turn failure into test**, the nine-file package is visible. The original run still fails, the first missed rule is `INV-02` at `T+02`, and three of nine recorded facts show the miss. | 1200 x 800 | 137881 | `d509189f69e3ccb2f66902a73d07a51bf87d20b281f5df79ebb6d0280dcfa7c9` |
| `04-reference-verified-receipt.png` | The app, not the model, checks the repair. | After **Check example repair**, the receipt shows `23/23` files matched, both saved runs recalculated, and `4/4` extra checks passed. The Sol setting is labeled as requested, and the screen states the clinical and publisher limits. | 1200 x 800 | 192331 | `1e3bd10f91d847c6b99de90570b624125a0595348ea9dd9ab3f9a9f017a7cdec` |
| `05-reference-success-closure.png` | The original run still fails; the repair passes; overreaction is rejected. | With **Repair diff** selected, the original run remains `50/100`, the example repair passes at `100/100`, the authored comparison case passes at `100/100`, and the version that treats everything as urgent fails at `25/100`. | 1200 x 800 | 129745 | `abc9f12f3cfdf13b21fe79c28f8cad0671c8e949913b60e8b49627a9aa2ab399` |

Each PNG is 8-bit RGB, non-interlaced, exact `3:2`, and below Devpost's 5 MB per-image limit.

**Recommended Devpost gallery order:** `01 → 02 → 03 → 05 → 04`. This shows the problem, run comparison, generated test, repair check, and receipt in the same order a judge can replay them.

## Truthful scope

- Every case shown is fully synthetic; these images contain no patient, account, or production data.
- The local checkbox records a declaration. It is not a PHI scanner, does not detect undisclosed patient data, and does not prove de-identification.
- `50/100` and `100/100` are scores for authored software rules, not clinical-performance scores or evidence of patient outcomes.
- The static `9 → 3` reduction holds recorded decisions fixed. It is not target-in-the-loop, counterfactual, semantic, or clinically minimal.
- The reference browser checks exact inputs against the file list shipped with this app. A downloaded package records hashes but does not prove who published it.
- The receipt's hashes establish integrity against the same app build, not publisher identity or a cryptographic signature.
- The recorded `gpt-5.6-sol` and `ultra` fields describe the requested configuration retained by the project; they are not independent served-model attestation.
- WitnessPatch is developer safety tooling, not clinical decision support. No physician fixture/wording review or clinical validation was performed; clinical validation is not claimed.

## Verification

- All five final files were visually inspected at original resolution after export. No black or redaction artifacts, unintended clipping, browser chrome, account details, credentials, local paths, or personally identifying information are present.
- The fresh local production-build session recorded zero console errors and zero console warnings. Every recorded request was same-origin. The run comparison fetched the three included JSON files; the reference check fetched only the static files listed by this app. No API or external-network request was made.
- The local ZIP passed archive integrity; all nine browser files were byte-identical to the shipped CLI output, the default regression exited red, and the supplied repaired candidate exited green.
- The automated submission gate recomputes every image byte count/hash, PNG geometry, and source fingerprint above.
