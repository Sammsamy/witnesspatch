# Build Week submission form checklist

This file separates confirmed public requirements from authenticated fields and human facts that Codex cannot invent or submit. No Devpost project content has been saved or submitted. The separately authorized Codex-credit request was submitted July 13 and received a Google Forms success receipt; approval and delivery remain unconfirmed. An official Devpost manager clarified that the request email must match the Devpost registration, as ours did, while the receiving ChatGPT/Codex account may use a different email.

## Confirmed public fields and evidence

- [x] Project title frozen at 57/60 characters: `WitnessPatch: Time-Fenced Contracts for Healthcare Agents`.
- [x] Elevator pitch frozen at 178/200 characters in `docs/SUBMISSION_DRAFT.md`.
- [x] Category: `Developer Tools`.
- [x] English project description and 22/25 truthful “Built with” tags frozen in `docs/SUBMISSION_DRAFT.md`.
- [x] Four candidate direct 1200 x 800 PNG media assets were recaptured from the current source-hash-bound production build and recorded by exact byte size, SHA-256, and thirteen rendered/computed source fingerprints in `submission/media/MANIFEST.md`; no upload has occurred and final external-field freeze remains pending.
- [ ] Public YouTube URL for a working demo shorter than three minutes, with audio explaining the product, Codex, and GPT-5.6. A verified `173.080`-second local AI-narrated fallback exists and the FAQ permits AI narration, but it must be auditioned and publicly uploaded; founder voice remains preferable.
- [ ] Repository URL: either public with relevant licensing or private and shared with both `testing@devpost.com` and `build-week-event@openai.com`.
- [x] README includes local setup, sample inputs, supported and unverified platform boundaries, Codex collaboration, GPT-5.6 contribution, and retained human decisions.
- [ ] Add the final public no-rebuild URL and exact submitted release fingerprint to the README after deployment.
- [ ] In this primary Codex build task, open `/feedback`, choose to share the existing session, submit the feedback, and copy the returned Session ID. Do not substitute the technical task/thread UUID.
- [ ] Free working demo, functioning test build, or equivalent no-rebuild path available through at least August 9 at 5:00 PM PDT.

## Authenticated form audit

The joined challenge's authenticated submission manager was rechecked read-only on July 20. Draft `1079808` remains `Untitled`, shows `1/5` steps complete, lists only its creator, and has blank overview, story, tags, links, media/video, category, repository, judge-testing, developer-tool, and `/feedback` fields. No project content was saved or submitted during the audit.

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
- [ ] Choose the truthful final entrant type: submit solo unless the brother has actually contributed, registered, joined the draft, accepted the invitation, and agreed to the rules before July 21 at 5:00 PM PT.
- [ ] Confirm the creator is at least the age of majority, resides in an eligible jurisdiction, and has no excluded OpenAI/Devpost/judge/employer/affiliate conflict.
- [ ] If entering as a team, separately confirm the brother's age, eligible residence, conflicts, accepted membership, contributions, designated representative, and the representative's authority; otherwise mark every team-only item not applicable and make no team claim.
- [ ] Ownership of all original code, copy, media, and submitted assets is confirmed.
- [ ] Confirm the project was not developed or derived with prohibited OpenAI/Devpost financial or preferential support; resolve the Section 4 ordinary-paid-plan ambiguity with the organizer.

## Repository and release choice

- [ ] Authorize the final source route. The standing completion target is a public repository with an entrant-approved open-source license; the current `UNLICENSED` checkout cannot be published until ownership and license authorization are explicit. A private repository shared with both judging addresses remains the rules-compliant fallback but does not satisfy this task's stricter public-repository goal.
- [ ] If the public route is authorized, add the approved license, update `package.json`, rerun the distribution audit, and confirm GitHub detects the matching SPDX identifier. If the private fallback is chosen, retain `UNLICENSED` and share it with both judging addresses.
- [x] Inventory the 624 locked packages and the 15 packages/credited sources actually present in the static client; preserve the scoped MIT and BSD-3-Clause notices byte-for-byte in the deployed bundle.
- [x] Complete the current public-static-demo/private-source-repository distribution audit; repeat it before shipping a packaged CLI, server image, vendored dependencies, or public source under a new project license.
- [x] Replace unrecorded favicon/icon path data with project-authored geometric primitives and record the bundled visual-asset boundary in `docs/ASSET_PROVENANCE.md`.
- [ ] Authorize every original asset and contribution before release.
- [ ] Verify the final repository and its GitHub Actions checks from a logged-out or judge-equivalent account; for the private fallback, also verify both judging addresses have access.
- [ ] Verify the exact submitted commit and record its hash.
- [x] Add `submission/release/final-release-template.json`, which binds the current V2 manifest, reviewed static-client fingerprint, and four image hashes while failing visibly as `not_frozen` with every external field unset.
- [x] Add `npm run release:freeze`, which writes only to ignored `output/release/` and refuses to freeze unless the tree is clean, the full release verifier passes, the exact commit is the default-branch tip of a public licensed GitHub repository with a successful completed public `Verify` push run on that commit, the deployed V2 manifest byte-matches, the local founder video decodes below 180 seconds with audio, YouTube oEmbed is reachable, and the entrant explicitly confirms founder voice, public visibility, and a real Codex-returned `/feedback` ID.
- [ ] Record one release fingerprint joining the submitted commit, V2 manifest SHA-256, deployed-build URL, repository URL, and video URL.
- [ ] Freeze the submitted version after July 21 at 5:00 PM PDT except for organizer-authorized narrow corrections.

## No-cost boundary

