import assert from "node:assert/strict";
import test from "node:test";

import { applyUnifiedDiff, createUnifiedDiff } from "../unified-diff.mjs";

const labels = Object.freeze({ oldLabel: "a/old.txt", newLabel: "b/new.txt" });

test("unified diff is empty for identical inputs", () => {
  assert.equal(
    createUnifiedDiff({ oldText: "alpha\nbeta\n", newText: "alpha\nbeta\n", ...labels }),
    ""
  );
});

test("unified diff emits stable insertion and deletion boundary ranges", () => {
  assert.equal(
    createUnifiedDiff({
      oldText: "",
      newText: "first\n",
      ...labels
    }),
    [
      "--- a/old.txt",
      "+++ b/new.txt",
      "@@ -0,0 +1 @@",
      "+first",
      ""
    ].join("\n")
  );
  assert.equal(
    createUnifiedDiff({
      oldText: "first\nlast\n",
      newText: "first\n",
      ...labels
    }),
    [
      "--- a/old.txt",
      "+++ b/new.txt",
      "@@ -1,2 +1 @@",
      " first",
      "-last",
      ""
    ].join("\n")
  );
});

test("unified diff separates distant changes into deterministic hunks", () => {
  assert.equal(
    createUnifiedDiff({
      oldText: "a\nb\nc\nd\ne\nf\ng\nh\ni\nj\n",
      newText: "a\nB\nc\nd\ne\nf\ng\nh\nI\nj\n",
      contextLines: 1,
      ...labels
    }),
    [
      "--- a/old.txt",
      "+++ b/new.txt",
      "@@ -1,3 +1,3 @@",
      " a",
      "-b",
      "+B",
      " c",
      "@@ -8,3 +8,3 @@",
      " h",
      "-i",
      "+I",
      " j",
      ""
    ].join("\n")
  );
});

test("unified diff records missing final newlines on both sides", () => {
  assert.equal(
    createUnifiedDiff({ oldText: "before", newText: "after", ...labels }),
    [
      "--- a/old.txt",
      "+++ b/new.txt",
      "@@ -1 +1 @@",
      "-before",
      "\\ No newline at end of file",
      "+after",
      "\\ No newline at end of file",
      ""
    ].join("\n")
  );

  for (const [oldText, newText] of [
    ["same\n", "same"],
    ["same", "same\n"]
  ]) {
    const patchText = createUnifiedDiff({ oldText, newText, ...labels });
    assert.match(patchText, /\\ No newline at end of file/u);
    assert.equal(
      applyUnifiedDiff({ oldText, patchText, ...labels }),
      newText
    );
  }
});

test("unified diff normalizes CRLF and lone CR inputs to canonical LF", () => {
  const expected = createUnifiedDiff({
    oldText: "alpha\nbeta\n",
    newText: "alpha\ngamma\n",
    ...labels
  });
  assert.equal(
    createUnifiedDiff({
      oldText: "alpha\r\nbeta\r\n",
      newText: "alpha\r\ngamma\r\n",
      ...labels
    }),
    expected
  );
  assert.equal(
    createUnifiedDiff({
      oldText: "alpha\rbeta\r",
      newText: "alpha\rgamma\r",
      ...labels
    }),
    expected
  );
});

test("unified diff rejects empty or control-bearing labels", () => {
  for (const [field, value] of [
    ["oldLabel", ""],
    ["oldLabel", "a/old\nforged"],
    ["newLabel", "b/new\rforged"],
    ["newLabel", "b/new\0forged"]
  ]) {
    assert.throws(
      () =>
        createUnifiedDiff({
          oldText: "a\n",
          newText: "b\n",
          ...labels,
          [field]: value
        }),
      TypeError
    );
  }
  assert.throws(
    () =>
      createUnifiedDiff({
        oldText: "a\n",
        newText: "b\n",
        contextLines: 0,
        ...labels
      }),
    TypeError
  );
});

test("unified patch application round-trips multihunk and no-final-newline changes", () => {
  const oldText = "a\nb\nc\nd\ne\nf\ng\nh\ni\nj";
  const newText = "a\nB\nc\nd\ne\nf\ng\nh\nI\nj";
  const patchText = createUnifiedDiff({
    oldText,
    newText,
    contextLines: 1,
    ...labels
  });
  assert.equal(
    applyUnifiedDiff({ oldText, patchText, ...labels }),
    newText
  );
});

test("unified patch application rejects altered labels, coordinates, and context", () => {
  const oldText = "alpha\nbeta\ngamma\n";
  const patchText = createUnifiedDiff({
    oldText,
    newText: "alpha\nchanged\ngamma\n",
    ...labels
  });
  for (const altered of [
    patchText.replace("--- a/old.txt", "--- a/forged.txt"),
    patchText.replace("@@ -1,3 +1,3 @@", "@@ -2,3 +1,3 @@"),
    patchText.replace(" alpha", " forged")
  ]) {
    assert.throws(
      () => applyUnifiedDiff({ oldText, patchText: altered, ...labels }),
      TypeError
    );
  }

  const impossibleNewline = [
    "--- a/old.txt",
    "+++ b/new.txt",
    "@@ -1,3 +1,3 @@",
    " alpha",
    "-beta",
    "+changed",
    "\\ No newline at end of file",
    " gamma",
    ""
  ].join("\n");
  assert.throws(
    () => applyUnifiedDiff({ oldText, patchText: impossibleNewline, ...labels }),
    TypeError
  );
});
