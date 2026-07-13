const DEFAULT_CONTEXT_LINES = 3;

function requireValue(condition, message) {
  if (!condition) throw new TypeError(message);
}

function normalizedLines(source) {
  requireValue(typeof source === "string", "Unified-diff inputs must be strings.");
  const normalized = source.replace(/\r\n?/gu, "\n");
  if (normalized.length === 0) return [];

  const values = normalized.split("\n");
  const hasFinalNewline = values.at(-1) === "";
  if (hasFinalNewline) values.pop();
  return values.map((value, index) => ({
    value,
    hasNewline: index < values.length - 1 || hasFinalNewline
  }));
}

function sameLine(left, right) {
  return (
    left.value === right.value && left.hasNewline === right.hasNewline
  );
}

function longestCommonSubsequence(oldLines, newLines) {
  const rows = Array.from(
    { length: oldLines.length + 1 },
    () => new Uint32Array(newLines.length + 1)
  );

  for (let oldIndex = oldLines.length - 1; oldIndex >= 0; oldIndex -= 1) {
    for (let newIndex = newLines.length - 1; newIndex >= 0; newIndex -= 1) {
      rows[oldIndex][newIndex] = sameLine(
        oldLines[oldIndex],
        newLines[newIndex]
      )
        ? rows[oldIndex + 1][newIndex + 1] + 1
        : Math.max(
            rows[oldIndex + 1][newIndex],
            rows[oldIndex][newIndex + 1]
          );
    }
  }
  return rows;
}

function diffOperations(oldLines, newLines) {
  const lcs = longestCommonSubsequence(oldLines, newLines);
  const operations = [];
  let oldIndex = 0;
  let newIndex = 0;

  while (oldIndex < oldLines.length || newIndex < newLines.length) {
    if (
      oldIndex < oldLines.length &&
      newIndex < newLines.length &&
      sameLine(oldLines[oldIndex], newLines[newIndex])
    ) {
      operations.push({ type: " ", line: oldLines[oldIndex] });
      oldIndex += 1;
      newIndex += 1;
      continue;
    }

    if (
      newIndex < newLines.length &&
      (oldIndex === oldLines.length ||
        lcs[oldIndex][newIndex + 1] > lcs[oldIndex + 1][newIndex])
    ) {
      operations.push({ type: "+", line: newLines[newIndex] });
      newIndex += 1;
      continue;
    }

    operations.push({ type: "-", line: oldLines[oldIndex] });
    oldIndex += 1;
  }
  return operations;
}

function hunkRanges(operations, contextLines) {
  const changed = operations
    .map((operation, index) => (operation.type === " " ? -1 : index))
    .filter((index) => index >= 0);
  if (changed.length === 0) return [];

  const ranges = [];
  for (const index of changed) {
    const start = Math.max(0, index - contextLines);
    const end = Math.min(operations.length, index + contextLines + 1);
    const current = ranges.at(-1);
    if (current && start <= current.end) {
      current.end = Math.max(current.end, end);
    } else {
      ranges.push({ start, end });
    }
  }
  return ranges;
}

function lineCountsBefore(operations) {
  const oldCounts = new Uint32Array(operations.length + 1);
  const newCounts = new Uint32Array(operations.length + 1);
  for (let index = 0; index < operations.length; index += 1) {
    oldCounts[index + 1] =
      oldCounts[index] + (operations[index].type === "+" ? 0 : 1);
    newCounts[index + 1] =
      newCounts[index] + (operations[index].type === "-" ? 0 : 1);
  }
  return { oldCounts, newCounts };
}

function formatRange(start, count) {
  const firstLine = count === 0 ? start : start + 1;
  return count === 1 ? String(firstLine) : `${firstLine},${count}`;
}

function formatOperation(operation) {
  let output = `${operation.type}${operation.line.value}\n`;
  if (!operation.line.hasNewline) {
    output += "\\ No newline at end of file\n";
  }
  return output;
}

function assertLabel(label, name) {
  requireValue(typeof label === "string" && label.length > 0, `${name} is required.`);
  requireValue(!/[\r\n\0]/u.test(label), `${name} contains an unsafe character.`);
}

function exactLines(source, name) {
  requireValue(typeof source === "string", `${name} must be a string.`);
  requireValue(!/[\r\0]/u.test(source), `${name} must use exact LF text without NUL bytes.`);
  if (source.length === 0) return [];

  const values = source.split("\n");
  const hasFinalNewline = values.at(-1) === "";
  if (hasFinalNewline) values.pop();
  return values.map((value, index) => ({
    value,
    hasNewline: index < values.length - 1 || hasFinalNewline
  }));
}

function serializeLines(lines) {
  return lines
    .map((line) => `${line.value}${line.hasNewline ? "\n" : ""}`)
    .join("");
}

