import express from "express";
import { timingSafeEqual } from "node:crypto";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { host, instanceFile, instanceId, readPort, root, runDirectory } from "./instance.mjs";
import { createMotorApp } from "./motor-reference.mjs";

const port = readPort();
const token = process.env.AGLLM_CONTROL_TOKEN;
if (!token || !/^[a-f\d]{64}$/.test(token)) {
  throw new Error("Lancez le serveur avec start.cmd ou npm start.");
}

const id = instanceId(token);
const app = express();
const sessions = new Set();
const allowedHosts = [host, "localhost"].flatMap((name) => port === 80 ? [name, `${name}:80`] : [`${name}:${port}`]);
app.disable("x-powered-by");
app.use((request, response, next) => {
  if (!allowedHosts.includes(request.get("host"))) {
    return response.sendStatus(403);
  }
  response.set("X-Content-Type-Options", "nosniff");
  next();
});

app.get("/api/health", (_request, response) => {
  response.set("Cache-Control", "no-store").json({ application: "AGLLM", instance: id });
});

app.get("/api/session", (_request, response) => {
  response.set({ "Content-Type": "text/event-stream", "Cache-Control": "no-store" });
  response.flushHeaders();
  sessions.add(response);
  response.once("close", () => sessions.delete(response));
});

app.post("/api/shutdown", (request, response) => {
  const supplied = Buffer.from(request.get("authorization") || "");
  const expected = Buffer.from(`Bearer ${token}`);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    return response.sendStatus(403);
  }

  const closeBrowser = request.get("x-agllm-close-browser") === "1";
  response.once("finish", () => shutdown(closeBrowser));
  response.status(202).end();
});

app.use("/motorAGLLM", createMotorApp());
app.use(express.static(join(root, "dist"), {
  dotfiles: "deny",
  setHeaders(response, path) {
    response.setHeader("Cache-Control", path.endsWith(".html") ? "no-cache" : "public, max-age=3600");
  },
}));
app.use((_request, response) => response.sendStatus(404));

const server = app.listen(port, host, () => {
  try {
    mkdirSync(runDirectory, { recursive: true });
    writeFileSync(instanceFile(port), JSON.stringify({ token }), { mode: 0o600 });
    console.log(`AGLLM écoute sur http://${host}:${port}/`);
  } catch (error) {
    console.error(error.message);
    server.close();
    process.exitCode = 1;
  }
});
server.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});

let stopping = false;
function shutdown(closeBrowser = false) {
  if (stopping) {
    return;
  }
  stopping = true;
  for (const session of sessions) {
    session.end(`event: shutdown\ndata: ${JSON.stringify({ closeBrowser })}\n\n`);
  }
  try {
    rmSync(instanceFile(port), { force: true });
  } catch (error) {
    console.error(error.message);
  }
  server.close();
}

process.on("SIGINT", () => shutdown());
process.on("SIGTERM", () => shutdown());
