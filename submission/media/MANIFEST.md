# Devpost media manifest

Recaptured on July 13, 2026 from the claim-hardened production source state based on Git HEAD `214854a52e7e8f5d6265405881b80a1965b5c0f5` plus the tracked source changes included in the same commit as this manifest. At capture time those tracked changes were uncommitted. The images evidence the exact listed source bytes; the separate clean-checkout receipt carries build reproducibility evidence.

## Source state

The hashes below match the source bytes used for the four final captures. Every source is release-gated against its exact SHA-256; a change requires recapture or explicit visual revalidation.

| Rendered or computed source | SHA-256 at capture |
| --- | --- |
| `app/components/witnesspatch-lab.tsx` | `e6ba08227044bb523876eeb38673e4046df30db01da960776aca72724e598de8` |
| `app/components/local-witness-compiler.tsx` | `74ecad5b2e287a018f535f37d10d9881cc77c15c525e1c9df8bc19936d335f2f` |
| `app/globals.css` | `373107e402065c44e113f10e0330397b7822c72c31036076c978e78411a2260d` |
| `app/layout.tsx` | `4509d3b35e05ee1496ab1f01badf29570b759f0ca61ed2ad54e04d22cdf916c2` |
| `app/page.tsx` | `076fab55c786882ce786014207a6f69a933c8091f7302c09bf845769ed25f4d1` |
| `engine/browser-witness-compiler.mjs` | `dbd398387c13607083c76e0335768e3ededb6a332d8ca09c320f005607ccab1f` |
| `engine/browser-verifier.mjs` | `a6f46bd91f888740a2417014ed40125a728d1439fcac68e10a86ce6a5c9339e4` |
| `public/runs/v2/clinical-scope.json` | `e5ddcc02adc9bd8e2e354bc1cd2b65bd7c1c2a480310b214eb8d5652b68bea1d` |
| `public/runs/v2/manifest.json` | `c9fb456837b1f12b0c9c8a24558fdbca9360cda1be5ced6b7cdc4d3650709522` |
| `public/runs/v2/postpartum-warning-signs-baseline.json` | `bad5fe7128857a4585e04bd86f5635d4686fefa513292d64073b139d24577e7e` |
| `public/runs/v2/postpartum-warning-signs-case.json` | `d2a33d13a6bc6814031dd1771ad8f137e02415b06d46dd0f6d53e33caa8761bc` |
| `public/runs/v2/postpartum-warning-signs-repaired.json` | `bb908405163162379c3ec274afc4176805d2d0efbc507bee26bd2abc882e0ad2` |
| `public/favicon.svg` | `0f78d301d822f76f60f9f591365dc45ab4025cd87af5fc46a9916e49267a6b08` |

## Capture method

1. Built the feature-frozen source state for production and served it only on `127.0.0.1:3000`.
2. Used fresh Playwright Chromium sessions at exactly `1200 x 800` CSS pixels without account state, cookies, credentials, or external tabs.
3. Captured direct viewport PNGs. No image was cropped, padded, scaled, retouched, or regenerated after capture.
4. For the local-input frame, selected the exact public V2 case and baseline files, affirmed the visible synthetic-data declaration, and compiled the result locally.
5. For the reference frames, ran the manifest-bound compiler and then the locked verifier before selecting the named artifact view.
6. Repeated any capture that showed a browser compositor artifact, then inspected the final replacement at original resolution.

## Assets

| File | Caption | Capture state | Dimensions | Bytes | SHA-256 |
| --- | --- | --- | ---: | ---: | --- |
| `01-thumbnail-failure.png` | At T+02, the agent had the warning-sign facts—and still waited. | Fresh reference page before any action: fully synthetic baseline at `50/100`, two critical breaches, earliest critical deadline `T+02`, `9 → 3` facts, locked rules, and **Compile failure** available. | 1200 x 800 | 245495 | `b3962c661519ae2fcfd15c79b74db89ab389fd2e190f82f614ae8a5916963916` |
| `02-local-input-compiled-red.png` | Upload one synthetic failure; get a nine-file red regression locally. | Exact public case and failing run selected in the isolated local workspace after the synthetic-data declaration: fresh `50/100`, `INV-02` and `INV-03`, failure known at `T+02`, `9 → 3` facts, nine files, `2` hashes computed, `0` externally verified, and ZIP export available. | 1200 x 800 | 88242 | `2b5ce76f2a9a3b6848ef519aedb672fa100194ec4a0c3d4a1f7ec7b59351ff27` |
| `03-reference-compiled-red.png` | A manifest-bound reference failure becomes a portable RED test. | After **Compile failure**, with **Executable test** selected: this browser session verified `2/2` exact manifest inputs and generated nine files for `INV-02` at `T+02`; the baseline remains RED and the portable ZIP deliberately carries no external-manifest or publisher attestation. | 1200 x 800 | 144637 | `da0c668f7e802312dd6bacc2cf979e450ec20241738f710a0697b870fbd81cb5` |
| `04-reference-verified-receipt.png` | Locked verification—not the model—owns the pass. | After **Verify retained repair**, with **Audit receipt** selected: retained reference `100/100`, `23/23` hashes, `2/2` regrades, `4/4` reference holdouts, fresh candidate quarantined and not installed, no patient data, no API key, and licensed-physician fixture review pending. | 1200 x 800 | 206351 | `5d8da01710020c110c8635f95e8a2884f7688f525ec7dfdee2af36e0ea917f61` |

Each PNG is 8-bit RGB, non-interlaced, exact `3:2`, and below Devpost's 5 MB per-image limit.

## Truthful scope

- Every case shown is fully synthetic; these images contain no patient, account, or production data.
- The local checkbox records a declaration. It is not a PHI scanner, does not detect undisclosed patient data, and does not prove de-identification.
- `50/100` and `100/100` are bounded software-contract fixture scores, not clinical-performance scores or evidence of patient outcomes.
- The static `9 → 3` reduction holds recorded decisions fixed. It is not target-in-the-loop, counterfactual, semantic, or clinically minimal.
- The reference browser session verifies exact inputs against this app's manifest. The detached bundle deliberately retains only computed hashes and an unverified-input declaration so byte-identical CLI/local output does not masquerade as portable publisher provenance.
- The receipt's hashes establish integrity against the same app build, not publisher identity or a cryptographic signature.
- The recorded `gpt-5.6-sol` and `ultra` fields describe the requested configuration retained by the project; they are not independent served-model attestation.
- WitnessPatch is developer safety tooling, not clinical decision support. Licensed-physician fixture review remains pending; completing it would not establish clinical validation.

## Verification

- All four final files were visually inspected at original resolution after export. No black or redaction artifacts, unintended clipping, browser chrome, account details, credentials, local paths, or personally identifying information are present.
- The feature-frozen production-browser reference and local-input QA recorded zero console errors and zero console warnings. The local compile made no requests after its code chunks were loaded.
- The local ZIP passed archive integrity; all nine browser files were byte-identical to the shipped CLI output, the default regression exited red, and the supplied repaired candidate exited green.
- The automated submission gate recomputes every image byte count/hash, PNG geometry, and source fingerprint above.
