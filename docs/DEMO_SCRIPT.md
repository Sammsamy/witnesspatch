# 2:28 founder-voice judge demo

## Current status

The product flow is locally verified. On July 20, 2026, the silent founder screen master was recaptured from the public deployment with visible action callouts, then shortened only across idle holds. The reviewed local file is `output/playwright/witnesspatch-founder-screen-master-final.mp4`: `148.000` seconds, `1400 x 900`, one H.264 video stream, no audio stream, SHA-256 `7d5604126e1e88d8cba07b4e1878f874e35fb881cdbe33c02e59443cf82b4de8`. Full decode and frame review confirm a real reference compile, complete-test reveal, included-sample load and local nine-file compile, retained-repair verification, negative-control rejection, and the final `not_performed` / `not claimed` / `Not permitted` receipt. The assembler rejects any other screen-master bytes. Founder voice and the public YouTube video required by the [Official Rules](https://openai.devpost.com/rules) do not yet exist; keep the upload below three minutes.

The entrant is submitting individually; do not introduce a teammate or shared-build claim. The founder may truthfully say, “I’m a third-year medical student”; that explains motivation, not clinical authority.

## Cut-ready script

| Time | Exact narration | Screen action and proof |
|---|---|---|
| `0:00–0:10` | “I’m Fuzlullah Syed, a third-year medical student. AI agents can sound reasonable and still act too late.” | Start on the failed synthetic reference with `50`, two critical breaches, `T+02`, and locked rules visible; the recorded **Compile failure** callout appears in this segment. |
| `0:10–0:20` | “WitnessPatch freezes what the agent knew at T-plus-two and compiles the missed deadline into a portable red test.” | Hold the failed response, then follow the recorded **How it works** action to the generated artifact. |
| `0:20–0:34` | “This fully synthetic baseline scores fifty, with two critical breaches. Codex built and stress-tested the compiler during Build Week; GPT-5.6 Sol proposed separate repair data.” | Show the nine-file bundle map and the persistent Codex/GPT-5.6 requested-configuration card. Do not claim served-model identity. |
| `0:34–0:40` | “Locked code—not the model—scores it and builds a nine-file Node test bundle.” | The recorded **View complete test** action reveals the conventional `node:test` source. |
| `0:40–1:04` | “The test stays red at INV-02, T-plus-two. The manifest, original inputs, earliest failing prefix, receipt, and executable test travel together as a conventional Node package. A reviewer can inspect and run it offline, without an API key, model call, or target rerun.” | Return to the bundle map, then follow the recorded top and **Compile your files** actions into the isolated local-input workspace. |
| `1:04–1:22` | “This is not a canned demo. Compile Your Files loads a schema-valid synthetic case and failed run. The browser hashes and regrades them locally; here I load the included pair, confirm it is synthetic, and compile.” | Show the recorded **Load included sample**, synthetic-data checkbox, and **Compile red witness** actions. |
| `1:22–1:32` | “The result is the same nine-file red bundle, with two computed hashes and zero claims of external verification.” | Hold on **COMPILED RED**, `9 files`, and `2 hashes computed · 0 externally verified`. |
| `1:32–1:51` | “Back on the reference, the verifier checks twenty-three saved files and recomputes both runs. The retained repair reaches one hundred with zero critical failures, while the original regression remains red.” | Return to the reference, select **Verify retained repair**, and hold the explicit original-failure-red / retained-repair-pass hero. |
| `1:51–2:09` | “The repair must pass four holdouts. An exact-fact control still passes; an always-escalate mutant fails. Sol’s proposal stays quarantined, and the browser only interprets constrained data.” | Show the repair excerpt, `4/4`, original red, retained pass, exact-fact pass, and always-escalate rejection. Then select **Audit receipt**. |
| `2:09–2:28` | “The receipt records every hash, regrade, holdout, and requested model setup; it does not claim which model was served. This is developer tooling for synthetic tests: no patient data, no clinical use, no physician review, and no clinical validation claim.” | End on `23/23`, `2/2`, `4/4`, quarantined/not installed, requested configuration, **None · fully synthetic**, **not_performed**, **not claimed**, and **Not permitted**. |

## Recording preflight

- Load the page and wait at least five seconds before recording so hydration is complete.
- Record around `1400` CSS pixels wide at 1440p or higher, with clear English founder narration.
- Use a window or selected-region recorder with the founder's microphone, or mux a separately recorded founder track onto a clean silent browser master. Playwright's page video has no microphone audio and is rehearsal evidence only.
- For the separate-track route, play `output/playwright/witnesspatch-founder-screen-master-final.mp4` from `0:00` while recording one uninterrupted voice-only track. Start speaking with the first frame, keep the table's cue boundaries, and stop between `2:22` and `2:27.5`; later audio is rejected instead of silently truncated. Then run `npm run video:founder -- --audio-file "FOUNDER_AUDIO_FILE"`. The command first enforces the exact reviewed screen-master SHA-256, then loudness-normalizes the voice, pads only the end if needed, produces the reviewed 2:28 H.264/AAC MP4, and writes byte-hash evidence. If the media tools are not on `PATH`, set `WITNESSPATCH_FFMPEG_BIN` and `WITNESSPATCH_FFPROBE_BIN` to their absolute paths for this assembly command only.
- Start from a fresh baseline. Do not precompile, splice in success, or begin on a generated artifact.
- Hide bookmarks, notifications, credentials, local paths, unrelated tabs, and private Codex traces.
- Use the **How it works** and **WitnessPatch** navigation buttons for controlled movement instead of free scrolling.
- Capture the real verification transitions and wait for their visible completion states.
- Abort and restart if reference compilation exceeds six seconds, included-sample loading exceeds three seconds, local compilation exceeds three seconds, or retained verification exceeds five seconds; never hide a stalled or failed state in the final cut.
- Keep the exported baseline explicitly **BASELINE RED** after repair verification; only the separate retained repair passes.
- Keep the uploaded cut below three minutes after YouTube processing, and add accurate captions.
- Upload `submission/video/witnesspatch-demo.en.srt`; the submission gate verifies every cue, millisecond boundary, readability limit, and word against this exact narration.
- Audition the complete assembled file with headphones before upload. The assembler verifies timing, streams, codecs, geometry, and hashes; only the founder can verify speaker identity, exact words, pronunciation, intelligibility, and screen/audio alignment.
- Use no unlicensed music, third-party logos, reviewer identity, or patient information.

## Claims that are prohibited

- Do not say “Sol fixed it” or “the AI repair passed.” The retained reference and quarantined Sol candidate are distinct.
- Do not say tamper-proof, signed, publisher-authenticated, or independently attested model identity.
- Do not claim clinical validity, medical correctness, safety certification, production readiness, HIPAA compliance, lives saved, or patient outcomes.
- Do not say the browser executes candidate JavaScript or applies the patch.
- Do not imply blood-pressure threshold inference beyond the two exact fixture-supplied endpoints.
- Do not say the baseline regression turns green. It remains **BASELINE RED** beside **RETAINED REPAIR PASS**.
- Do not call the displayed patch a complete diff; it is an abridged verified behavior-diff excerpt.
- Do not call the static witness target-in-loop, counterfactual, clinically minimal, or proof of generalization.
