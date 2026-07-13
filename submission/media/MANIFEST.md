# Devpost media manifest

Recaptured on July 13, 2026 from a production static export of the current uncommitted working tree, based on Git HEAD `a80b3f754674b173a9a49bf0ecb396c939a2c97a`. The images are not evidence of a clean or submitted commit.

## Source state

The rendered visual-source changes relative to HEAD were present but uncommitted at capture time. An isolated copy of the working tree was built so the capture process did not modify workspace paths outside `submission/media`.

| Rendered source | SHA-256 at capture |
| --- | --- |
| `app/components/witnesspatch-lab.tsx` | `19cd7c28847e3c04367746a34bbd26b11aa025be818fdec8baf5e529f802bd2d` |
| `app/globals.css` | `b62461487154264442c672cf090b89bc6440e95182c2f3c9b04c76e95b30240e` |
| `public/favicon.svg` | `0f78d301d822f76f60f9f591365dc45ab4025cd87af5fc46a9916e49267a6b08` |

Recapture or revalidate these assets if any fingerprint above changes or when the final source commit is frozen.

## Capture method

1. Copied the current working tree to an isolated temporary directory, ran `npm run build` there, and served its `dist/client` only on localhost.
2. Opened the local export in a fresh Playwright Chromium session without loading account state, cookies, credentials, or external browser tabs.
3. Captured the initial product viewport at `1200 x 800` CSS pixels.
4. For the compiler and receipt close-ups, used a `1576 x 900` viewport so the unchanged `#method` element rendered at exactly 1200 pixels wide. Captured that element after the named UI state completed, then centered it without scaling or cropping on a `1200 x 800` canvas using the app's `#F4F3EE` paper background.
5. No text, values, colors, UI controls, or product states were added, removed, retouched, or regenerated. The only post-capture operation on images 02 and 03 was symmetric background padding.

## Assets

| File | Caption | Capture state | Dimensions | Bytes | SHA-256 |
| --- | --- | --- | ---: | ---: | --- |
| `01-thumbnail-failure.png` | The contract breach happened before the blood pressure arrived. | Fresh page load before any action: fully synthetic baseline at `50/100`, two critical breaches, earliest critical prefix `T+02`, locked verifier, and **Compile failure** available. | 1200 x 800 | 241580 | `1c9ecdc25ab618a389334b7481396239f61f6975491abb578ac1137cbbaafe43` |
| `02-compiled-red-regression.png` | One synthetic failure becomes an exportable nine-file RED regression. | After **Compile failure** completed, with **Executable test** selected: `2/2` exact fully synthetic inputs, nine generated files, `BASELINE RED`, `INV-02` at `T+02`, `9 -> 3` facts, and the ZIP export control visible. | 1200 x 800 | 94397 | `9fec98240c23d25780d2c66953ddd302191701872ba9d28434f8f29b721d0f21` |
| `03-verified-receipt.png` | Locked verification, not the model, owns the pass. | After **Verify retained repair** completed, with **Audit receipt** selected: retained reference `100/100`, `23/23` hashes, `2/2` regrades, `4/4` holdouts, quarantined candidate not installed, no patient data, no API key, and physician validation pending. | 1200 x 800 | 228563 | `b1085a12f51e9632af633e1382a300f1e560e6cfea18c44d60c793930726fb52` |

Each PNG is RGB, non-interlaced, exact `3:2`, and below Devpost's 5 MB per-image limit.

## Truthful scope

- Every case shown is fully synthetic; these images contain no patient data or account information.
- `50/100` and `100/100` are results from this bounded software contract fixture, not clinical-performance scores or evidence of patient outcomes.
- The compiler image shows a completed browser compilation from retained exact bytes. It does not claim a target rerun, model rerun, clinical minimality, or independent execution of the downloaded ZIP.
- The receipt's hashes establish integrity against the same app build, not publisher identity or a cryptographic signature.
- The recorded `gpt-5.6-sol` and `ultra` fields describe the requested configuration retained by the project; they are not independent served-model attestation.
- WitnessPatch is developer safety tooling, not clinical decision support. Public status: physician validation pending. Physician validation remains pending until a scoped review is completed.

## Verification

- All three final files were visually inspected at original resolution after export. No black/redaction artifacts, clipping outside the intentional scrollable code window, browser chrome, account details, credentials, local paths, or personally identifying information were present.
- The complete compile-and-verify capture flow produced zero browser console errors and zero browser console warnings.
- Each file is an RGB, non-interlaced `1200 x 800` PNG, exactly `3:2`, and below 5 MB. File sizes and SHA-256 values above were recomputed from the final files.
