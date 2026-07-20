# WitnessPatch threat model

Status: **bounded security argument for the submitted V2 software proof.** This document does not claim formal verification, publisher authenticity, clinical correctness, or protection against a compromised source repository, CI identity, host, or operating system.

## Security objective

WitnessPatch should turn one declared synthetic failing trace into an exact, portable red regression without silently accepting altered files, stale evaluations, unsafe filesystem objects, unbounded parser work, or a bundle that no longer reproduces the fixed compiler's output.

The protected claim is narrow:

> For the exact bundle bytes supplied to `witnesspatch verify`, the nine-file set is structurally valid, internally linked, freshly regraded, hash-consistent, and byte-for-byte reproducible by this version of the deterministic compiler.

That is an integrity and reproducibility claim. It is not proof of who published the bundle, whether its authored rule is clinically correct, or what an agent would do after its inputs change.

## Trust boundaries

| Boundary | Treated as | Consequence |
| --- | --- | --- |
| Selected case/run files | Untrusted bytes with required synthetic-data declarations | Validate UTF-8, JSON, schemas, semantic links, work limits, case identity, and a fresh grade before compiling. The declaration is not a PHI detector. |
| Detached nine-file bundle | Untrusted directory contents | Require the exact file set, regular files opened without following symlinks, bounded sizes, stable file/directory identity during reads, valid schemas, exact hashes, semantic links, a fresh grade, and compiler-exact reconstructed bytes. |
| Same-build browser manifest | Integrity anchor shipped with the application | It can expose drift inside that build; it is not a signature, external timestamp, or publisher-identity proof. |
| Generated red regression | Executable test owned by the bundle | Execute only in a local/CI environment chosen by the reviewer. The browser displays the test but does not execute retained JavaScript. |
| Retained reference repair | Separately inspectable candidate | It must pass the unchanged regression and scoped controls; it is never substituted for the still-red baseline. |
| GPT-5.6/Codex proposal | Untrusted development artifact | Fixed code compiles constrained JSON, deterministic tests grade it, and automatic installation remains disabled. Requested model metadata is not served-model attestation. |
| Repository, GitHub Actions, deployment, OS | Trusted distribution/execution environment for a given review | Compromise here is outside the bundle verifier's guarantee. The final release must bind the exact commit, CI, static fingerprint, deployment URL, and video URL out of band. |

## Attacks checked by deterministic tests

| Attack | Failing behavior | Reproduce evidence |
| --- | --- | --- |
| Missing, extra, duplicate, reordered, or renamed bundle records | Verification exits nonzero | `npm run test:core` detached-bundle exact-set tests |
| Byte change with a stale manifest | SHA-256 or byte-count mismatch | One-byte mutation across every bundle file |
| Coordinated rehash of semantically inconsistent JSON | Schema, identity, link, fresh-grade, or compiler-reconstruction failure | Semantic and executable tampering tests |
| Rewritten generated test plus matching manifest | Compiler-exact byte reconstruction fails | Executable-tampering test |
| Symlinked bundle/file, non-regular entry, or directory swap | No-follow/open identity checks fail | Unsafe-path and non-regular-file tests |
| File changes during verification | Device, inode, mode, size, modification-time, or change-time comparison fails | Pre/read/post identity checks in the CLI verifier |
| Oversized file, total bundle, JSON depth/node count, or reconstruction fact set | Bounded verifier rejects before expensive semantic work | Resource-boundary tests and constants in `bin/witnesspatch.mjs` |
| Stored passing evaluation that no longer matches the run | Fresh deterministic regrade disagrees | Evaluation-drift tests |
| Future fact used before its timestamp | Critical temporal-integrity control fails | V2 future-fact leakage tests |
| Urgent language hidden behind non-urgent action labels | Bidirectional message/action contract fails | Urgent-marker/action-label bypass test |
| Numeric classification claimed from the endpoint despite fixture-supplied scope | Contradiction marker fails | Numeric-inference contradiction test |
| Repair escalates every postpartum message | Exact-fact control rejects the always-escalate mutant at `25/100` | `npm run judge:proof` and V2 executable-policy tests |

## Explicit non-goals

WitnessPatch does not establish:

- publisher identity, signature validity, an independent timestamp, or an uncompromised GitHub/Cloudflare account;
- semantic completeness of the authored rules, medical correctness, clinical validity, or patient safety;
- absence of undisclosed patient data or successful de-identification;
- target-in-loop, causal, or counterfactual behavior after facts are removed;
- generalization beyond the authored fixtures and mutations;
- that the requested GPT-5.6 model/effort was the model actually served;
- safety of executing arbitrary third-party JavaScript outside the supplied deterministic review environment.

## Judge path

```bash
npm ci
npm run judge:proof
npm run verify:release
```

The first command installs the locked dependency graph. The second produces the concise compile/red/green/mutation closure. The third reruns the artifact verifiers, 136 core tests, production build, rendered checks, development-server smoke, submission checks, lint, typecheck, license audit, static fingerprint, and deployment dry run. In GitHub Actions, the six-line proof is also written to the run summary and retained as `output/release/judge-proof.log` beside the full release evidence.
