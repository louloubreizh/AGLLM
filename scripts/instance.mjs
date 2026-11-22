import { createHash } from "node:crypto";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const root = fileURLToPath(new URL("../", import.meta.url));
export const host = "127.0.0.1";
export const runDirectory = join(root, ".run");

export function readPort() {
  const value = process.env.AGLLM_PORT || "8080";
  const port = Number(value);
  if (!/^\d+$/.test(value) || port < 1 || port > 65535) {
    throw new Error("AGLLM_PORT doit être un port compris entre 1 et 65535.");
  }
  return port;
}

export function instanceFile(port) {
  return join(runDirectory, `instance-${port}.json`);
}

export function instanceId(token) {
  return createHash("sha256").update(token).digest("hex");
}