- [x] The judge-facing build requires no API key, payment, login, or request-time model call.
- [ ] Obtain organizer confirmation that meaningful development-time GPT-5.6/Codex use plus deterministic retained-artifact replay satisfies Stage One without a runtime OpenAI API or SDK call.
- [x] The current creator supplied the credit form's name, country, and Devpost-account email in the private task context; no personal data was copied into the repository.
- [x] Exact Devpost username confirmed read-only from the authenticated account menu; the value remains in private task context.
- [x] Submit the authenticated credit form with the exact three-sentence `Developer Tools` response only after the representative approved the response, explicitly accepted the OpenAI Services Agreement, and authorized the consequential Submit action; preserve the success receipt without committing personal data.
- [x] Request the optional $100 Codex credits before July 17 at 12:00 PM PT. Approval is first-come, first-served while supplies last and is not guaranteed.
- [x] The entrant later confirmed that the intended ChatGPT/Codex account uses a different email from the Devpost-account email submitted in the generic form field. Keep both addresses private. The organizer clarification says this is permitted and that the request-form email must match Devpost registration.
- [x] Keep the existing request unchanged and do not submit a duplicate: the matching Devpost email was correct, the FAQ limits requests to one code per entrant, and the resources page now says all available credits have been given out.
- [ ] Monitor the Devpost-email inbox for a redemption message and the intended account's `chatgpt.com` **Settings → Usage** for delivery or a balance. Before redemption, confirm the intended personal ChatGPT/Codex workspace is active. Granted credits must be used by July 21 at 5:00 PM PT under the controlling rules.
- [x] The optional request is Codex credits only; it does not provide API credits and will not become a judge-runtime dependency.
- [ ] Confirm Auto top-up remains disabled in the relevant OpenAI account; Codex cannot infer account settings.
- [ ] Do not purchase credits or add a paid runtime dependency.

## Healthcare and claim boundary

- [x] Public fixtures are synthetic and contain no real patient data.
- [x] Product is developer tooling, not patient-facing medical advice or automated medical decision-making.
- [x] Repair installation remains human review-gated.
- [x] Complete `docs/CLINICAL_CLAIM_AUDIT.md`: every remaining medical statement is either narrowly linked to current CDC, AIM, or ACOG guidance or explicitly excluded; no clinical efficacy, diagnosis, treatment, patient-outcome, regulatory, or generalization claim remains in judge-facing copy.
- [ ] Obtain a qualified, fully completed scoped licensed-physician fixture/wording review or keep `fixture_wording_review: pending` and the visible pending wording everywhere; `clinical_validation` remains `not_claimed` regardless of the review outcome.
- [ ] Obtain an external healthcare-AI builder clean run and record objections, assistance, and environment.

## Final release audit

- [x] `npm ci` and `npm run verify:release` passed from fresh local clones at checkpoint `a056fe3` on macOS with Node 22.15.0 and 24.14.0 (`94/94` core, `4/4` rendered); rule-audit checkpoint `950fea6` also passed from a fresh clone on Node 24.14.0 (`94/94` core, `5/5` rendered).
- [x] Exact source/media checkpoint `1086426` passes the full release verifier from fresh macOS and local Debian clones: macOS `151/151` aggregate tests; Debian `150/151` pass plus one expected filesystem skip; both `131` discovered core tests, `6/6` rendered checks, `1/1` real development-server HTTP smoke, `7/7` submission-package checks, `6/6` deployment-rendered checks, the distribution-license gate, a 59-asset deployment dry run, and byte-identical physical 55-file `dist/client` snapshots with canonical manifest SHA-256 `1133339d1b372491084a06f889acd97399f2de2988d6267eb13baa48dd4b3721`.
- [x] Exact candidate `87dee97` passes the full release verifier from fresh macOS and local Debian clones after judge-proof, detached-bundle, CI-summary, and threat-model hardening: macOS `158/158`; Debian `157/158` plus one expected filesystem skip; zero failures, zero dependency vulnerabilities, and the unchanged canonical 55-file static fingerprint.
- [x] Release-code checkpoint `15f1aee` passes `npm ci` and `npm run verify:release` from a fresh local clone on Node 24.14.0 (`104/104` core, `5/5` rendered, Wrangler dry run reporting 56 assets).
- [x] Release-code checkpoint `9f2cd8d` fixes the development-server first-request failure and passes the expanded verifier from a fresh local clone (`104/104` core, `5/5` rendered, `1/1` dev HTTP smoke, Wrangler dry run reporting 59 assets).
- [x] Submission-package checkpoint `b4c8217` passes `npm ci` and the full expanded release verifier from a fresh local clone (`104/104` core, `5/5` rendered, `1/1` dev HTTP smoke, `4/4` submission checks, Wrangler dry run reporting 59 assets, zero install vulnerabilities).
- [x] Current source-hash-bound local production-browser reference and included-sample desktop QA passes with zero console errors or warnings, no `/.rsc`/`404` same-page navigation, and no requests after the two expected sample fetches; exact 390 x 844 reference and local replays have no horizontal overflow. This does not replace logged-out testing of the eventual public URL.
- [x] Submission title, pitch, tags, four-image count, PNG geometry, byte limits, and refreshed media/source-manifest hashes pass the automated release gate.
- [ ] Repeat the clean-checkout release verifier on the exact final submitted commit.
- [ ] Remote GitHub Actions CI passes on the exact submitted commit and is visible through the final repository route.
- [ ] Static demo passes logged-out desktop and mobile checks with no console errors.
- [ ] Every displayed score and hash recomputes from the submitted artifacts.
- [ ] Video shows only behavior present in the submitted release.
- [ ] Public demo, video, and test links work without founder credentials; repository source and CI work through the authorized final route.
- [ ] Rules, FAQ, resources, schedule, and authenticated form are rechecked immediately before submission.
