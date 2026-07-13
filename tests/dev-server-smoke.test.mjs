import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import { createConnection, createServer } from "node:net";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

async function reserveEphemeralPort() {
  const server = createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, resolve);
  });
  const address = server.address();
  assert.ok(address && typeof address === "object");
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  return address.port;
}

function canConnect(host, port) {
  return new Promise((resolve) => {
    const socket = createConnection({ host, port });
    let settled = false;
    const finish = (connected) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(connected);
    };
    socket.setTimeout(250, () => finish(false));
    socket.once("connect", () => finish(true));
    socket.once("error", () => finish(false));
  });
}

async function waitForListeningServer(child, port, readLogs) {
  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null || child.signalCode !== null) {
      throw new Error(`Dev server exited before listening.\n${readLogs()}`);
    }
    if (await canConnect("::1", port)) return `http://[::1]:${port}`;
    if (await canConnect("127.0.0.1", port)) {
      return `http://127.0.0.1:${port}`;
    }
    await delay(200);
  }
  throw new Error(`Timed out waiting for the dev server.\n${readLogs()}`);
}

async function waitForExit(child, timeoutMs) {
  if (child.exitCode !== null || child.signalCode !== null) return true;
  return Promise.race([
    once(child, "exit").then(() => true),
    delay(timeoutMs).then(() => false),
  ]);
}

async function stopProcessTree(child) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
      stdio: "ignore",
    });
    await waitForExit(child, 5_000);
    return;
  }

  try {
    process.kill(-child.pid, "SIGTERM");
  } catch {
    child.kill("SIGTERM");
  }
  if (await waitForExit(child, 5_000)) return;
  try {
    process.kill(-child.pid, "SIGKILL");
  } catch {
    child.kill("SIGKILL");
  }
  await waitForExit(child, 5_000);
}

test(
  "the Vinext dev server serves its first page request and retained manifest",
  { timeout: 75_000 },
  async (t) => {
    const port = await reserveEphemeralPort();
    let logs = "";
    const appendLogs = (chunk) => {
      logs += chunk.toString();
      if (logs.length > 24_000) logs = logs.slice(-24_000);
    };
    const child = spawn(
      npmCommand,
      ["run", "dev", "--", "--port", String(port), "--strictPort"],
      {
        cwd: repositoryRoot,
        detached: process.platform !== "win32",
        env: { ...process.env, FORCE_COLOR: "0", NO_COLOR: "1" },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    child.stdout.on("data", appendLogs);
    child.stderr.on("data", appendLogs);
    t.after(() => stopProcessTree(child));

    const origin = await waitForListeningServer(child, port, () => logs);
    const pageResponse = await fetch(`${origin}/`, {
      redirect: "manual",
      signal: AbortSignal.timeout(20_000),
    });
    assert.equal(
      pageResponse.status,
      200,
      `The first page GET failed.\n${logs}`,
    );
    assert.match(await pageResponse.text(), /WitnessPatch/);

    const manifestResponse = await fetch(`${origin}/runs/v2/manifest.json`, {
      redirect: "manual",
      signal: AbortSignal.timeout(10_000),
    });
    assert.equal(
      manifestResponse.status,
      200,
      `The retained manifest was not served.\n${logs}`,
    );
    const manifest = await manifestResponse.json();
    assert.equal(manifest.release_profile, "witnesspatch-v2-release");
    assert.equal(manifest.files.length, 23);
  },
);
