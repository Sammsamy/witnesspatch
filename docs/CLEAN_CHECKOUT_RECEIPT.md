# Clean-checkout verification receipt

This is a retained local reproducibility record, not independent third-party validation. It verifies the exact local macOS and Debian environments named below; it is not proof of remote CI, a broad Linux compatibility matrix, or Windows support.

## Prior claim-hardened clean-clone checkpoint supporting the current candidate

- Commit: `04ffd9feaac99b7e3c064cb19ba9159cfaec2fca`
- Source: local `git clone --no-local` into new temporary directories, with no inherited `node_modules`, generated output, or ignored workspace files
- Commands in each clone: `npm ci` followed by `npm run verify:release`
- macOS host: macOS 26.5.2 arm64; Node `v24.14.0`; npm `11.9.0`
- macOS result: exit code `0`; 495 packages installed, 496 audited, zero vulnerabilities; `125/125` core tests passed
- Linux host: local Docker container running Debian GNU/Linux 12 (bookworm) arm64; Node `v22.23.1`; npm `10.9.8`
- Linux result: exit code `0`; 502 packages installed, 503 audited, zero vulnerabilities; 125 core tests discovered, 124 passed, and the one case-insensitive-output-alias test was expectedly skipped on the case-sensitive filesystem
- Shared verified outcomes: both artifact profiles, production build, `5/5` rendered-product tests, a `1/1` real development-server HTTP smoke, `5/5` submission-package checks, lint, typecheck, the distribution-license gate, byte-identical bundled third-party notices, and a Wrangler static-deployment dry run with 59 assets
- Two-environment static snapshot: each `dist/client` directory contained 55 physical files. The raw `find` output used `./` path prefixes on macOS but not Debian; after normalizing only that textual prefix, every path and file SHA-256 row matched. The SHA-256 of each identical canonical 55-line manifest was `31767c92a17ede21ef047d8b5774788e5ee3afefa96bf465739e322240dd9843`.

Neither temporary clone was used to edit the repository. This verifies the exact claim-hardened source-and-media checkpoint above. It does not include future repository, deployment, video, external-review, or submission-form metadata, so the exact submitted commit must still be replayed after those fields are frozen.

## Prior feature-freeze release-code checkpoint

- Commit: `214854a52e7e8f5d6265405881b80a1965b5c0f5`
- Source: local `git clone --no-local` into new temporary directories, with no inherited `node_modules`, generated output, or ignored workspace files
- Commands in each clone: `npm ci` followed by `npm run verify:release`
- macOS host: macOS 26.5.2 arm64; Node `v24.14.0`; npm `11.9.0`
- macOS result: exit code `0`; 495 packages installed, 496 audited, zero vulnerabilities; `125/125` core tests passed
- Linux host: local Docker container running Debian GNU/Linux 12 (bookworm) arm64; Node `v22.23.1`; npm `10.9.8`
- Linux result: exit code `0`; 502 packages installed, 503 audited, zero vulnerabilities; 125 core tests discovered, 124 passed, and the one case-insensitive-output-alias test was expectedly skipped on the case-sensitive filesystem
- Shared verified outcomes: both artifact profiles, production build, `5/5` rendered-product tests, a `1/1` real development-server HTTP smoke, `5/5` submission-package checks, lint, typecheck, the distribution-license gate, byte-identical bundled third-party notices, and a Wrangler static-deployment dry run with 59 assets
- Two-environment static snapshot: each `dist/client` directory contained 55 physical files; the exact 55-line file-checksum manifests matched, and their SHA-256 was `221d4ce0abf95accd6d8b73ec58fec3eaadec3ae0c52fc864984ff4382b26bd0`

Neither temporary clone was used to edit the repository. This verifies the documented release path for those two exact local environments before the later claim hardening and media recapture.

## Historical submission-package checkpoint

- Commit: `b4c8217fd93ac764d9d48bb72e8f105559fc3782`
- Source: local `git clone --no-local` into a new temporary directory, with no inherited `node_modules`, generated output, or ignored workspace files
- Host: macOS 26.5.2, Apple silicon
- Runtime: Node `v24.14.0`, npm `11.9.0`
- Commands: `npm ci` followed by `npm run verify:release`
- Result: exit code `0`
- Verified outcomes: both artifact profiles, `104/104` core tests, production build, `5/5` rendered tests, a `1/1` real development-server smoke proving the first page and retained manifest return HTTP 200, `4/4` submission-package checks binding screenshot hashes to the captured visual-source fingerprints, lint, typecheck, the 624-package/15-static-package license gate, byte-identical bundled third-party notices, and a Wrangler static-deployment dry run reporting 59 assets
- Install observation: npm installed 495 packages and reported zero vulnerabilities

The temporary clone was not used to edit the repository. This verifies that historical local code, media, and submission-copy checkpoint.

## Earlier cross-runtime checkpoint

- Commit: `a056fe337208c0f377918bb8502d2bc6324ba19a`
- Source: local `git clone --no-local` into a new temporary directory with no inherited `node_modules`, generated output, or ignored workspace files
- Host: macOS 26.5.2, Apple silicon
- Minimum runtime check: Node `v22.15.0`, npm `11.9.0`
- Additional current-runtime check: Node `v24.14.0`, npm `11.9.0`
- Commands: `npm ci` followed by `npm run verify:release`
- Result: exit code `0` in both clean checkouts
- Verified outcomes: both artifact profiles, `94/94` core tests, production build, `4/4` rendered tests, lint, typecheck, and a Wrangler static-deployment dry run reporting 56 assets
- Nonfatal observation: the Node 22 Vinext builds emitted two `ExperimentalWarning` messages about Node's glob feature; the build and checks passed

Those checkouts were temporary and no repository files were edited.

## Boundaries

- Current local verification covers only the exact macOS and Debian environments above; it does not establish other Linux distributions, architectures, browser behavior on Linux, or Windows compatibility.
- It does not yet satisfy the no-rebuild judge path. That requires a hosted demo, sandbox, test build, or equivalent externally accessible artifact.
- It does not verify remote GitHub Actions CI, private-repository access from a judge-equivalent account, or sharing with both judging addresses.
- It does not replace an external healthcare-AI builder's independent run.
