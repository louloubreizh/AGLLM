import { execFile } from "node:child_process";
import { createServer } from "node:http";
import { promisify } from "node:util";
import { host, root } from "../scripts/instance.mjs";

const exec = promisify(execFile);

export async function httpFixture(handler) {
  const server = createServer(handler);
  await new Promise((resolve) => server.listen(0, host, resolve));
  const port = server.address().port;
  return {
    url: `http://${host}:${port}/`,
    port,
    close: () => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())),
  };
}

export async function unusedPort() {
  const fixture = await httpFixture();
  await fixture.close();
  return fixture.port;
}

export function runLifecycle(action, port, wrappers = false) {
  const windows = wrappers && process.platform === "win32";
  const command = windows ? process.env.ComSpec || "cmd.exe" : process.execPath;
  const args = windows
    ? ["/d", "/c", `${action}.cmd`, ...(action === "start" ? ["--server-only"] : [])]
    : ["scripts/lifecycle.mjs", action];
  return exec(command, args, {
    cwd: root,
    env: { ...process.env, KGLLM_PORT: String(port) },
    timeout: 12000,
    windowsHide: true,
  });
}
