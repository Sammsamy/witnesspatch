# Build Week submission form checklist

This file separates confirmed public requirements from authenticated fields and human facts that Codex cannot invent or submit. No Devpost project content has been saved or submitted. The separate Codex-credit request is saved only as an unsubmitted draft.

## Confirmed public fields and evidence

- [x] Project title frozen at 57/60 characters: `WitnessPatch: Time-Fenced Contracts for Healthcare Agents`.
- [x] Elevator pitch frozen at 185/200 characters in `docs/SUBMISSION_DRAFT.md`.
- [x] Category: `Developer Tools`.
- [x] English project description and 22/25 truthful “Built with” tags frozen in `docs/SUBMISSION_DRAFT.md`.
- [x] Four candidate direct 1200 x 800 PNG media assets were recaptured from the current source-hash-bound production build and recorded by exact byte size, SHA-256, and thirteen rendered/computed source fingerprints in `submission/media/MANIFEST.md`; no upload has occurred and final external-field freeze remains pending.
- [ ] Public YouTube URL for a working demo shorter than three minutes, with audio explaining the product, Codex, and GPT-5.6.
- [ ] Repository URL: either public with relevant licensing or private and shared with both `testing@devpost.com` and `build-week-event@openai.com`.
- [x] README includes local setup, sample inputs, supported and unverified platform boundaries, Codex collaboration, GPT-5.6 contribution, and retained human decisions.
- [ ] Add the final public no-rebuild URL and exact submitted release fingerprint to the README after deployment.
- [ ] In this primary Codex build task, open `/feedback`, choose to share the existing session, submit the feedback, and copy the returned Session ID. Do not substitute the technical task/thread UUID.
- [ ] Free working demo, functioning test build, or equivalent no-rebuild path available through at least August 9 at 5:00 PM PDT.

## Authenticated form audit

The joined challenge's authenticated submission manager was inspected read-only on July 13. It contains five steps and an automatically created blank draft; no project content was saved or submitted during the audit.

- [x] Open the joined challenge's submission manager while logged in and confirm an OpenAI Build Week draft exists.
- [x] Record the authenticated fields before drafting into the form:
  - Project overview: required project name (`60` characters) and elevator pitch (`200` characters), plus a thumbnail.
  - Public project details: required Markdown project story, up to `25` “Built with” tags, one or more try-it/code URLs, and a required video-demo URL.
  - Judge/organizer details: optional file upload up to `35 MB`; required submitter type, country of residence, category, repository URL, and `/feedback` Session ID; optional judge test URL/instructions; and developer-tool installation/platform/testing instructions.
  - Finalization: one checkbox affirming that every team member agrees to the Official Rules and Devpost Terms of Service, followed by the consequential **Submit project** action.
- [x] Record media constraints: thumbnail and gallery accept JPG, PNG, or GIF up to `5 MB` each with `3:2` recommended; gallery allows up to `15` images.
- [x] Confirm teammate flow: invite by email or private link before final submission; every teammate must join and accept. The live draft currently has only its creator, so the brother is not yet on the team.
- [ ] Save project content only after the team reviews the exact public and judge-only fields; the current blank draft does not count as approval.
- [ ] Do not submit until the final requirement-by-requirement audit passes.

## Human eligibility and representation

- [x] The current project creator is registered for OpenAI Build Week and has an authenticated draft.
- [x] The current creator reports United States residence; the United States is on the official supported-country list. Age-of-majority and conflict checks remain separate.
- [ ] The brother registers, joins the draft, and accepts the invitation before July 21 at 5:00 PM PT.
- [ ] Each brother is at least the age of majority where he resides.
- [ ] Each brother resides in an eligible supported country or territory.
- [ ] Neither brother has an excluded OpenAI/Devpost/judge/employer/affiliate conflict.
- [ ] The team has designated one eligible representative to submit and receive any team prize.
- [ ] The representative has authority from the other team member.
- [ ] Ownership of all original code, copy, media, and submitted assets is confirmed.
- [ ] Confirm the project was not developed or derived with prohibited OpenAI/Devpost financial or preferential support; resolve the Section 4 ordinary-paid-plan ambiguity with the organizer.

## Repository and release choice

- [x] Choose the release route: public static demo plus private all-rights-reserved source repository shared with both judging addresses.
- [x] Keep the source private for this submission; if that decision changes, replace the all-rights-reserved `LICENSE` only after ownership and third-party compatibility review.
- [x] Inventory the 624 locked packages and the 15 packages/credited sources actually present in the static client; preserve the scoped MIT and BSD-3-Clause notices byte-for-byte in the deployed bundle.
- [x] Complete the current public-static-demo/private-source-repository distribution audit; repeat it before shipping a packaged CLI, server image, vendored dependencies, or public source under a new project license.
- [x] Replace unrecorded favicon/icon path data with project-authored geometric primitives and record the bundled visual-asset boundary in `docs/ASSET_PROVENANCE.md`.
- [ ] Authorize every original asset and contribution before release.
- [ ] Verify the private repository and its GitHub Actions checks from a judge-equivalent account after sharing it with both judging addresses.
- [ ] Verify the exact submitted commit and record its hash.
- [ ] Record one release fingerprint joining the submitted commit, V2 manifest SHA-256, deployed-build URL, repository URL, and video URL.
- [ ] Freeze the submitted version after July 21 at 5:00 PM PDT except for organizer-authorized narrow corrections.

