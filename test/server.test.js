import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { request } from "node:http";
import { test } from "node:test";
import { instanceFile } from "../scripts/instance.mjs";
import { httpFixture, runLifecycle, unusedPort } from "./fixture.mjs";

test("les scripts Windows lancent une seule instance et l’arrêtent proprement", async (t) => {
  const port = await unusedPort();
  const url = `http://127.0.0.1:${port}/`;
  t.after(() => runLifecycle("stop", port, true));

  assert.match((await runLifecycle("start", port, true)).stdout, /AGLLM.*https?:/);
  const firstHealth = await (await fetch(`${url}api/health`)).json();
  assert.equal(firstHealth.application, "AGLLM");
  assert.match(firstHealth.instance, /^[a-f0-9]{64}$/);
  await runLifecycle("start", port, true);
  assert.deepEqual(await (await fetch(`${url}api/health`)).json(), firstHealth);

  const response = await fetch(url);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  const html = await response.text();
  assert.match(html, /<title>AGLLM/);
  const asset = html.match(/src="(\/assets\/[^"]+\.js)"/)[1];
  assert.equal((await fetch(new URL(asset, url))).status, 200);
  assert.equal((await fetch(`${url}package.json`)).status, 404);
  assert.equal((await fetch(`${url}api/shutdown`, { method: "POST" })).status, 403);
  assert.equal((await fetch(`${url}api/shutdown`)).status, 404);

  assert.match(html, /AnimalGame LouisLeMaitre/);
  assert.equal((await fetch(`${url}jeu/`)).status, 404);

  const externalHost = await new Promise((resolve, reject) => {
    request(url, { headers: { Host: `outside.example:${port}` } }, (result) => {
      result.resume();
      resolve(result.statusCode);
    }).on("error", reject).end();
  });
  assert.equal(externalHost, 403);

  const session = await fetch(`${url}api/session`);
  assert.match(session.headers.get("content-type"), /^text\/event-stream\b/);
  await runLifecycle("stop", port, true);
  const notice = await session.text();
  assert.match(notice, /event: shutdown/);
  if (process.platform === "win32") assert.match(notice, /"closeBrowser":true/);
  await assert.rejects(fetch(url));
  await assert.rejects(readFile(instanceFile(port)), { code: "ENOENT" });
  await runLifecycle("stop", port, true);
  await runLifecycle("start", port, true);
  assert.notEqual((await (await fetch(`${url}api/health`)).json()).instance, firstHealth.instance);
});

test("un autre serveur sur le port est conservé lors du lancement et de l’arrêt", async (t) => {
  const service = await httpFixture((_request, response) => response.end("Autre service"));
  t.after(service.close);

  await assert.rejects(runLifecycle("start", service.port, true), { code: 1 });
  await runLifecycle("stop", service.port, true);
  assert.equal(await (await fetch(service.url)).text(), "Autre service");
});