function parseHunkCoordinate(startText, countText, side) {
  const start = Number(startText);
  const count = countText === undefined ? 1 : Number(countText);
  requireValue(
    Number.isSafeInteger(start) &&
      Number.isSafeInteger(count) &&
      start >= 0 &&
      count >= 0 &&
      (count === 0 || start >= 1),
    `Unified patch has an invalid ${side} hunk coordinate.`
  );
  return { start, count, index: count === 0 ? start : start - 1 };
}

export function createUnifiedDiff({
  oldText,
  newText,
  oldLabel,
  newLabel,
  contextLines = DEFAULT_CONTEXT_LINES
}) {
  assertLabel(oldLabel, "oldLabel");
  assertLabel(newLabel, "newLabel");
  requireValue(
    Number.isSafeInteger(contextLines) && contextLines >= 1,
    "contextLines must be a positive safe integer."
  );

  const operations = diffOperations(
    normalizedLines(oldText),
    normalizedLines(newText)
  );
  const ranges = hunkRanges(operations, contextLines);
  if (ranges.length === 0) return "";

  const { oldCounts, newCounts } = lineCountsBefore(operations);
  let output = `--- ${oldLabel}\n+++ ${newLabel}\n`;
  for (const range of ranges) {
    const oldCount = oldCounts[range.end] - oldCounts[range.start];
    const newCount = newCounts[range.end] - newCounts[range.start];
    output += `@@ -${formatRange(oldCounts[range.start], oldCount)} +${formatRange(
      newCounts[range.start],
      newCount
    )} @@\n`;
    for (const operation of operations.slice(range.start, range.end)) {
      output += formatOperation(operation);
    }
  }
  return output;
}

export function applyUnifiedDiff({ oldText, patchText, oldLabel, newLabel }) {
  assertLabel(oldLabel, "oldLabel");
  assertLabel(newLabel, "newLabel");
  requireValue(typeof patchText === "string", "patchText must be a string.");
  if (patchText.length === 0) return oldText;
  requireValue(
    !/[\r\0]/u.test(patchText) && patchText.endsWith("\n"),
    "Unified patch must be NUL-free, LF-only text ending in a newline."
  );

  const source = exactLines(oldText, "oldText");
  const patchLines = patchText.slice(0, -1).split("\n");
  requireValue(
    patchLines[0] === `--- ${oldLabel}` &&
      patchLines[1] === `+++ ${newLabel}`,
    "Unified patch labels do not match the expected files."
  );

  const output = [];
  const appendOutput = (lines) => {
    for (const line of lines) {
      requireValue(
        output.length === 0 || output.at(-1).hasNewline,
        "Unified patch places content after a no-final-newline output line."
      );
      output.push(line);
    }
  };
  let patchIndex = 2;
  let sourceIndex = 0;
  let sawHunk = false;
  while (patchIndex < patchLines.length) {
    const header = patchLines[patchIndex].match(
      /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@(?: .*)?$/u
    );
    requireValue(header, "Unified patch contains text outside a valid hunk.");
    sawHunk = true;
    patchIndex += 1;

    const oldRange = parseHunkCoordinate(header[1], header[2], "old");
    const newRange = parseHunkCoordinate(header[3], header[4], "new");
    requireValue(
      oldRange.index >= sourceIndex && oldRange.index <= source.length,
      "Unified patch hunks overlap or exceed the source."
    );
    appendOutput(source.slice(sourceIndex, oldRange.index));
    sourceIndex = oldRange.index;
    requireValue(
      output.length === newRange.index,
      "Unified patch new-file hunk coordinate is inconsistent."
    );

    let oldLinesSeen = 0;
    let newLinesSeen = 0;
    let changed = false;
    while (
      patchIndex < patchLines.length &&
      !patchLines[patchIndex].startsWith("@@ ")
    ) {
      const encoded = patchLines[patchIndex];
      const type = encoded[0];
      requireValue(
        type === " " || type === "-" || type === "+",
        "Unified patch contains an invalid hunk line."
      );
      patchIndex += 1;
      const noFinalNewline =
        patchLines[patchIndex] === "\\ No newline at end of file";
      if (noFinalNewline) patchIndex += 1;
      const line = {
        value: encoded.slice(1),
        hasNewline: !noFinalNewline
      };

      if (type === " " || type === "-") {
        requireValue(
          sourceIndex < source.length && sameLine(source[sourceIndex], line),
          "Unified patch context or deletion does not match the exact source."
        );
        sourceIndex += 1;
        oldLinesSeen += 1;
      }
      if (type === " " || type === "+") {
        appendOutput([line]);
        newLinesSeen += 1;
      }
      if (type !== " ") changed = true;
    }

    requireValue(changed, "Unified patch hunk contains no change.");
    requireValue(
      oldLinesSeen === oldRange.count && newLinesSeen === newRange.count,
      "Unified patch hunk counts do not match its header."
    );
  }

  requireValue(sawHunk, "Unified patch contains no hunks.");
  appendOutput(source.slice(sourceIndex));
  return serializeLines(output);
}