## No-cost boundary

- [x] The judge-facing build requires no API key, payment, login, or request-time model call.
- [ ] Obtain organizer confirmation that meaningful development-time GPT-5.6/Codex use plus deterministic retained-artifact replay satisfies Stage One without a runtime OpenAI API or SDK call.
- [x] The current creator supplied the credit form's name, country, and Devpost-account email in the private task context; no personal data was copied into the repository.
- [x] Exact Devpost username confirmed read-only from the authenticated account menu; the value remains in private task context.
- [x] Save the authenticated credit-form draft with the exact three-sentence `Developer tools` response in `docs/CODEX_CREDIT_REQUEST.md`; no submission was made.
- [ ] Request the optional $100 Codex credits by July 17 at 12:00 PM PT only after the representative approves the frozen response, explicitly accepts the OpenAI Services Agreement, and authorizes the consequential Submit action. The representative chose the privately supplied Devpost-account email for the form's generically labeled `Email` field.
- [x] The optional request is Codex credits only; it does not provide API credits and will not become a judge-runtime dependency.
- [ ] Confirm Auto top-up remains disabled in the relevant OpenAI account; Codex cannot infer account settings.
- [ ] Do not purchase credits or add a paid runtime dependency.

## Healthcare and claim boundary

- [x] Public fixtures are synthetic and contain no real patient data.
- [x] Product is developer tooling, not patient-facing medical advice or automated medical decision-making.
- [x] Repair installation remains human review-gated.
- [ ] Obtain a qualified, fully completed scoped licensed-physician fixture review or keep `licensed physician fixture review pending` everywhere.
- [ ] Obtain an external healthcare-AI builder clean run and record objections, assistance, and environment.

## Final release audit

- [x] `npm ci` and `npm run verify:release` passed from fresh local clones at checkpoint `a056fe3` on macOS with Node 22.15.0 and 24.14.0 (`94/94` core, `4/4` rendered); rule-audit checkpoint `950fea6` also passed from a fresh clone on Node 24.14.0 (`94/94` core, `5/5` rendered).
- [x] Claim-hardened checkpoint `04ffd9f` passes the full release verifier from clean macOS and local Debian clones: macOS `125/125` core tests; Debian `124` pass plus one expected filesystem skip; both `5/5` rendered tests, `1/1` real development-server HTTP smoke, `5/5` submission-package checks, the distribution-license gate, a 59-asset deployment dry run, and byte-identical physical 55-file `dist/client` snapshots after canonical path-prefix normalization.
- [x] Release-code checkpoint `15f1aee` passes `npm ci` and `npm run verify:release` from a fresh local clone on Node 24.14.0 (`104/104` core, `5/5` rendered, Wrangler dry run reporting 56 assets).
- [x] Release-code checkpoint `9f2cd8d` fixes the development-server first-request failure and passes the expanded verifier from a fresh local clone (`104/104` core, `5/5` rendered, `1/1` dev HTTP smoke, Wrangler dry run reporting 59 assets).
- [x] Submission-package checkpoint `b4c8217` passes `npm ci` and the full expanded release verifier from a fresh local clone (`104/104` core, `5/5` rendered, `1/1` dev HTTP smoke, `4/4` submission checks, Wrangler dry run reporting 59 assets, zero install vulnerabilities).
- [x] Current source-hash-bound local production-browser reference and included-sample desktop QA passes with zero console errors or warnings, no `/.rsc`/`404` same-page navigation, and no requests after the two expected sample fetches; exact 390 x 844 reference and local replays have no horizontal overflow. This does not replace logged-out testing of the eventual public URL.
- [x] Submission title, pitch, tags, four-image count, PNG geometry, byte limits, and refreshed media/source-manifest hashes pass the automated release gate.
- [ ] Repeat the clean-checkout release verifier on the exact final submitted commit.
- [ ] Remote GitHub Actions CI passes on the exact submitted commit and is visible inside the judge-shared private repository.
- [ ] Static demo passes logged-out desktop and mobile checks with no console errors.
- [ ] Every displayed score and hash recomputes from the submitted artifacts.
- [ ] Video shows only behavior present in the submitted release.
- [ ] Public demo, video, and test links work without founder credentials; the private repository and CI work from a judge-equivalent account.
- [ ] Rules, FAQ, resources, schedule, and authenticated form are rechecked immediately before submission.
