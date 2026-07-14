import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { verifyArtifactsV2 } from "../engine/verify-artifacts-v2.mjs";
import {
  formatReviewPreflight,
  parseReviewPins,
  runReviewPreflight
} from "./review-preflight.mjs";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const vinextCli = resolve(projectRoot, "node_modules", "vinext", "dist", "cli.js");

function runDevelopmentServer() {
  const child = spawn(process.execPath, [vinextCli, "dev"], {
    cwd: projectRoot,
    env: {
      ...process.env,
      WRANGLER_LOG_PATH: resolve(projectRoot, ".wrangler", "wrangler.log")
    },
    stdio: "inherit",
    windowsHide: true
  });

  return new Promise((resolveExit, reject) => {
    const signals = ["SIGINT", "SIGTERM"];
    const handlers = new Map();
    for (const signal of signals) {
      const handler = () => child.kill(signal);
      handlers.set(signal, handler);
      process.once(signal, handler);
    }
    const cleanup = () => {
      for (const [signal, handler] of handlers) {
        process.off(signal, handler);
      }
    };

    child.once("error", (error) => {
      cleanup();
      reject(error);
    });
    child.once("exit", (code, signal) => {
      cleanup();
      resolveExit(signal === "SIGINT" ? 130 : (code ?? 1));
    });
  });
}

async function main() {
  try {
    const pins = parseReviewPins(process.argv.slice(2));
    const preflight = await runReviewPreflight(pins);
    process.stdout.write(`${formatReviewPreflight(preflight)}\n`);

    const manifest = await verifyArtifactsV2();
    process.stdout.write(
      `Verified V2 ${manifest.files.length} hashes, 2 fresh regrades, and ${manifest.comparison.holdouts_passed}/${manifest.comparison.holdouts_total} holdouts; archived V1 candidate rejected.\n`
    );
    process.stdout.write(
      "Start the independent browser task at the exact local URL printed below. Keep this terminal running; use a second terminal for the exported-bundle execution command.\n"
    );
    process.exitCode = await runDevelopmentServer();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown reviewer-start error.";
    process.stderr.write(`REVIEW START FAIL: ${message}\n`);
    process.exitCode = 1;
  }
}

await main();
