# 2:47 judge demo

## Current status

The earlier 148-second candidate is superseded. Do not upload it. The current silent screen master shows the plain-language interface and the complete saved-run comparison. Founder audio, final captions, and the release receipt are still required. Keep the final upload below three minutes.

The entrant is submitting individually; do not introduce a teammate or shared-build claim. The founder may truthfully say, “I’m a third-year medical student”; that explains motivation, not clinical authority.

## Draft narration and screen sequence

These cues match the reviewed silent screen master.

| Time | Exact narration | Screen action and proof |
|---|---|---|
| `0:00 to 0:17` | “Hi, I’m Fuzlullah Syed, a third-year medical student. An AI agent can reach the right answer too late. WitnessPatch turns that missed deadline into a test developers can run before every release.” | Begin on camera, then cut to the failed synthetic reference and its plain-language headline. |
| `0:17 to 0:37` | “This synthetic run shows the problem. At minute two, the user is eight days postpartum, has a headache that has not improved, and is seeing spots. The agent still waits for a blood pressure reading that arrives four minutes later.” | Show the timeline, the T+02 response, and the later T+06 fact. |
| `0:37 to 1:00` | “I select Turn failure into test. WitnessPatch finds the first required action the agent missed. It builds a Node test and bundles the case, failed response, and evidence with it. The original run fails that test, so CI can catch the same mistake.” | Select **Turn failure into test**, show the generated test package, then reveal the Node test. |
| `1:00 to 1:11` | “The test works offline. It does not need the original agent, an API key, or a model call.” | Hold on the generated test and export action. |
| `1:11 to 1:29` | “It does not call or switch live models. It compares up to six saved runs from the same case using the same rules. Model names come from the files and are marked unverified.” | Open **Compare your runs** and show the comparison explanation. |
| `1:29 to 1:45` | “The included failed and repaired runs are authored examples, not captured model responses. The browser checks both. I select the failed one and create the same nine-file test package.” | Load the included sample, confirm the synthetic data declaration, compare both runs, select the failed one, and create the test. |
| `1:45 to 2:05` | “Next I check the separate repair. The original run still fails, while the repaired run passes. A separate comparison case also passes, but the version that treats every situation as urgent fails. That catches the lazy fix.” | Return to the reference, select **Check example repair**, and show the repair check. |
| `2:05 to 2:26` | “Codex helped me build this and find edge cases. In another workflow, I requested GPT-5.6 Sol with Ultra reasoning to propose a repair in a restricted format the software could check. The software calculated the result.” | Show the requested configuration and the software results. |
| `2:26 to 2:47` | “This demo uses only synthetic data. It gives no medical advice. No physician has reviewed it, and no clinical validation was performed. WitnessPatch turns one known timing failure into a test a team can keep.” | End on the product safety statement, then return on camera for the final sentence. |

## Reviewed silent screen master

- File: `output/playwright/witnesspatch-founder-screen-master-v9-plain-copy.mp4`
- Duration: `167.000` seconds
- Video: H.264, `1400 x 900`, 25 frames per second, no audio stream
- SHA-256: `1876dd490082d9de93901ebe411b4a1d63e6f3c85ceaa7f6a579deb2fa7014bf`
- Visual review: sampled at 1, 19, 40, 75, 100, 125, 145, and 165 seconds; the failure, saved-run comparison, generated test, repair, receipt, and final safety statement were all visible without blank frames.

## Recording preflight

- Load the page and wait at least five seconds before recording so hydration is complete.
- Record around `1400` CSS pixels wide at 1440p or higher, with clear English narration.
- Use a window or selected-region recorder with the founder's microphone, or mux a separately recorded founder track onto a clean silent browser master. Playwright's page video has no microphone audio and is rehearsal evidence only.
- Use only `output/playwright/witnesspatch-founder-screen-master-v9-plain-copy.mp4`. Older screen masters show superseded interfaces.
- For the separate-track route, play the reviewed master from `0:00` and record one uninterrupted founder track. Start the first sentence with the first frame and finish no later than `2:46.5`. The clean audio used for assembly must last between `2:35` and `2:46.5`. Then run `npm run video:founder -- --audio-file "FOUNDER_AUDIO_FILE"`. If the media tools are not on `PATH`, set `WITNESSPATCH_FFMPEG_BIN` and `WITNESSPATCH_FFPROBE_BIN` to their absolute paths for this command only.
- Start from a fresh baseline. Do not precompile, splice in success, or begin on a generated artifact.
- Hide bookmarks, notifications, credentials, local paths, unrelated tabs, and private Codex traces.
- Use the **How it works** and **WitnessPatch** navigation buttons for controlled movement instead of free scrolling.
- Capture the real verification transitions and wait for their visible completion states.
- Abort and restart if reference compilation exceeds six seconds, included-sample loading exceeds three seconds, local compilation exceeds three seconds, or retained verification exceeds five seconds; never hide a stalled or failed state in the final cut.
- Keep **ORIGINAL RUN FAILS** visible after checking the repair; only the separate example repair passes.
- Keep the uploaded cut below three minutes after YouTube processing, and add accurate captions.
- The prepared caption timings match this screen master. After recording, verify every cue against the assembled founder video before upload.
- Audition the complete assembled file with headphones before upload. The assembler verifies timing, streams, codecs, geometry, and hashes; only the entrant can verify mode disclosure, speaker identity where applicable, exact words, pronunciation, intelligibility, and screen/audio alignment.
- Use no unlicensed music, third-party logos, reviewer identity, or patient information.

## Claims that are prohibited

- Do not say “Sol fixed it” or “the AI repair passed.” The example repair and the proposal from the Sol-requested run are separate files.
- Do not say tamper-proof, signed, publisher-authenticated, or independently attested model identity.
- Do not claim clinical validity, medical correctness, safety certification, production readiness, HIPAA compliance, lives saved, or patient outcomes.
- Do not say the browser executes candidate JavaScript or applies the patch.
- Do not imply blood-pressure threshold inference beyond the two exact fixture-supplied endpoints.
- Do not say the original run starts passing. It remains **ORIGINAL RUN FAILS** beside **EXAMPLE REPAIR PASSES**.
- Do not call the displayed patch a complete diff; it is an abridged verified behavior-diff excerpt.
- Do not call the static witness target-in-loop, counterfactual, clinically minimal, or proof of generalization.
