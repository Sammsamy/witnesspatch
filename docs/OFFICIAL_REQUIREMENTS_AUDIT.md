# OpenAI Build Week requirements audit

Checked July 13, 2026 against the live [Devpost overview](https://openai.devpost.com/), [resources page](https://openai.devpost.com/resources), and controlling [Official Rules](https://openai.devpost.com/rules). The rules were published after the initial launch-time check.

## Confirmed requirements

| Requirement | Current state | Action |
|---|---|---|
| Submission period: July 13 at 9:00 AM PDT through July 21 at 5:00 PM PDT | Confirmed | Treat everything before 11:00 AM CDT as the disclosed pre-existing baseline. Finish with a submission buffer. |
| Build a working project with Codex and GPT-5.6 | Evidence exists locally | Preserve the post-start receipt, prompt/input hashes, quarantined candidate, deterministic replay, and this task transcript. Describe `gpt-5.6-sol` / `ultra` as the requested configuration recorded by the receipt, not independent served-model attestation. |
| Choose one track | Developer Tools is the direct fit | Submit as Developer Tools: testing and agentic workflow infrastructure. |
| Project description | Draft exists | Rewrite after the final evidence chain is frozen. |
| Public YouTube demo shorter than three minutes | Missing | Record founder voice; visibly show the product working; explain how both Codex and GPT-5.6 were used. Use no unlicensed music or third-party marks. |
| Code repository for judging and testing | Missing public/shared repo | Either publish with relevant licensing or keep private and share with `testing@devpost.com` and `build-week-event@openai.com`. |
| README with setup, sample data if needed, and run guidance | Present locally | Recheck from a clean clone. |
| Explain where Codex accelerated work, key decisions, and how GPT-5.6 and Codex were used | Partial | Preserve provenance and add a concise decision ledger. |
| `/feedback` Codex Session ID for the task containing most core work | Must be captured | In this same task, open `/feedback` and preserve the identifier shown by the app. Do not assume a repo hash or manually copied UUID is equivalent until the UI confirms it. |
| Developer tools need installation instructions, supported platforms, and a no-rebuild judge test path | Partial | Node 22.15+ and macOS are exercised locally. Do not claim Linux or Windows verification without evidence; either add platform CI before submission or list the exact verified/untested boundary. Provide both a live static demo and deterministic local verifier. |
| Free working access during judging | Not yet public | Keep the demo and repository available without charge or restriction through at least August 9 at 5:00 PM PDT. |

The official Codex [slash-command reference](https://learn.chatgpt.com/docs/reference/slash-commands#available-slash-commands) confirms that `/feedback` opens the feedback dialog and `/status` displays the task ID. Devpost specifically requests the `/feedback` session ID, so the submission should use the identifier exposed by that flow rather than inferring one from local files.

## Existing-project rule

Pre-existing projects are allowed only if they are meaningfully extended with Codex and/or GPT-5.6 after July 13 at 9:00 AM PDT. Only the post-start work is evaluated. The submission must distinguish prior and new work with timestamped Codex session logs, dated commit history, or equivalent evidence.

WitnessPatch existed locally before the cutoff. The retained V1 artifact chain and original static demo are therefore the disclosed pre-existing baseline, not claimed Build Week additions. The portable compiler, browser-safe grading/holdout kernels, exact-byte browser verifier, adversarial verifier tests, fail-closed interactive replay, clinical V2 scope, and all later work were created after the cutoff. See `docs/BUILD_WEEK_PROVENANCE.md`.

## Credits and runtime API boundary

- Registered entrants may request $100 in Codex credits by July 17 at noon PDT, while supplies last and subject to approval.
- No purchase or payment is required, and the optional Devpost plugin is not required.
- WitnessPatch does not need credits for judging: the static demo, browser verifier, CLI evaluator, compiler, and generated regressions use no API key.
- Stage One uses boilerplate about applying required APIs/SDKs, although the substantive project requirement names Codex and GPT-5.6 and does not require a runtime API call. A fully local Codex/GPT-5.6 project appears permitted, but organizer confirmation would remove this ambiguity.

## Eligibility and ownership

- A two-brother team is permitted if both people satisfy the age, residency, supported-country, and conflict exclusions. The rules state no maximum team size.
- The team must designate one eligible representative to act and submit on its behalf.
- The submission must be the team's original, solely owned work and must comply with all third-party and open-source licenses.
- A public repository needs relevant licensing. A private repository may instead be shared with both judging addresses above; the rules do not mandate a particular license.
- OpenAI/Devpost employees, agents, judges, certain affiliates and immediate-family/household members, and entrants with real or apparent conflicts are excluded as specified in the rules.

## Judging

- Stage One is pass/fail for theme/tool viability.
- Stage Two weights Technological Implementation, Design, Potential Impact, and Quality of the Idea equally.
- Technical Implementation is the first tie-break criterion, followed by the other listed criteria in order.
- Judges may choose not to test and may judge only from the description, images, and video. The proof must therefore be visible in the first minute.
- The rules say judging ends August 5, while other official schedule pages show later dates. Keep all access working through the latest published date.

## Organizer question

> Can you confirm that a fully local developer tool built with GPT-5.6 through Codex satisfies the required-tool criterion, without the submitted product itself calling an OpenAI API or SDK at runtime?
