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

The public rules and FAQ do not expose every authenticated label, character limit, image slot, or validation rule. The joined challenge form was not accessible in the audit browser without a Devpost login.

- [ ] Open the joined challenge's submission manager while logged in.
- [ ] Record every required field and character limit here before drafting into the form.
- [ ] Record image/screenshot dimensions and count, if required.
- [ ] Confirm whether teammate invitations occur before or during submission.
- [ ] Save a draft only after the team reviews the exact public content.
- [ ] Do not submit until the final requirement-by-requirement audit passes.

## Human eligibility and representation

- [ ] Both brothers are registered for the hackathon.
- [ ] Both registrations are complete before July 21 at 5:00 PM PT.
- [ ] Each brother is at least the age of majority where he resides.
- [ ] Each brother resides in an eligible supported country or territory.
- [ ] Neither brother has an excluded OpenAI/Devpost/judge/employer/affiliate conflict.
- [ ] The team has designated one eligible representative to submit and receive any team prize.
- [ ] The representative has authority from the other team member.
- [ ] Ownership of all original code, copy, media, and submitted assets is confirmed.
- [ ] Confirm the project was not developed or derived with prohibited OpenAI/Devpost financial or preferential support; resolve the Section 4 ordinary-paid-plan ambiguity with the organizer.

## Repository and release choice

- [ ] Choose one: public repository with a deliberate relevant license, or private repository shared with both judging addresses.
- [ ] If public, replace the current all-rights-reserved `LICENSE` only after ownership and third-party compatibility review.
- [ ] Inventory and authorize every third-party SDK, API, dataset, asset, pre-existing component, and contracted contribution; make every required disclosure.
- [ ] Complete a distribution-scoped open-source notice, attribution, source-obligation, and project-license review; the lockfile fingerprint alone is not compliance proof.
- [ ] Verify repository access from a logged-out or judge-equivalent session.
- [ ] Verify the exact submitted commit and record its hash.
- [ ] Record one release fingerprint joining the submitted commit, V2 manifest SHA-256, deployed-build URL, repository URL, and video URL.
- [ ] Freeze the submitted version after July 21 at 5:00 PM PDT except for organizer-authorized narrow corrections.

## No-cost boundary

- [x] The judge-facing build requires no API key, payment, login, or request-time model call.
- [x] The optional $100 Codex-credit request is not part of the plan.
- [ ] Confirm Auto top-up remains disabled in the relevant OpenAI account; Codex cannot infer account settings.
- [ ] Do not purchase credits or add a paid runtime dependency.

## Healthcare and claim boundary

- [x] Public fixtures are synthetic and contain no real patient data.
- [x] Product is developer tooling, not patient-facing medical advice or automated medical decision-making.
- [x] Repair installation remains human review-gated.
- [ ] Obtain scoped licensed-physician review or keep `licensed physician validation pending` everywhere.
- [ ] Obtain an external healthcare-AI builder clean run and record objections, assistance, and environment.

## Final release audit

- [x] `npm ci` and `npm run verify:release` passed from fresh local clones at checkpoint `a056fe3` on macOS with Node 22.15.0 and 24.14.0.
- [ ] Repeat the clean-checkout release verifier on the exact final submitted commit.
- [ ] Public CI passes on the exact submitted commit.
- [ ] Static demo passes logged-out desktop and mobile checks with no console errors.
- [ ] Every displayed score and hash recomputes from the submitted artifacts.
- [ ] Video shows only behavior present in the submitted release.
- [ ] All repository, demo, video, and test links work without founder credentials.
- [ ] Rules, FAQ, resources, schedule, and authenticated form are rechecked immediately before submission.
