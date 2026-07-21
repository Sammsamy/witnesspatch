import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

function readExportedHtml() {
  return readFile(new URL("../dist/client/index.html", import.meta.url), "utf8");
}

test("the deployed static export contains the WitnessPatch product shell", async () => {
  const html = await readExportedHtml();
  assert.match(html, /<title>Turn late AI agent actions into tests \| WitnessPatch/);
  assert.match(html, /deadline had already/);
  assert.match(html, /Turn failure into test/);
  assert.match(html, /Compare your runs/);
  assert.match(html, /What each run must do/);
  assert.match(html, /same for every run/);
  assert.match(html, /fully synthetic/i);
});

test("exposes the evidence, executable test, and safety boundary", async () => {
  const html = await readExportedHtml();

  assert.match(html, /CDC Hear Her/);
  assert.match(html, /AIM/);
  assert.match(html, /ACOG/);
  assert.match(html, /No test is generated yet/);
  assert.match(html, /Recorded responses stay fixed\. The agent is not rerun\./);
  assert.doesNotMatch(
    html,
    /the repair passes the urgent trace and exact negative control/,
  );
  assert.doesNotMatch(html, /engine\/tests\/v2-clinical-scope.test.mjs/);
  assert.doesNotMatch(html, /engine\/tests\/target-repair.test.mjs/);
  assert.match(
    html,
    /The compiler uses recorded decisions\. It does not rerun the agent or call a model\./,
  );
  assert.match(html, /Match the recorded action/);
  assert.match(html, /Developer safety tooling\. Not clinical decision support/);
  assert.match(html, /No physician reviewed the fixture or wording/i);
  assert.match(html, /No clinical validation was performed/i);
  assert.match(html, /PWS-V2-001/);
  assert.match(html, /Compare imported agent runs/);
  assert.match(html, /Up to six WitnessPatch run files/);
  assert.match(html, /no OpenAI or clinical organization endorsement is implied/i);
  assert.match(html, /npm run artifacts:v2:verify/);
  assert.match(html, /processed locally and are not submitted/);
  assert.match(html, /cannot detect PHI or prove de-identification/);
  assert.doesNotMatch(html, /HIPAA compliant|clinically validated|medical advice/i);
});

test("keeps the judge replay keyboard and screen-reader legible", async () => {
  const html = await readExportedHtml();

  assert.match(html, /Copy verify command/);
  assert.match(html, /role="status"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /aria-current="page"/);
  assert.match(html, /role="tablist"/);
  assert.match(html, /aria-controls="artifact-panel"/);
  assert.match(html, /role="tabpanel"/);
  assert.match(html, />Failed</);
  assert.doesNotMatch(html, /Suite options|>Reproduce</);
});

test("keeps same-page controls out of static RSC navigation", async () => {
  const html = await readExportedHtml();

  assert.match(html, /<button[^>]*aria-label="Scroll to the top of WitnessPatch"/);
  assert.match(html, /<button[^>]*>How it works<\/button>/);
  assert.doesNotMatch(html, /href="#(?:top|method)"/);
});

test("exports a judge-ready static replay without a request-time Worker", async () => {
  const exportedHtmlUrl = new URL("../dist/client/index.html", import.meta.url);
  const exportedRscUrl = new URL("../dist/client/index.rsc", import.meta.url);
  const staticConfigUrl = new URL("../wrangler.static.jsonc", import.meta.url);

  const [html, rsc, staticConfig] = await Promise.all([
    readFile(exportedHtmlUrl, "utf8"),
    readFile(exportedRscUrl, "utf8"),
    readFile(staticConfigUrl, "utf8").then(JSON.parse),
  ]);

  assert.match(html, /<title>Turn late AI agent actions into tests \| WitnessPatch/);
  assert.match(html, /Turn failure into test/);
  assert.match(html, /Compare your runs/);
  assert.ok(rsc.length > 0, "static export must retain its RSC payload");
  assert.match(html, /witnesspatch-v2-c9fb4568/);
  assert.match(rsc, /"deploymentVersion":"witnesspatch-v2-c9fb4568"/);
  assert.equal(staticConfig.assets.directory, "./dist/client");
  assert.equal(staticConfig.assets.run_worker_first, false);
  assert.equal("main" in staticConfig, false);
});

test("ships the reviewed third-party notice byte-for-byte", async () => {
  const [sourceNotice, exportedNotice] = await Promise.all([
    readFile(new URL("../THIRD_PARTY_NOTICES.md", import.meta.url)),
    readFile(new URL("../dist/client/THIRD_PARTY_NOTICES.md", import.meta.url)),
  ]);

  assert.deepEqual(exportedNotice, sourceNotice);
});
