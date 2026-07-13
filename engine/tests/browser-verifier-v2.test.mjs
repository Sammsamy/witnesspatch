import assert from "node:assert/strict";
import { createHash, webcrypto } from "node:crypto";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { verifyBrowserArtifacts } from "../browser-verifier.mjs";
import { compileV2PolicyRepairProposal } from "../policy-repair-v2.mjs";
import { assertV2ManifestFileTable } from "../verify-artifacts-v2.mjs";

const testDir = dirname(fileURLToPath(import.meta.url));
const rootDir = dirname(dirname(testDir));
const publicDir = join(rootDir, "public");
const baseUrl = "https://witnesspatch.test/demo/";

function responseFor(bytes, url) {
  const body = Uint8Array.from(bytes);
  return {
    ok: true,
    status: 200,
    redirected: false,
    url,
    async arrayBuffer() {
      return body.buffer.slice(0);
    }
  };
}

async function loadFixture() {
  const manifest = JSON.parse(
    await readFile(join(publicDir, "runs", "v2", "manifest.json"), "utf8")
  );
  const files = new Map();
  for (const record of manifest.files) {
    files.set(
      record.path,
      new Uint8Array(
        await readFile(join(publicDir, record.path.replace(/^\/+/, "")))
      )
    );
  }
  return { manifest, files };
}

function createFetch(files) {
  const fetched = [];
  const fetchImpl = async (input, init) => {
    const url = new URL(String(input), baseUrl);
    fetched.push({ url, init });
    const bytes = files.get(url.pathname);
    assert.ok(bytes, `Unexpected V2 artifact request ${url.pathname}`);
    return responseFor(bytes, url.href);
  };
  return { fetchImpl, fetched };
}

function verify(fixture) {
  const mocked = createFetch(fixture.files);
  const promise = verifyBrowserArtifacts({
    manifest: fixture.manifest,
    fetchImpl: mocked.fetchImpl,
    subtle: webcrypto.subtle,
    baseUrl
  });
  return { promise, fetched: mocked.fetched };
}

function replaceArtifactBytes(fixture, id, replacement) {
  const record = fixture.manifest.files.find((item) => item.id === id);
  assert.ok(record, `Missing fixture artifact ${id}`);
  const bytes =
    typeof replacement === "string"
      ? new TextEncoder().encode(replacement)
      : replacement;
  fixture.files.set(record.path, bytes);
  record.bytes = bytes.byteLength;
  record.sha256 = createHash("sha256").update(bytes).digest("hex");
}

function mutateJsonArtifact(fixture, id, mutate) {
  const record = fixture.manifest.files.find((item) => item.id === id);
  assert.ok(record, `Missing fixture artifact ${id}`);
  const value = JSON.parse(new TextDecoder().decode(fixture.files.get(record.path)));
  mutate(value);
  replaceArtifactBytes(fixture, id, `${JSON.stringify(value, null, 2)}\n`);
}

test("browser verifier replays the post-start V2 bundle and V1 lineage hashes", async () => {
  const fixture = await loadFixture();
  const { promise, fetched } = verify(fixture);
  const receipt = await promise;

  assert.equal(receipt.status, "pass");
  assert.deepEqual(receipt.hashes, { verified: 23, total: 23 });
  assert.deepEqual(receipt.regrades, { verified: 2, total: 2 });
  assert.deepEqual(receipt.holdouts, { passed: 4, total: 4 });
  assert.equal(fetched.length, 23);
  assert.equal(
    receipt.release_verification.fresh_sol_v2.status,
    "validated_candidate"
  );
  assert.equal(receipt.release_verification.fresh_sol_v2.model, "gpt-5.6-sol");
  assert.equal(receipt.release_verification.fresh_sol_v2.reasoning_effort, "ultra");
  assert.equal(
    receipt.release_verification.fresh_sol_v2.candidate_installed,
    false
  );
  assert.equal(
    receipt.release_verification.fresh_sol_v2.browser_executed_javascript,
    false
  );
  assert.equal(
    receipt.release_verification.pre_start_v1.status,
    "rejected_under_v2"
  );
  assert.ok(
    fetched.some(({ url }) => url.pathname === "/runs/codex-candidate.mjs")
  );
  assert.ok(
    fetched.some(
      ({ url }) =>
        url.pathname ===
        "/runs/v2/archived-sol-v1-under-v2-evaluation.json"
    )
  );
  for (const { init } of fetched) {
    assert.equal(init.redirect, "error");
    assert.equal(init.cache, "no-store");
  }
});

