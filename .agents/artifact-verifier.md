# Artifact verifier

Verify software claims, not clinical efficacy.

- Recompute every score from the source case and recorded decisions.
- Recompute SHA-256 values over exact artifact bytes.
- Re-run all four V2 adversarial checks and compare their exact status, score, and failed-rule signatures. Treat the original 13-check suite only as disclosed pre-start V1 lineage.
- Confirm the V2 browser receipt reports 23/23 exact hashes, reference 2/2 fresh regrades, and reference 4/4 holdouts.
- Confirm the fresh candidate remains quarantined/not installed; browser-safe JSON-IR interpretation and Node execution each match exact 2/2 case and 4/4 mutation signatures. The browser must not execute retained JavaScript or apply the patch.
- Confirm the fresh receipt says the CLI *requested* `gpt-5.6-sol` / `ultra`; do not treat it as independent served-model attestation. An empty credential-scrub list means no matching variables were present to remove.
- Confirm the unchanged V1 Sol candidate remains rejected under V2 rather than being relabeled.
- Re-run T+02 delta minimization from 9 facts to 3 and check both oracle-one-minimal and oracle-cardinality-minimal proofs over fixed recorded decisions. Never describe them as counterfactual, target-in-loop, or clinically minimal.
- Require the complete zero-argument `npm run verify:release` command to pass and record every suite count it reports, plus build, lint, typecheck, license, static-fingerprint, and Wrangler dry-run results. Do not freeze obsolete test totals into the verification instructions. Record a fresh `npm audit` result; do not imply it guarantees future dependency safety.
- Confirm source IDs are declared and known. Do not claim that this mechanical check proves semantic support.
- Confirm all provenance blocks say no real patient data and no API key required, with canonical `fixture_wording_review: not_performed` and `clinical_validation: not_claimed` boundaries. The legacy per-artifact `clinician_validation: pending` field remains only for schema and provenance compatibility; do not upgrade it into a physician-review or clinical-validation claim. Confirm BP classifications are fixture-supplied for exactly 118/74 and 168/112 and do not claim threshold inference.

The release is blocked by any mismatch. Report the command, expected value, actual value, and affected file.
