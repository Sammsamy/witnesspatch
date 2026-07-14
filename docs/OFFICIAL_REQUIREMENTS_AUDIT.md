# OpenAI Build Week requirements audit

Checked July 13, 2026 against the live [Devpost overview](https://openai.devpost.com/), [resources page](https://openai.devpost.com/resources), [FAQ](https://openai.devpost.com/details/faqs), [schedule](https://openai.devpost.com/details/dates), controlling [Official Rules](https://openai.devpost.com/rules), [OpenAI Build Week page](https://openai.com/build-week/), and [OpenAI Usage Policies](https://openai.com/policies/usage-policies/). The rules prevail over conflicting hackathon materials.

## Confirmed requirements

| Requirement | Current state | Action |
|---|---|---|
| Registration: July 9 at 10:00 AM through July 21 at 5:00 PM PT | Human confirmation required | Ensure both intended teammates join/register before the registration deadline. |
| Submission period: July 13 at 9:00 AM PDT through July 21 at 5:00 PM PDT | Confirmed | Treat everything before 11:00 AM CDT as the disclosed pre-existing baseline. Finish with a submission buffer. |
| Build a working project with Codex and GPT-5.6 | Evidence exists locally | Preserve the post-start receipt, prompt/input hashes, quarantined candidate, deterministic replay, and this task transcript. Describe `gpt-5.6-sol` / `ultra` as the requested configuration recorded by the receipt, not independent served-model attestation. |
| Meaningfully use both Codex and GPT-5.6 | Evidence exists locally | The FAQ says neither tool may be incidental or decorative. Show the primary Codex build thread and explain the retained GPT-5.6 candidate workflow in the README, description, and demo. Do not rely on the FAQ's later `and/or` paraphrase; the controlling project requirement says Codex **and** GPT-5.6. |
| Choose exactly one track | Developer Tools is the direct fit | Submit as Developer Tools: testing and agentic workflow infrastructure. The FAQ says each project enters one track. |
| Project description | Draft exists | Rewrite after the final evidence chain is frozen. |
| Public YouTube demo shorter than three minutes | Missing | Record at no more than `2:59`; visibly show the product working; explain how both Codex and GPT-5.6 were used. Use no unlicensed music or third-party marks. The FAQ's “three minutes or under” wording cannot relax the rules' “less than three minutes” requirement. |
| Code repository for judging and testing | Selected private route not yet created/shared | Create the all-rights-reserved private repository, share it with `testing@devpost.com` and `build-week-event@openai.com`, and verify source plus CI visibility from a judge-equivalent account. |
| README with setup, sample data if needed, and run guidance | Claim-hardened checkpoint `04ffd9f` passed the full verifier from clean macOS and local Debian clones, including HTTP smoke, `5/5` submission checks, and byte-identical static snapshots after canonical path-prefix normalization | Preserve `docs/CLEAN_CHECKOUT_RECEIPT.md` and rerun the exact submitted commit after final freeze. This does not replace the required external no-rebuild judge path. |
| Explain where Codex accelerated work, key decisions, and how GPT-5.6 and Codex were used | Present locally | Preserve the README decision ledger, provenance records, and exact retained candidate links in the final repository and demo. |
| `/feedback` Codex Session ID for the task containing most core work | Must be captured | In this same task, open `/feedback`, choose to share the existing session, submit the feedback, and preserve the returned Session ID. Do not substitute a repository hash or technical task/thread UUID. |
| Developer tools need installation instructions, supported platforms, and a no-rebuild judge test path | Partial | Node 22.15+ and macOS are exercised locally; clean source install and release verification also pass in one exact local Debian 12 arm64/Node 22.23.1 environment. Do not broaden that to Linux browser support, remote CI, or Windows. Provide both a live static demo and deterministic local verifier. |
| Free working access during judging | Not yet available externally | A hosted deployment is not expressly mandatory if a functioning demo or test build provides no-rebuild access, but the static hosted replay is the clearest path. Keep the demo and repository available without charge or restriction through at least August 9 at 5:00 PM PDT. |
| English submission materials | Present locally | Keep the description, README, testing instructions, captions, and narration in English. |
| Authenticated submission fields | Inspected read-only July 13; blank draft exists and one creator is currently listed | Follow `docs/SUBMISSION_FORM_CHECKLIST.md`: complete the required project story, tags, category, country, repository URL, public video, `/feedback` ID, teammate acceptance, and final rules checkbox only after every linked artifact and human gate is verified. Do not submit the draft early. |

The official Codex [command reference](https://learn.chatgpt.com/docs/reference/commands) confirms that `/feedback` opens the feedback dialog. The official [feedback and logs guidance](https://learn.chatgpt.com/docs/reference/troubleshooting#feedback-and-logs) says an existing session may be shared and a session ID is returned after feedback is submitted. Devpost specifically requests that `/feedback` Session ID, so do not infer it from local files or use the technical task/thread UUID as a substitute.

## Existing-project rule

Pre-existing projects are allowed only if they are meaningfully extended with Codex and/or GPT-5.6 after July 13 at 9:00 AM PDT. Only the post-start work is evaluated. The submission must distinguish prior and new work with timestamped Codex session logs, dated commit history, or equivalent evidence.

WitnessPatch existed locally before the cutoff. The retained V1 artifact chain and original static demo are therefore the disclosed pre-existing baseline, not claimed Build Week additions. The portable compiler, browser-safe grading/holdout kernels, exact-byte browser verifier, adversarial verifier tests, fail-closed interactive replay, clinical V2 scope, and all later work were created after the cutoff. See `docs/BUILD_WEEK_PROVENANCE.md`.

## Credits and runtime API boundary

- Registered and eligible entrants may optionally request $100 in Codex credits by July 17 at noon PDT. The live form says requests are first-come, first-served, not guaranteed, limited to one code per entrant, and requires an email address, first and last name, country, Devpost username, and a two-to-three-sentence project description naming a current category.
- Event credits are strictly for the submission, have no cash value, and expire July 31. The FAQ says the event supplies Codex credits only—not separate API credits or tokens. OpenAI's general [Service Credit Terms](https://openai.com/policies/service-credit-terms/) also prohibit transferring, selling, or exchanging service credits.
- No purchase or payment is required, and the optional Devpost plugin is not required. The form labels its field only as `Email`; the FAQ says the credit balance appears in the `chatgpt.com` account used to request it. Therefore confirm the address for the intended ChatGPT/Codex account, plus eligibility, Services Agreement acknowledgment, and authorization, before submitting; do not enable Auto top-up. The build and judge path remain independent of receiving credits and work without incremental spend.
- WitnessPatch does not need credits for judging: the static demo, browser verifier, CLI evaluator, compiler, and generated regressions use no API key.
- No official page expressly requires a live or judge-time API call. The FAQ permits API use but does not state that it is required, and recognizes Codex work through the ChatGPT app, CLI, IDE extension, or SDK. It also requires meaningful GPT-5.6 use and asks the video to explain how GPT-5.6 is integrated. WitnessPatch preserves that development-time integration as a retained, quarantined proposal plus deterministic replay, but Stage One's generic required-API/SDK wording leaves enough ambiguity that organizer confirmation remains necessary before treating the no-runtime-call interpretation as settled.

## Eligibility and ownership

- A two-brother team is permitted if both people independently satisfy the age, residency, supported-country, and conflict exclusions. Cross-country teams are allowed when every member is eligible. No numeric maximum team size is specified; the two-pass DevDay prize limit is not a team-size rule.
- The team must designate one eligible representative to act and submit on its behalf.
- The submission must be the team's original, solely owned work and must comply with all third-party and open-source licenses.
- The project must not have been developed or derived with financial or preferential support from OpenAI or Devpost, including project funding, investment, contract work, or a commercial license of the kind described in Section 4. Because the team uses an ordinary existing paid ChatGPT/Codex plan, confirm with the organizer that ordinary generally available plan access is not the prohibited project support contemplated by this clause.
- Every third-party SDK, API, dataset, asset, and pre-existing component must be authorized, disclosed where required, and compatible with the final distribution and project-license posture.
- The July 13 official update expressly says a public repository needs a relevant open-source license. A private repository may instead be shared with both judging addresses above; the rules do not mandate a particular license for that route.
- OpenAI/Devpost employees, agents, judges, certain affiliates and immediate-family/household members, and entrants with real or apparent conflicts are excluded as specified in the rules.

## Healthcare and authorized-testing boundary

Build Week has no healthcare-specific prohibition, and the overview even lists health under Apps for Your Life. OpenAI's Usage Policies still apply to event tool use. They prohibit tailored medical advice without appropriate licensed-professional involvement and automated high-stakes medical decisions without human review. They also prohibit unsolicited safety testing and misuse of private or sensitive information.

WitnessPatch remains aligned only while it:

- operates on intentionally synthetic fixtures, never protected health information;
- evaluates developer-authored workflow contracts rather than giving patient-specific advice;
- keeps every proposed repair review-gated and never automates a real medical decision;
- tests only the team's own reference target or systems whose owners authorized testing; and
- preserves canonical machine-readable `fixture_wording_review: pending` and `clinical_validation: not_claimed` boundaries, while the legacy per-artifact `clinician_validation: pending` field remains for schema and provenance compatibility and is not treated as either canonical state; the UI displays the fixture/wording review as pending and clinical validation as not claimed.

## Intellectual property and publicity

- The team retains submission IP; submission gives OpenAI a non-exclusive license to use the entry for judging.
- The rules allow OpenAI and Devpost to promote the submission and use contributors' names, likenesses, voices, and images in hackathon publicity for three years. Some submission components may be public.
- Original ownership, third-party authorization, and open-source license compliance are entrant warranties. Technical assistance is permitted only when the submitted components remain the entrants' owned work and expression of their ideas.
- The current all-rights-reserved license is consistent with the private judge-shared path. The July 13 official update says a public repository requires a relevant open-source license, so choosing that route requires a deliberate license decision plus the existing third-party notices; the rules do not prescribe a specific license.
- `npm run licenses:check` now gates the 624-entry locked dependency graph against a reviewed SPDX-expression inventory. The selected public-static-demo/private-all-rights-reserved-source route is audited at its current scope; any route, packaging, dependency, or project-license change requires a new distribution-scoped audit.

## Judging

- Stage One is pass/fail for theme/tool viability.
- Stage Two weights Technological Implementation, Design, Potential Impact, and Quality of the Idea equally at 25% each. The controlling Quality-of-the-Idea wording asks whether the concept is creative, novel, and different from existing concepts, so the submission must distinguish the closest prior art rather than rely on a broad category claim.
- Tie-break order is Technological Implementation, Design, Potential Impact, then Quality of the Idea, followed by a panel vote if still tied.
- Judges may choose not to test and may judge only from the description, images, and video. The proof must therefore be visible in the first minute.
- Three official surfaces conflict: the rules define judging as July 22 at 10:00 AM through August 5 at 5:00 PM PDT; OpenAI's Build Week page says July 22 through August 7; and the Devpost schedule says July 22 at 9:00 AM through August 9 at 5:00 PM PDT. The July 13 update also mislabels July 21, 2026 as Monday; July 21, 2026 is Tuesday, and all sources agree on the July 21 at 5:00 PM PT submission cutoff. The rules control, but keep all access working through August 9 as the conservative operational boundary.
- The published Developer Tools prizes are $15,000 for first and $10,000 for second. First also includes up to two DevDay/Exchange passes, OpenAI Developers promotion, a Codex team meeting, and one year of Pro. None of these benefits is an employment offer or hiring guarantee.

## Organizer clarification draft — do not send without the team

The official [Resources page](https://openai.devpost.com/resources) links the [OpenAI Discord](https://discord.gg/openai) and direct [`#build-week-chat`](https://discord.com/channels/974519864045756446/1415384556521132134), and names `#hackathon-announcements` and `#office-hours` as official support routes. Send only after the team confirms the wording and destination (`support@devpost.com` or an official event channel):

> Can you confirm that a fully local Developer Tools project meaningfully built with both Codex and GPT-5.6 satisfies the required-tool and Stage One criteria when the judge-facing product deterministically replays retained GPT-5.6 artifacts and does not call an OpenAI API or SDK at runtime? Does ordinary, generally available access through an entrant's pre-existing paid ChatGPT/Codex plan count as prohibited “financial or preferential support” or a “commercial license” under Section 4? Also, which judging end time governs free-access availability: August 5 at 5:00 PM PT in the Official Rules, August 7 on OpenAI's Build Week page, or August 9 at 5:00 PM PT on the Devpost schedule?