test("V2 browser verification refuses a reduced seven-file proof profile", async () => {
  const fixture = await loadFixture();
  const coreIds = new Set([
    "case",
    "baseline",
    "repaired",
    "holdouts",
    "near_neighbor_case",
    "near_neighbor_safe",
    "near_neighbor_overfit"
  ]);
  fixture.manifest.files = fixture.manifest.files.filter((record) =>
    coreIds.has(record.id)
  );
  const { promise, fetched } = verify(fixture);

  await assert.rejects(promise, /release profile|23 artifact|missing/i);
  assert.equal(fetched.length, 0);
});

test("V2 browser verification rejects unchecked manifest counterexample counts", async () => {
  const fixture = await loadFixture();
  fixture.manifest.comparison.counterexample_starting_facts = 1001;
  fixture.manifest.comparison.counterexample_minimal_facts = 999;
  const { promise } = verify(fixture);

  await assert.rejects(promise, /counterexample claims|starting-fact|minimal-fact/i);
});

test("V2 browser verification rejects a rehashed false counterexample artifact", async () => {
  const fixture = await loadFixture();
  const record = fixture.manifest.files.find(
    (item) => item.id === "counterexample"
  );
  assert.ok(record);
  const counterexample = JSON.parse(
    new TextDecoder().decode(fixture.files.get(record.path))
  );
  counterexample.starting_fact_count = 999;
  const replacement = new TextEncoder().encode(
    `${JSON.stringify(counterexample, null, 2)}\n`
  );
  fixture.files.set(record.path, replacement);
  record.bytes = replacement.byteLength;
  record.sha256 = createHash("sha256").update(replacement).digest("hex");
  const { promise } = verify(fixture);

  await assert.rejects(promise, /starting-fact count|counterexample/i);
});

test("V2 browser verification recomputes counterexample minimality", async () => {
  const fixture = await loadFixture();
  const record = fixture.manifest.files.find(
    (item) => item.id === "counterexample"
  );
  assert.ok(record);
  const counterexample = JSON.parse(
    new TextDecoder().decode(fixture.files.get(record.path))
  );
  counterexample.minimal_fact_ids = counterexample.starting_fact_ids.slice(0, 3);
  const replacement = new TextEncoder().encode(
    `${JSON.stringify(counterexample, null, 2)}\n`
  );
  fixture.files.set(record.path, replacement);
  record.bytes = replacement.byteLength;
  record.sha256 = createHash("sha256").update(replacement).digest("hex");
  const { promise } = verify(fixture);

  await assert.rejects(promise, /counterexample.*minimization/i);
});

test("V2 browser verification cross-checks the target receipt against fresh regrades", async () => {
  const fixture = await loadFixture();
  const record = fixture.manifest.files.find(
    (item) => item.id === "target_repair_receipt"
  );
  assert.ok(record);
  const targetReceipt = JSON.parse(
    new TextDecoder().decode(fixture.files.get(record.path))
  );
  targetReceipt.runs[0].expected.score = 999;
  targetReceipt.runs[0].observed_score = 999;
  targetReceipt.runs[0].score = 999;
  const replacement = new TextEncoder().encode(
    `${JSON.stringify(targetReceipt, null, 2)}\n`
  );
  fixture.files.set(record.path, replacement);
  record.bytes = replacement.byteLength;
  record.sha256 = createHash("sha256").update(replacement).digest("hex");
  const { promise } = verify(fixture);

  await assert.rejects(promise, /target-repair receipt runs/i);
});

test("V2 browser verification rejects rehashed fake Sol model or effort claims", async () => {
  for (const [field, value] of [
    ["requested_model", "gpt-5.6-pro"],
    ["requested_reasoning_effort", "high"]
  ]) {
    const fixture = await loadFixture();
    mutateJsonArtifact(fixture, "sol_v2_receipt", (receipt) => {
      receipt.generation[field] = value;
    });
    const { promise } = verify(fixture);
    await assert.rejects(promise, /model, authentication, or isolation/i);
  }
});

