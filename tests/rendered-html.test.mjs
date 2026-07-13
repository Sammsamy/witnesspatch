import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

function readExportedHtml() {
  return readFile(new URL("../dist/client/index.html", import.meta.url), "utf8");
}

test("the deployed static export contains the WitnessPatch product shell", async () => {
  const html = await readExportedHtml();
  assert.match(html, /<title>Compile healthcare AI failures into tests · WitnessPatch/);
  assert.match(html, /contract breach happened/);
  assert.match(html, /before the blood pressure arrived/);
  assert.match(html, /Verify retained evidence/);
  assert.match(html, /Locked verifier/);
  assert.match(html, /not model-graded/);
  assert.match(html, /fully synthetic/i);
});

test("exposes the evidence, executable test, and safety boundary", async () => {
  const html = await readExportedHtml();

  assert.match(html, /CDC Hear Her/);
  assert.match(html, /AIM/);
  assert.match(html, /ACOG/);
  assert.match(
    html,
    /the repair passes the urgent trace and exact negative control/,
  );
  assert.match(html, /engine\/tests\/v2-clinical-scope.test.mjs/);
  assert.doesNotMatch(html, /engine\/tests\/target-repair.test.mjs/);
  assert.match(html, /Locked verifier · read-only to Sol/);
  assert.match(html, /Match actions to visible words/);
  assert.match(html, /Developer safety tooling—not clinical decision support/);
  assert.match(html, /licensed physician validation pending/i);
  assert.match(html, /PWS-V2-001/);
  assert.match(html, /Assists fixture &amp; repair authoring/);
  assert.match(html, /npm run artifacts:v2:verify/);
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

test("exports a judge-ready static replay without a request-time Worker", async () => {
  const exportedHtmlUrl = new URL("../dist/client/index.html", import.meta.url);
  const exportedRscUrl = new URL("../dist/client/index.rsc", import.meta.url);
  const staticConfigUrl = new URL("../wrangler.static.jsonc", import.meta.url);

  const [html, rscStats, staticConfig] = await Promise.all([
    readFile(exportedHtmlUrl, "utf8"),
    stat(exportedRscUrl),
    readFile(staticConfigUrl, "utf8").then(JSON.parse),
  ]);

  assert.match(html, /<title>Compile healthcare AI failures into tests · WitnessPatch/);
  assert.match(html, /Verify retained evidence/);
  assert.ok(rscStats.size > 0, "static export must retain its RSC payload");
  assert.equal(staticConfig.assets.directory, "./dist/client");
  assert.equal(staticConfig.assets.run_worker_first, false);
  assert.equal("main" in staticConfig, false);
});
