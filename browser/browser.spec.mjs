import assert from "node:assert/strict";
import { test } from "node:test";
import { chromium } from "playwright-core";
import { newGame } from "../src/game/engine.js";
import { saveKey, serialize } from "../src/game/saves.js";
import { runLifecycle, unusedPort } from "../test/fixture.mjs";

test("joue sur le moteur intégré, utilise la caméra et restaure la partie après l’arrêt", { timeout: 60000 }, async (t) => {
  const port = await unusedPort();
  const url = `http://127.0.0.1:${port}/`;
  await runLifecycle("start", port);
  t.after(() => runLifecycle("stop", port));

  const browser = await chromium.launch({
    channel: process.env.AGLLM_TEST_BROWSER || "chrome",
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
  });
  t.after(() => browser.close());
  const context = await browser.newContext({ viewport: { width: 1440, height: 980 } });
  const outsideRequests = [];
  await context.route("**/*", (route) => {
    if (new URL(route.request().url()).origin === new URL(url).origin) return route.continue();
    outsideRequests.push(route.request().url());
    return route.abort();
  });

  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(url);

  const play = page.getByRole("region", { name: "Jeu", exact: true });
  const button = (name) => page.getByRole("button", { name, exact: true });
  const garden = button("Construire · Jardin nourricier");
  await garden.waitFor();
  await button("Mettre en pause").click();
  await garden.click();
  await play.locator(".building-card").filter({ hasText: "Jardin nourricier" }).getByLabel("1 construit").waitFor();
  assert.equal(await page.locator("iframe").count(), 0);
  assert.equal(await page.locator('[data-stock="timber"]').textContent(), "0");

  await button("Fiche · Jardin nourricier").click();
  await page.getByRole("dialog", { name: "Jardin nourricier" }).waitFor();
  await page.keyboard.press("Escape");
  assert.equal(await button("Fiche · Jardin nourricier").evaluate((element) => document.activeElement === element), true);

  await button("Observer Jardin nourricier").click();
  await page.locator(".camera-subject").filter({ hasText: "Jardin nourricier" }).waitFor();
  await button("Zoom avant").click();
  await page.keyboard.press("Escape");
  await garden.waitFor();

  await button("Village").click();
  await button("Affecter · Cueilleur").click();
  await page.locator("summary").filter({ hasText: "Recensement" }).click();
  await page.locator("summary").filter({ hasText: "Amande" }).click();
  assert.equal(await page.getByLabel("Métier de Amande").inputValue(), "forager");
  await button("Favori").click();
  await page.getByLabel("Favoris").check();
  assert.equal(await page.locator("details.resident").count(), 1);
  await button("Sauvegarder").click();
  await page.locator(".save-notice").getByText("Partie sauvegardée.").waitFor();
  assert.ok(await page.evaluate((key) => localStorage.getItem(key), saveKey));

  const duplicate = await context.newPage();
  await duplicate.goto(url);
  await duplicate.getByRole("status").getByText("Partie ouverte dans un autre onglet").waitFor();
  assert.equal(await duplicate.getByRole("region", { name: "Jeu", exact: true }).count(), 0);
  await duplicate.close();

  await page.setViewportSize({ width: 320, height: 740 });
  await button("Ressources").click();
  await page.getByRole("region", { name: "Ressources", exact: true }).waitFor();
  assert.equal(await play.isVisible(), false);
  await button("Journal").click();
  await page.getByRole("region", { name: "Journal", exact: true }).getByText(/Construction terminée.*Jardin nourricier/).waitFor();
  assert.ok(await page.locator(".shell").evaluate((element) => element.scrollWidth <= innerWidth));

  await button("Options").click();
  const options = page.getByRole("dialog", { name: "Options AGLLM" });
  await options.waitFor();
  const download = page.waitForEvent("download");
  await options.getByRole("button", { name: "Exporter la partie" }).click();
  assert.equal((await download).suggestedFilename(), "agllm-partie.json");
  await options.getByLabel("Contenu de la sauvegarde").fill("invalide");
  const replace = options.getByRole("button", { name: "Remplacer la partie par cette sauvegarde" });
  await replace.click();
  await options.getByRole("alert").waitFor();
  const advanced = newGame();
  Object.assign(advanced.buildings, { garden: 4, archive: 1, studio: 1, pit: 1, lodge: 1, market: 1 });
  advanced.researched = ["craft", "masonry", "routes"];
  advanced.stocks.timber = 48;
  advanced.paused = true;
  await options.getByLabel("Contenu de la sauvegarde").fill(serialize(advanced));
  await replace.click();
  await options.waitFor({ state: "hidden" });
  await button("Jeu").click();
  await button("Atelier").click();
  await button("Scier des planches").click();
  await button("Expéditions").click();
  await button("Partir · Les berges du nord").click();
  await play.getByText(/Retour de l’expédition/).waitFor();

  await runLifecycle("stop", port);
  await page.getByRole("status").getByText("AGLLM est arrêté").waitFor();
  await runLifecycle("start", port);
  await page.reload();
  await button("Expéditions").click();
  await play.getByText(/Retour de l’expédition/).waitFor();
  await button("Ressources").click();
  assert.equal(await page.locator('[data-stock="boards"]').textContent(), "3");
  assert.deepEqual(outsideRequests, []);
  assert.deepEqual(errors, []);
});