test("V2 browser verification rejects rehashed candidate, proposal, and receipt-link tampering", async () => {
  {
    const fixture = await loadFixture();
    const record = fixture.manifest.files.find((item) => item.id === "sol_v2_candidate");
    assert.ok(record);
    const altered = `${new TextDecoder().decode(fixture.files.get(record.path))}\n// altered\n`;
    replaceArtifactBytes(fixture, "sol_v2_candidate", altered);
    const { promise } = verify(fixture);
    await assert.rejects(promise, /candidate hashes|compiler output/i);
  }
  {
    const fixture = await loadFixture();
    mutateJsonArtifact(fixture, "sol_v2_proposal", (proposal) => {
      proposal.policy.branches[0].decision.message += " altered";
    });
    const { promise } = verify(fixture);
    await assert.rejects(promise, /candidate hashes|compiler output/i);
  }
  {
    const fixture = await loadFixture();
    mutateJsonArtifact(fixture, "sol_v2_receipt", (receipt) => {
      receipt.candidate.files.source = "output/elsewhere/candidate.mjs";
    });
    const { promise } = verify(fixture);
    await assert.rejects(promise, /candidate file links/i);
  }
});

test("V2 browser verification rejects a rehashed altered exact-input claim", async () => {
  const fixture = await loadFixture();
  mutateJsonArtifact(fixture, "sol_v2_receipt", (receipt) => {
    receipt.input_scope.urgent_case.sha256 = "0".repeat(64);
  });
  const { promise } = verify(fixture);

  await assert.rejects(promise, /urgent case exact-byte input claim/i);
});

test("V2 browser verification behavior-rejects coordinated rehashed proof tampering", async () => {
  const fixture = await loadFixture();
  const proposalRecord = fixture.manifest.files.find(
    (item) => item.id === "sol_v2_proposal"
  );
  assert.ok(proposalRecord);
  const proposal = JSON.parse(
    new TextDecoder().decode(fixture.files.get(proposalRecord.path))
  );
  const urgentBranch = proposal.policy.branches.find(
    (branch) => branch.id === "postpartum-visual-changes-route"
  );
  assert.ok(urgentBranch);
  urgentBranch.decision.actions = urgentBranch.decision.actions.filter(
    (action) => action !== "provide_concrete_urgent_route"
  );
  replaceArtifactBytes(
    fixture,
    "sol_v2_proposal",
    `${JSON.stringify(proposal, null, 2)}\n`
  );
  replaceArtifactBytes(
    fixture,
    "sol_v2_candidate",
    compileV2PolicyRepairProposal(proposal)
  );
  const updatedProposal = fixture.manifest.files.find(
    (item) => item.id === "sol_v2_proposal"
  );
  const updatedCandidate = fixture.manifest.files.find(
    (item) => item.id === "sol_v2_candidate"
  );
  assert.ok(updatedProposal && updatedCandidate);
  mutateJsonArtifact(fixture, "sol_v2_receipt", (receipt) => {
    receipt.candidate.proposal_sha256 = updatedProposal.sha256;
    receipt.candidate.candidate_source_sha256 = updatedCandidate.sha256;
  });
  const { promise } = verify(fixture);

  await assert.rejects(promise, /browser-interpreted acceptance signature/i);
});

test("V2 browser verification rejects a missing proof artifact before fetching", async () => {
  const fixture = await loadFixture();
  fixture.manifest.files = fixture.manifest.files.filter(
    (record) => record.id !== "sol_v2_prompt"
  );
  const { promise, fetched } = verify(fixture);

  await assert.rejects(promise, /23 artifact|sol_v2_prompt|missing/i);
  assert.equal(fetched.length, 0);
});

test("Node V2 manifest validation rejects traversal and duplicate-path inflation", async () => {
  const fixture = await loadFixture();
  assert.equal(assertV2ManifestFileTable(fixture.manifest), fixture.manifest);

  const traversal = structuredClone(fixture.manifest);
  traversal.files[0].path = "/runs/../../package.json";
  assert.throws(() => assertV2ManifestFileTable(traversal), /match|path|runs/i);

  const duplicate = structuredClone(fixture.manifest);
  duplicate.files[1].path = duplicate.files[0].path;
  assert.throws(() => assertV2ManifestFileTable(duplicate), /unique/i);
});
