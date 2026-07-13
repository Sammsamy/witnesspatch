# Build Week submission form checklist

This file separates confirmed public requirements from authenticated fields and human facts that Codex cannot invent or submit. No external form has been saved or submitted.

## Confirmed public fields and evidence

- [ ] Project title: `WitnessPatch`.
- [ ] Track: `Developer Tools`.
- [ ] English project description frozen from `docs/SUBMISSION_DRAFT.md`.
- [ ] Public YouTube URL for a working demo shorter than three minutes, with audio explaining the product, Codex, and GPT-5.6.
- [ ] Repository URL: either public with relevant licensing or private and shared with both `testing@devpost.com` and `build-week-event@openai.com`.
- [ ] README includes setup, sample data, supported platforms, no-rebuild judge path, Codex collaboration, GPT-5.6 contribution, and human decisions.
- [ ] `/feedback` Session ID from this primary Codex build task.
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
- [ ] Confirm the favicon and inline icon paths are team-authored, and authorize every original asset and contribution before release.
- [ ] Verify repository access from a logged-out or judge-equivalent session.
- [ ] Verify the exact submitted commit and record its hash.
- [ ] Record one release fingerprint joining the submitted commit, V2 manifest SHA-256, deployed-build URL, repository URL, and video URL.
- [ ] Freeze the submitted version after July 21 at 5:00 PM PDT except for organizer-authorized narrow corrections.

## No-cost boundary

- [x] The judge-facing build requires no API key, payment, login, or request-time model call.
- [ ] Request the optional $100 Codex credits by July 17 at 12:00 PM PT after the representative confirms the required email, first and last name, country, Devpost username, registration/eligibility, and acceptance of the OpenAI Services Agreement.
- [x] The optional request is Codex credits only; it does not provide API credits and will not become a judge-runtime dependency.
- [ ] Confirm Auto top-up remains disabled in the relevant OpenAI account; Codex cannot infer account settings.
- [ ] Do not purchase credits or add a paid runtime dependency.

## Healthcare and claim boundary

- [x] Public fixtures are synthetic and contain no real patient data.
- [x] Product is developer tooling, not patient-facing medical advice or automated medical decision-making.
- [x] Repair installation remains human review-gated.
- [ ] Obtain scoped licensed-physician review or keep `licensed physician validation pending` everywhere.
- [ ] Obtain an external healthcare-AI builder clean run and record objections, assistance, and environment.

## Final release audit

- [x] `npm ci` and `npm run verify:release` passed from fresh local clones at checkpoint `a056fe3` on macOS with Node 22.15.0 and 24.14.0 (`94/94` core, `4/4` rendered); rule-audit checkpoint `950fea6` also passed from a fresh clone on Node 24.14.0 (`94/94` core, `5/5` rendered).
- [x] The current combined tree passes `104/104` core and `5/5` rendered tests, the 624-package/15-static-package license gate, and a 56-file deployment dry run; hydrated Chrome compile/export/verify/replay/recompile QA has zero console errors or warnings.
- [ ] Repeat the clean-checkout release verifier on the exact final submitted commit.
- [ ] Public CI passes on the exact submitted commit.
- [ ] Static demo passes logged-out desktop and mobile checks with no console errors.
- [ ] Every displayed score and hash recomputes from the submitted artifacts.
- [ ] Video shows only behavior present in the submitted release.
- [ ] All repository, demo, video, and test links work without founder credentials.
- [ ] Rules, FAQ, resources, schedule, and authenticated form are rechecked immediately before submission.
