# Devpost media manifest

Recaptured on July 13, 2026 from the claim-hardened production candidate identified by the exact source hashes below. The images bind those bytes directly. Checkpoint `04ffd9feaac99b7e3c064cb19ba9159cfaec2fca` remains the prior clean-clone reproducibility record; the exact final submitted commit still requires its own replay after external release fields are frozen.

## Source state

The hashes below match the source bytes used for the four final captures. Every source is release-gated against its exact SHA-256; a change requires recapture or explicit visual revalidation.

| Rendered or computed source | SHA-256 at capture |
| --- | --- |
| `app/components/witnesspatch-lab.tsx` | `e54f79ccbd016e07d4fadfc84eaabd1f82d8f8b5b1c96e43e92a2a1347b27432` |
| `app/components/local-witness-compiler.tsx` | `7a8f12ac3a066d075f5a0eb533ad7648e8d4fd8a890ad441608584d51f1d4525` |
| `app/globals.css` | `e4735f730d5886720a1ccb5ee3fff608931124fe5acb68e8c0c7ec56104234ab` |
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

1. Built the candidate source state for production and served it only on `127.0.0.1:3018`.
2. Used fresh Playwright Chromium sessions at exactly `1200 x 800` CSS pixels without account state, cookies, credentials, or external tabs.
3. Captured direct viewport PNGs. No image was cropped, padded, scaled, retouched, or regenerated after capture.
4. For the local-input frame, used **Load included sample** to fetch the exact same-origin public V2 case and baseline files, waited until both loaded filenames appeared, affirmed the visible synthetic-data declaration, and compiled the result locally.
5. For the reference frames, ran the manifest-bound compiler and then the locked verifier before selecting the named artifact view.
6. Repeated any capture that showed a browser compositor artifact, then inspected the final replacement at original resolution.

## Assets

| File | Caption | Capture state | Dimensions | Bytes | SHA-256 |
| --- | --- | --- | ---: | ---: | --- |
| `01-thumbnail-failure.png` | At T+02, the agent had the warning-sign facts—and still waited. | Fresh reference page before any action: fully synthetic baseline at `50/100`, two critical breaches, earliest critical deadline `T+02`, `9 → 3` facts, locked rules, and **Compile failure** available. | 1200 x 800 | 237471 | `a53d5524439035f47a119c8ef1bc2115d9e501c6024fc474ec4a5de3901b988d` |
| `02-local-input-compiled-red.png` | Load one included synthetic failure; get a nine-file red regression locally. | The included exact public case and failing run were loaded in the isolated local workspace before the synthetic-data declaration and compile: fresh `50/100`, `INV-02` and `INV-03`, failure known at `T+02`, `9 → 3` facts, nine files, `2` hashes computed, `0` externally verified, and ZIP export available. | 1200 x 800 | 88447 | `aa94b11ec28b66d109c885bbdaf5696f421893e4f7e26fe4705ed1399bdccaa3` |
| `03-reference-compiled-red.png` | A manifest-bound reference failure becomes a portable RED test. | After **Compile failure**, with the judge-readable nine-file bundle map visible: this browser session verified `2/2` exact manifest inputs and generated nine files for `INV-02` at `T+02`; the baseline remains RED and the portable ZIP deliberately carries no external-manifest or publisher attestation. | 1200 x 800 | 133791 | `965a5d68d8dcdf8f5dac3e859e040e884877e24c66f62af7b46190467662527e` |
| `04-reference-verified-receipt.png` | Locked verification—not the model—owns the pass. | After **Verify retained repair**, with **Audit receipt** selected: the sidebar retains **Baseline red · repair passes**, while the receipt shows retained reference `100/100`, `23/23` hashes, `2/2` regrades, `4/4` reference holdouts, fresh candidate quarantined and not installed, no patient data, no API key, and licensed-physician fixture review pending. | 1200 x 800 | 201467 | `cec8cfd93c3b680727a7779efd5cf30db2ca9bc6f19e002b3eda06186ea52a1c` |

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
- The fresh production-browser reference and local-input QA recorded zero console errors and zero console warnings. Same-page controls emitted no `/.rsc` or `404` requests. After the included sample's two expected same-origin JSON fetches, the local compile made no further requests.
- The local ZIP passed archive integrity; all nine browser files were byte-identical to the shipped CLI output, the default regression exited red, and the supplied repaired candidate exited green.
- The automated submission gate recomputes every image byte count/hash, PNG geometry, and source fingerprint above.
