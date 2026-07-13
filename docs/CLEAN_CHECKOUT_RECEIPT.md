# Clean-checkout verification receipt

This is a retained local reproducibility record, not independent third-party validation and not proof of Linux or Windows support.

## Current submission-package checkpoint

- Commit: `b4c8217fd93ac764d9d48bb72e8f105559fc3782`
- Source: local `git clone --no-local` into a new temporary directory, with no inherited `node_modules`, generated output, or ignored workspace files
- Host: macOS 26.5.2, Apple silicon
- Runtime: Node `v24.14.0`, npm `11.9.0`
- Commands: `npm ci` followed by `npm run verify:release`
- Result: exit code `0`
- Verified outcomes: both artifact profiles, `104/104` core tests, production build, `5/5` rendered tests, a `1/1` real development-server smoke proving the first page and retained manifest return HTTP 200, `4/4` submission-package checks binding screenshot hashes to the captured visual-source fingerprints, lint, typecheck, the 624-package/15-static-package license gate, byte-identical deployed notices, and a Wrangler static-deployment dry run with 59 files
- Install observation: npm installed 495 packages and reported zero vulnerabilities

The temporary clone was not used to edit the repository. This verifies the frozen local code, media, and submission-copy checkpoint. The exact submitted commit must still be replayed after the repository URL, deployment, video, and final form copy are frozen.

## Earlier cross-runtime checkpoint

- Commit: `a056fe337208c0f377918bb8502d2bc6324ba19a`
- Source: local `git clone --no-local` into a new temporary directory with no inherited `node_modules`, generated output, or ignored workspace files
- Host: macOS 26.5.2, Apple silicon
- Minimum runtime check: Node `v22.15.0`, npm `11.9.0`
- Additional current-runtime check: Node `v24.14.0`, npm `11.9.0`
- Commands: `npm ci` followed by `npm run verify:release`
- Result: exit code `0` in both clean checkouts
- Verified outcomes: both artifact profiles, `94/94` core tests, production build, `4/4` rendered tests, lint, typecheck, and Wrangler static-deployment dry run with 56 static files
- Nonfatal observation: the Node 22 Vinext builds emitted two `ExperimentalWarning` messages about Node's glob feature; the build and checks passed

Those checkouts were temporary and no repository files were edited.

## Boundaries

- This verifies the documented source-build path on macOS; it does not establish Linux or Windows compatibility.
- It does not yet satisfy the no-rebuild judge path. That requires a hosted demo, sandbox, test build, or equivalent externally accessible artifact.
- It does not verify public CI, remote repository access, judge sharing, or licensing.
- It does not replace an external healthcare-AI builder's independent run.
