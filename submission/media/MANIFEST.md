# Devpost media manifest

Recaptured on July 13, 2026 from the claim-hardened production candidate identified by the exact source hashes below. The images bind those bytes directly. Checkpoint `04ffd9feaac99b7e3c064cb19ba9159cfaec2fca` remains the prior clean-clone reproducibility record; the exact final submitted commit still requires its own replay after external release fields are frozen.

## Source state

The hashes below match the source bytes used for the four final captures. Every source is release-gated against its exact SHA-256; a change requires recapture or explicit visual revalidation.

| Rendered or computed source | SHA-256 at capture |
| --- | --- |
| `app/components/witnesspatch-lab.tsx` | `426a5cfe10208d8569475a2fbc11d3109d29cc22522240fc7f9bb9b5cdff252d` |
| `app/components/local-witness-compiler.tsx` | `7a8f12ac3a066d075f5a0eb533ad7648e8d4fd8a890ad441608584d51f1d4525` |
| `app/globals.css` | `e4735f730d5886720a1ccb5ee3fff608931124fe5acb68e8c0c7ec56104234ab` |
| `app/layout.tsx` | `4509d3b35e05ee1496ab1f01badf29570b759f0ca61ed2ad54e04d22cdf916c2` |
| `app/page.tsx` | `076fab55c786882ce786014207a6f69a933c8091f7302c09bf845769ed25f4d1` |
| `engine/browser-witness-compiler.mjs` | `dbd398387c13607083c76e0335768e3ededb6a332d8ca09c320f005607ccab1f` |
| `engine/browser-verifier.mjs` | `8803a2e7d77d4e724c8071977cb57e4e097a841ef2a99d9ea080bafd010b2580` |
| `public/runs/v2/clinical-scope.json` | `0aa11e0ccf7cafbd6027289d098ea0c69bd6371c332bb6c6bfbaf16e3570e8c8` |
| `public/runs/v2/manifest.json` | `46542e562fe15b7fcec50f5a42d45e145614791c2bac7432ce5289440b9597f2` |
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
| `01-thumbnail-failure.png` | At T+02, the agent had the warning-sign facts—and still waited. | Fresh reference page before any action: fully synthetic baseline at `50/100`, two critical breaches, earliest critical deadline `T+02`, `9 → 3` facts, locked evaluation contracts, and **Compile failure** available. | 1200 x 800 | 237752 | `89a7215a12e38bdad8b20f68bcaa5e1213854eb029f0753708821e5aee486633` |
| `02-local-input-compiled-red.png` | Load one included synthetic failure; get a nine-file red regression locally. | The included exact public case and failing run were loaded in the isolated local workspace before the synthetic-data declaration and compile: fresh `50/100`, `INV-02` and `INV-03`, failure known at `T+02`, `9 → 3` facts, nine files, `2` hashes computed, `0` externally verified, and ZIP export available. | 1200 x 800 | 88157 | `1fac0225fb5d06675d94ea66b50396742c03fe811dc79f8e4d034cd43f129a67` |
| `03-reference-compiled-red.png` | A manifest-bound reference failure becomes a portable RED test. | After **Compile failure**, with the judge-readable nine-file bundle map visible: this browser session verified `2/2` exact manifest inputs and generated nine files for `INV-02` at `T+02`; the baseline remains RED and the portable ZIP deliberately carries no external-manifest or publisher attestation. | 1200 x 800 | 135758 | `97b5eca486f064a79da01576e7c6bb1f35ba05e90b4414ee1386e5462e5e3ed1` |
| `04-reference-verified-receipt.png` | Locked verification—not the model—owns the pass. | After **Verify retained repair**, with **Audit receipt** selected: the sidebar retains **Baseline red · repair passes**, while the receipt shows retained reference `100/100`, `23/23` hashes, `2/2` regrades, `4/4` reference holdouts, fresh candidate quarantined and not installed, no patient data, no API key, licensed-physician fixture/wording review pending, and clinical validation not claimed. | 1200 x 800 | 208732 | `1fded2aa4cdc9f12a54613cd914d3e82bf543ef78396f02271f2273eb3787a9a` |

Each PNG is 8-bit RGB, non-interlaced, exact `3:2`, and below Devpost's 5 MB per-image limit.

## Truthful scope

- Every case shown is fully synthetic; these images contain no patient, account, or production data.
- The local checkbox records a declaration. It is not a PHI scanner, does not detect undisclosed patient data, and does not prove de-identification.
- `50/100` and `100/100` are bounded software-contract fixture scores, not clinical-performance scores or evidence of patient outcomes.
- The static `9 → 3` reduction holds recorded decisions fixed. It is not target-in-the-loop, counterfactual, semantic, or clinically minimal.
- The reference browser session verifies exact inputs against this app's manifest. The detached bundle deliberately retains only computed hashes and an unverified-input declaration so byte-identical CLI/local output does not masquerade as portable publisher provenance.
- The receipt's hashes establish integrity against the same app build, not publisher identity or a cryptographic signature.
- The recorded `gpt-5.6-sol` and `ultra` fields describe the requested configuration retained by the project; they are not independent served-model attestation.
- WitnessPatch is developer safety tooling, not clinical decision support. Licensed-physician fixture review remains pending; its bounded scope is fixture/wording only, and clinical validation is not claimed.

## Verification

- All four final files were visually inspected at original resolution after export. No black or redaction artifacts, unintended clipping, browser chrome, account details, credentials, local paths, or personally identifying information are present.
- The fresh production-browser reference and local-input QA recorded zero console errors and zero console warnings. Same-page controls emitted no `/.rsc` or `404` requests. Aside from same-origin application chunks and the included sample's two expected JSON fetches, the local workflow made no API or external-network requests; compilation made no further data request.
- The local ZIP passed archive integrity; all nine browser files were byte-identical to the shipped CLI output, the default regression exited red, and the supplied repaired candidate exited green.
- The automated submission gate recomputes every image byte count/hash, PNG geometry, and source fingerprint above.
