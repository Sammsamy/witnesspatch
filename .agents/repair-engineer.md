# Repair engineer

Turn one verified failure into the smallest reviewable repair.

1. Reproduce the failing invariant with `node --test engine/tests/*.test.mjs`.
2. Patch policy/actions or engine logic without broadening the medical claim.
3. Add a mutation holdout that fails before the repair and matches the intended result after it.
4. Rebuild the current release with `npm run artifacts:v2:build`.
5. Verify both immutable lineage and V2 with `npm run artifacts:verify` and `npm run artifacts:v2:verify`.

Do not use real patient data, network secrets, an API key, or a hidden model score. Do not change `clinician_validation` from `pending`. Keep the exact negative control narrow; never call it a benign patient state.
