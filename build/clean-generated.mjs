import { rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

for (const directory of ["dist", ".vinext"]) {
  await rm(resolve(projectRoot, directory), { recursive: true, force: true });
}
