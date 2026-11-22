import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { closeSync, existsSync, mkdirSync, openSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { host, instanceFile, instanceId, readPort, root, runDirectory } from "./instance.mjs";

async function health(url) {
  try {
    const response = await fetch(`${url}api/health`, { signal: AbortSignal.timeout(350), redirect: "error" });
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
}

function readToken(port) {
  try {
    const { token } = JSON.parse(readFileSync(instanceFile(port), "utf8"));
    return /^[a-f\d]{64}$/.test(token) ? token : null;
  } catch {
    return null;
  }
}

async function runningInstance(port, url) {
  const state = await health(url);
  const token = readToken(port);
  return token && state?.application === "AGLLM" && state.instance === instanceId(token) ? token : null;
}

async function start(port, url) {
  if (await runningInstance(port, url)) {
    console.log(`AGLLM est déjà lancé sur ${url}`);
    return;
  }
  if (!existsSync(join(root, "dist", "index.html"))) {
    throw new Error("Interface absente. Exécutez npm ci puis npm run build.");
  }

  mkdirSync(runDirectory, { recursive: true });
  const logPath = join(runDirectory, `server-${port}.log`);
  const log = openSync(logPath, "a");
  const token = randomBytes(32).toString("hex");
  let child;
  try {
    child = spawn(process.execPath, [join(root, "scripts", "server.mjs")], {
      cwd: root,
      detached: true,
      windowsHide: true,
      stdio: ["ignore", log, log],
      env: { ...process.env, AGLLM_PORT: String(port), AGLLM_CONTROL_TOKEN: token },
    });
  } finally {
    closeSync(log);
  }

  let spawnError;
  child.once("error", (error) => { spawnError = error; });
  child.unref();

  const deadline = Date.now() + 8000;
  while (Date.now() < deadline) {
    if (await runningInstance(port, url)) {
      console.log(`AGLLM est disponible sur ${url}`);
      return;
    }
    if (spawnError || child.exitCode !== null || child.signalCode !== null) {
      break;
    }
    await delay(100);
  }
  if (child.pid && child.exitCode === null && child.signalCode === null) {
    child.kill();
  }
  throw new Error(`Le serveur n’a pas démarré sur le port ${port}. Consultez ${logPath}.`);
}

async function stop(port, url, closeBrowser) {
  const token = await runningInstance(port, url);
  if (!token) {
    console.log(`Aucune instance AGLLM active sur le port ${port}.`);
    return;
  }
  const response = await fetch(`${url}api/shutdown`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "X-AGLLM-Close-Browser": closeBrowser ? "1" : "0" },
    signal: AbortSignal.timeout(3000),
    redirect: "error",
  });
  if (response.status !== 202) {
    throw new Error(`Le serveur a refusé de s’arrêter (${response.status}).`);
  }
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    if ((await health(url))?.instance !== instanceId(token)) {
      console.log(`AGLLM est arrêté sur le port ${port}.`);
      return;
    }
    await delay(100);
  }
  throw new Error(`Le serveur AGLLM répond encore sur le port ${port}.`);
}

async function openViewer(url) {
  const profile = process.env.AGLLM_BROWSER_PROFILE;
  const chrome = [process.env.ProgramFiles, process.env["ProgramFiles(x86)"], process.env.LOCALAPPDATA]
    .filter(Boolean)
    .map((directory) => join(directory, "Google", "Chrome", "Application", "chrome.exe"))
    .find(existsSync);
  const [command, args] = chrome
    ? [chrome, [...(profile ? [`--user-data-dir=${profile}`] : []), `--app=${url}`]]
    : ["rundll32.exe", ["url.dll,FileProtocolHandler", url]];
  const browser = spawn(command, args, { detached: true, stdio: "ignore" });
  await new Promise((resolve, reject) => {
    browser.once("spawn", resolve);
    browser.once("error", reject);
  });
  browser.unref();
}

try {
  const action = process.argv[2];
  const port = readPort();
  const url = `http://${host}:${port}/`;
  if (action === "start") {
    await start(port, url);
    if (process.platform === "win32" && process.argv.includes("--open")) {
      await openViewer(url);
    }
  } else if (action === "stop") {
    await stop(port, url, process.argv.includes("--close-browser"));
  } else {
    throw new Error("Commande attendue : start ou stop.");
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
