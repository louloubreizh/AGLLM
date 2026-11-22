import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import LZString from "lz-string";
import { chromium } from "playwright-core";
import { newGame } from "../src/game/engine.js";
import { parseSave, saveKey, serialize } from "../src/game/saves.js";
import { copyStocksToAGLLM, copyStocksToKittensGame, parseTransferSave } from "../src/game/stock-transfer.js";
import { runLifecycle, unusedPort } from "../test/fixture.mjs";
test("joue en mode autonome, utilise la caméra et restaure la partie après l’arrêt", { timeout: 60000 }, async (t) => {
  const port = await unusedPort();
  const url = `http://127.0.0.1:${port}/?mode=agllm`;
  await runLifecycle("start", port);
  t.after(() => runLifecycle("stop", port));

  const browser = await chromium.launch({
    channel: process.env.AGLLM_TEST_BROWSER || "chrome",
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
  });
  t.after(() => browser.close());
  const context = await browser.newContext({ hasTouch: true, viewport: { width: 1440, height: 980 } });
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
  async function checkDesktopLayout() {
    const bounds = await page.locator(".game-panels").evaluate((area) => ({
      area: area.getBoundingClientRect().toJSON(),
      ...Object.fromEntries([...area.querySelectorAll(".game-widget")].map(
        (widget) => [widget.dataset.widget, widget.getBoundingClientRect().toJSON()])),
    }));
    const { area, resources, play, journal } = bounds;
    assert.ok(resources.right < play.left && play.right < journal.left);
    assert.ok(Math.abs(resources.left - area.left) < 1);
    assert.ok(Math.abs(play.x + play.width / 2 - (area.x + area.width / 2)) < 1);
    assert.ok(Math.abs(play.bottom - area.bottom) < 1);
    assert.ok(Math.abs(journal.right - area.right) < 1);
    assert.ok(Math.abs(journal.top - resources.top) < 1);
    return bounds;
  }

  const desktop = await checkDesktopLayout();
  const resources = page.getByRole("region", { name: "Ressources", exact: true });
  await button("Déplacer Ressources").press("ArrowUp");
  assert.equal((await resources.boundingBox()).y, desktop.resources.y);
  await button("Déplacer Ressources").press("ArrowRight");
  assert.equal((await resources.boundingBox()).x, desktop.resources.x + 20);
  await button("Déplacer Ressources").press("ArrowLeft");
  await button("Redimensionner Ressources").press("ArrowRight");
  assert.equal((await resources.boundingBox()).width, desktop.resources.width + 20);
  await button("Réduire Ressources").click();
  assert.equal(await resources.locator(".resource-list").isVisible(), false);
  await button("Agrandir Ressources").click();
  await resources.locator(".resource-list").waitFor();
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
  assert.deepEqual(await page.getByRole("navigation", { name: "Panneaux de jeu" }).getByRole("button").allTextContents(),
    ["Ressources", "Jeu", "Journal"]);
  await button("Ressources").click();
  await page.getByRole("region", { name: "Ressources", exact: true }).waitFor();
  assert.equal(await play.isVisible(), false);
  await button("Journal").click();
  const journal = page.getByRole("region", { name: "Journal", exact: true });
  const panelSwitcher = page.getByRole("navigation", { name: "Panneaux de jeu" });
  await journal.getByText(/Construction terminée.*Jardin nourricier/).waitFor();
  assert.ok(await page.locator(".shell").evaluate((element) => element.scrollWidth <= innerWidth));

  await page.setViewportSize({ width: 1060, height: 430 });
  assert.equal(await panelSwitcher.isVisible(), false);
  await checkDesktopLayout();
  assert.equal(await resources.getAttribute("data-resized"), null);
  await page.setViewportSize({ width: 568, height: 320 });
  await journal.waitFor();
  assert.equal(await play.isVisible(), false);
  await button("Déplacer Journal").press("ArrowDown");
  const journalBounds = await journal.boundingBox();
  assert.ok(journalBounds.y + journalBounds.height <= (await panelSwitcher.boundingBox()).y);
  await page.setViewportSize({ width: 320, height: 740 });

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
  Object.assign(advanced.buildings, { garden: 4, archive: 1, studio: 2, pit: 1, lodge: 1, market: 1 });
  advanced.researched = ["craft", "masonry", "routes", "kilns"];
  advanced.stocks.timber = 48;
  advanced.stocks.stone = 8;
  advanced.stocks.metal = 27;
  advanced.stocks.notes = 20;
  advanced.paused = true;
  await options.getByLabel("Contenu de la sauvegarde").fill(serialize(advanced));
  await replace.click();
  await options.waitFor({ state: "hidden" });
  await button("Options").click();
  const transfer = options.locator(".save-transfer");
  await transfer.locator("summary").click();
  const foreign = {
    saveVersion: 15, calendar: {}, village: {}, buildings: [],
    resources: [{ name: "wood", value: 50 }, { name: "iron", value: 32 }, { name: "science", value: 45 }],
  };
  const picker = transfer.getByLabel("Export de Kittens Game");
  const preview = transfer.getByRole("table", { name: "Quantités avant transfert" });
  await picker.setInputFiles({
    name: "sauvegarde-invalide.txt", mimeType: "text/plain", buffer: Buffer.from("invalide"),
  });
  await transfer.getByRole("alert").waitFor();
  assert.equal(await button("Copier les stocks vers AGLLM").isEnabled(), false);
  await picker.setInputFiles({
    name: "sauvegarde.txt", mimeType: "text/plain",
    buffer: Buffer.from("\uFEFF" + LZString.compressToUTF16(JSON.stringify(foreign)), "utf16le"),
  });
  const science = preview.getByRole("row", { name: /Science/ });
  await science.waitFor();
  assert.deepEqual(await science.getByRole("cell").allTextContents(), ["20", "45"]);
  const incoming = page.waitForEvent("download");
  await button("Copier les stocks vers AGLLM").click();
  const copied = parseSave(await readFile(await (await incoming).path(), "utf8"));
  assert.deepEqual(copied.stocks, { ...advanced.stocks, timber: 50, metal: 32, notes: 45 });
  const outgoing = page.waitForEvent("download");
  await button("Copier les stocks vers Kittens Game").click();
  const packed = await readFile(await (await outgoing).path(), "utf8");
  assert.deepEqual(JSON.parse(LZString.decompressFromBase64(packed)), {
    ...foreign, resources: [{ name: "wood", value: 48 }, { name: "iron", value: 27 }, { name: "science", value: 20 }],
  });
  assert.deepEqual(parseSave(await page.evaluate((key) => localStorage.getItem(key), saveKey)).stocks, advanced.stocks);
  await button("Fermer les options").click();
  await button("Jeu").click();
  await button("Recherche").click();
  await button("Étudier · Voiles et engrenages").waitFor();
  assert.equal(await button("Étudier · Navigation nocturne").count(), 0);
  await button("Atelier").click();
  await button("Scier des planches").click();
  const ironRecipe = play.locator(".game-card").filter({ hasText: "Couler le fer" });
  assert.match(await ironRecipe.innerText(), /8 pierre.*6 bois/s);
  assert.match(await ironRecipe.innerText(), /3,3 fer/);
  await button("Couler le fer").click();
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
  assert.equal(await page.locator('[data-stock="boards"]').textContent(), "3,3");
  const iron = resources.locator(".resource-list > div").filter({ has: page.getByText("Fer", { exact: true }) });
  assert.match(await iron.locator("dd").innerText(), /30,3\s*\/\s*60/);
  assert.equal(await resources.locator('[data-stock="clay"]').textContent(), "8");
  await iron.locator("summary").tap();
  await iron.getByText(/Produit au four ou à l’atelier/).waitFor();
  assert.deepEqual(outsideRequests, []);
  assert.deepEqual(errors, []);
});

test("joue dans l’interface moderne et échange des sauvegardes natives complètes", { timeout: 60000 }, async (t) => {
  const port = await unusedPort();
  const url = `http://127.0.0.1:${port}/`;
  await runLifecycle("start", port);
  t.after(() => runLifecycle("stop", port));
  const browser = await chromium.launch({
    channel: process.env.AGLLM_TEST_BROWSER || "chrome",
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
  });
  t.after(() => browser.close());
  const context = await browser.newContext({ locale: "fr-FR", viewport: { width: 1440, height: 980 } });
  const outsideRequests = [];
  await context.route("**/*", (route) => {
    if (new URL(route.request().url()).origin === new URL(url).origin) return route.continue();
    outsideRequests.push(route.request().url());
    return route.abort();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(url);
  const frameLocator = page.frameLocator('iframe[title="Kittens Game"]');
  const pause = page.getByRole("button", { name: "Mettre en pause", exact: true });
  const options = page.getByRole("button", { name: "Options", exact: true });
  const gather = frameLocator.getByText("Cueillir de l'herbe à chat", { exact: true });
  await gather.waitFor();
  await pause.click();
  const engine = () => page.frames().find((frame) => frame.url().startsWith(`${url}motorAGLLM/`));
  const motor = engine();
  assert.equal(await frameLocator.locator("#topBar").isVisible(), false);
  const navbar = page.getByRole("navigation", { name: "Navigation AGLLM" });
  const actions = (await navbar.getByRole("button").all()).map((button) => button.getAttribute("aria-label"));
  const names = await Promise.all(actions);
  assert.deepEqual(names.slice(names.indexOf("Options"), names.indexOf("Infos") + 1), ["Options", "Connexion", "Infos"]);
  await navbar.getByRole("button", { name: "Connexion" }).click();
  await frameLocator.locator(".login-popup").waitFor();
  await navbar.getByRole("button", { name: "Connexion" }).click();
  await frameLocator.locator(".login-popup").waitFor({ state: "hidden" });
  await navbar.getByRole("button", { name: "Infos" }).press("Enter");
  const information = page.getByRole("region", { name: "Informations de la partie" });
  for (const label of ["FPS", "Pollution", "Bonheur", "Électricité", "Chagrin"]) {
    await information.getByText(label, { exact: true }).waitFor();
  }
  await page.keyboard.press("Escape");
  const resourcesWithArt = await motor.evaluate(() => {
    const root = document.createElement("div");
    const mark = document.createElement("span");
    mark.className = "resource-name";
    root.append(mark);
    document.body.append(root);
    const resources = [...new Set([
      ...gamePage.resPool.resources.map(({ name }) => name),
      ...gamePage.resPool.getPseudoResources().map(({ name }) => name),
      "worship", "epiphany", "necrocornDeficit",
    ])];
    const images = resources.map((name) => {
      root.className = `resource_${name}`;
      return getComputedStyle(mark).getPropertyValue("--resource-mark").trim();
    });
    root.remove();
    return images.every(Boolean) && new Set(images).size === resources.length;
  });
  assert.equal(resourcesWithArt, true);
  const before = await motor.evaluate(() => gamePage.resPool.get("catnip").value);
  await gather.click();
  assert.ok(await motor.evaluate(() => gamePage.resPool.get("catnip").value) > before);

  const [resourcesPanel, play, journal] = await Promise.all(["Ressources", "Jeu", "Journal"]
    .map((name) => frameLocator.getByRole("region", { name, exact: true }).boundingBox()));
  assert.ok(resourcesPanel.x + resourcesPanel.width < play.x && play.x + play.width < journal.x);
  assert.ok(Math.abs(play.x + play.width / 2 - 720) < 1);
  assert.ok(play.y > resourcesPanel.y);
  const headers = await motor.evaluate(() => [...document.querySelectorAll("#game > .game-widget")].map((panel) => {
    const header = panel.querySelector(".widget-slot");
    const content = panel.querySelector(".widget-content");
    const filler = document.createElement("div");
    filler.style.height = "1500px";
    content.append(filler);
    const before = header.getBoundingClientRect();
    content.scrollTop = 100;
    const after = header.getBoundingClientRect();
    const outside = panel.getBoundingClientRect();
    const fixed = content.scrollTop > 0 && before.top === after.top && outside.width - after.width <= 2.1;
    filler.remove();
    content.scrollTop = 0;
    return fixed;
  }));
  assert.deepEqual(headers, [true, true, true]);
  await page.locator(".render-status").waitFor({ state: "hidden" });
  await page.mouse.move(720, 210);
  await page.mouse.down();
  await frameLocator.locator(".reference-scene-input.is-moving").waitFor();
  await page.mouse.move(800, 235, { steps: 4 });
  await page.mouse.up();
  await page.keyboard.press("Home");

  const exported = await motor.evaluate(() => {
    Object.assign(gamePage.bld.get("field"), { val: 2, on: 2, unlocked: true });
    Object.assign(gamePage.bld.get("hut"), { val: 4, on: 4, unlocked: true });
    gamePage.bld.get("library").on = 1;
    gamePage.bld.get("library").val = 1;
    gamePage.bld.get("workshop").on = 1;
    gamePage.bld.get("workshop").val = 1;
    gamePage.ironWill = false;
    gamePage.village.sim.addKitten();
    gamePage.calendar.year = 8;
    gamePage.science.get("agriculture").researched = true;
    gamePage.science.get("civil").researched = true;
    for (const [id, value] of [["wood", 17], ["iron", 11], ["science", 41], ["minerals", 9]]) {
      Object.assign(gamePage.resPool.get(id), { value, unlocked: true });
    }
    return gamePage.compressLZData(JSON.stringify(gamePage.save()));
  });
  const transfer = parseTransferSave(exported);
  const agllmState = newGame();
  const { stocks } = parseSave(copyStocksToAGLLM(agllmState, transfer));
  assert.deepEqual([stocks.timber, stocks.metal, stocks.notes], [17, 11, 41]);

  async function restoreViaOptions(source) {
    await motor.evaluate(() => {
      gamePage.bld.get("hut").val = 0;
      gamePage.calendar.year = 0;
      gamePage.science.get("agriculture").researched = false;
    });
    await options.click();
    await frameLocator.locator("#importButton").click();
    await frameLocator.getByLabel("Fichier de sauvegarde Kittens Game").setInputFiles({
      name: "Kittens Game.txt", mimeType: "text/plain", buffer: Buffer.from(source),
    });
    await frameLocator.getByText("Fichier chargé.", { exact: false }).waitFor();
    const confirmation = page.waitForEvent("dialog");
    const importing = frameLocator.locator("#doImportButton").click();
    await (await confirmation).accept();
    await importing;
    await motor.waitForFunction(() => gamePage.calendar.year === 8);
    return motor.evaluate(() => ({
      huts: gamePage.bld.get("hut").val,
      fields: gamePage.bld.get("field").val,
      year: gamePage.calendar.year,
      agriculture: gamePage.science.get("agriculture").researched,
      stocks: ["wood", "iron", "science", "minerals"].map((id) => gamePage.resPool.get(id).value),
    }));
  }

  const original = { huts: 4, fields: 2, year: 8, agriculture: true, stocks: [17, 11, 41, 9] };
  assert.deepEqual(await restoreViaOptions(exported), original);
  assert.equal(await page.evaluate((key) => localStorage.getItem(key), saveKey), null);
  await frameLocator.locator("#leftColumn .resource_iron .resource-name").getByText("fer", { exact: true }).waitFor();

  await options.click();
  await frameLocator.locator("#exportButton").click();
  const file = page.waitForEvent("download");
  await frameLocator.locator("#exportToSimpleFile").click();
  const reexported = await readFile(await (await file).path(), "utf8");
  const save = JSON.parse(LZString.decompressFromBase64(reexported));
  assert.equal(save.calendar.year, 8);
  assert.equal(save.buildings.find(({ name }) => name === "hut").val, 4);
  assert.equal(save.science.techs.find(({ name }) => name === "agriculture").researched, true);
  await frameLocator.locator("#exportDiv #closeButton").click();
  await frameLocator.locator("#optionsDiv .close").click();
  assert.deepEqual(await restoreViaOptions(reexported), original);

  Object.assign(agllmState.stocks, { metal: 7, notes: 19 });
  const updated = copyStocksToKittensGame(agllmState, transfer);
  assert.deepEqual(await restoreViaOptions(updated), { ...original, stocks: [12, 7, 19, 9] });

  await motor.evaluate(() => {
    Object.assign(gamePage.bld.get("accelerator"), { val: 8, on: 0, unlocked: true });
    const pasture = gamePage.bld.get("pasture");
    Object.assign(pasture, { val: 0, on: 0, unlocked: true });
    pasture.stages[1].stageUnlocked = true;
    gamePage.opts.hideDowngrade = false;
    gamePage.render();
  });
  const accelerator = frameLocator.locator('[data-building-icon="accelerator"]');
  await accelerator.getByText("0/8", { exact: true }).waitFor();
  await accelerator.getByRole("button", { name: "Activer des bâtiments", exact: true }).click();
  await accelerator.getByRole("link", { name: "+1", exact: true }).click();
  await accelerator.getByText("1/8", { exact: true }).waitFor();
  await accelerator.getByRole("button", { name: "Désactiver des bâtiments", exact: true }).click();
  await accelerator.getByRole("link", { name: "−1", exact: true }).click();
  assert.equal(await motor.evaluate(() => gamePage.bld.get("accelerator").on), 0);
  await frameLocator.locator('[data-building-icon="pasture"] [data-camp-stage="up"]').click();
  await frameLocator.locator('[data-building-icon="solarfarm"] .camp-building-preview img').waitFor();
  await frameLocator.locator('[data-building-icon="solarfarm"] [data-camp-stage="down"]').click();
  assert.equal(await motor.evaluate(() => gamePage.bld.get("pasture").stage), 0);

  const fieldName = "Champ d'herbe à chat";
  await frameLocator.getByRole("button", { name: `Fiche · ${fieldName}` }).click();
  const fieldSheet = page.getByRole("dialog", { name: fieldName });
  await fieldSheet.getByText(/Planter de l'herbe à chat/).waitFor();
  await page.keyboard.press("Escape");
  await fieldSheet.waitFor({ state: "hidden" });

  await frameLocator.getByRole("button", { name: "Observer Champ d'herbe à chat" }).click();
  await page.locator(".camera-subject").getByText("Champ d'herbe à chat").waitFor();
  await page.keyboard.press("Escape");
  await gather.waitFor();
  assert.equal(await motor.evaluate(() => gamePage.bld.get("field").val), 2);

  const other = await context.newPage();
  await other.goto(`${url}motorAGLLM/`);
  await other.waitForURL(url);
  await other.getByRole("status").getByText("Partie ouverte dans un autre onglet").waitFor();
  assert.equal(await other.locator("iframe").count(), 0);
  await other.close();

  await page.setViewportSize({ width: 320, height: 740 });
  await motor.evaluate(() => {
    gamePage.opts.tooltipsInRightColumn = true;
    gamePage.ui.updateOptions();
  });
  const field = frameLocator.getByText(/Champ d'herbe à chat/).first();
  await field.hover();
  const tooltip = frameLocator.locator("#tooltip[data-floating]");
  await tooltip.getByText(/Planter de l'herbe à chat/).waitFor();
  const tooltipBounds = await tooltip.boundingBox();
  assert.ok(tooltipBounds.x >= 0 && tooltipBounds.x + tooltipBounds.width <= 320);

  const picker = frameLocator.getByRole("combobox", { name: "Section du jeu" });
  await picker.selectOption("Science");
  await frameLocator.locator(".tabInner.Science .reference-section-art").waitFor();
  await picker.selectOption("Workshop");
  await frameLocator.locator(".tabInner.Workshop .reference-section-art").waitFor();
  await picker.selectOption("Village");
  const woodcutter = frameLocator.locator('.village-job-card[data-job="woodcutter"]');
  await woodcutter.locator(".village-job-picture").waitFor();
  assert.ok(await woodcutter.locator(".village-job-picture").evaluate((image) => image.decode().then(() => image.naturalWidth > 0)));
  const jobs = frameLocator.getByRole("button", { name: "Emplois", exact: true });
  await jobs.press("Space");
  assert.equal(await jobs.getAttribute("aria-expanded"), "false");
  await jobs.press("Space");
  await woodcutter.getByRole("button", { name: "Affecter 1 · Bûcheron" }).click();
  assert.equal(await motor.evaluate(() => gamePage.village.getJob("woodcutter").value), 1);
  const people = frameLocator.locator(".village-census");
  await people.locator("tbody tr").first().waitFor();
  const search = people.getByRole("searchbox");
  await search.fill("villageois-introuvable");
  assert.equal(await people.locator("tbody tr").count(), 0);
  await search.clear();
  const resident = people.locator("tbody tr").first();
  await resident.locator(".village-resident-name").click();
  await people.locator(".village-resident-details:popover-open").waitFor();
  await page.keyboard.press("Escape");
  await resident.locator('[data-icon="star"]').click();
  assert.equal(await motor.evaluate(() => gamePage.village.sim.kittens[0].favorite), true);
  await picker.selectOption("Bonfire");

  await page.getByRole("button", { name: "Ressources", exact: true }).click();
  await frameLocator.getByRole("region", { name: "Ressources", exact: true }).waitFor();
  assert.equal(await gather.isVisible(), false);
  assert.ok(await motor.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.getByRole("button", { name: "Journal", exact: true }).click();
  await frameLocator.getByRole("region", { name: "Journal", exact: true }).waitFor();

  await motor.evaluate(() => { gamePage.resPool.get("iron").value = 15; });
  await runLifecycle("stop", port);
  await page.getByRole("status").getByText("AGLLM est arrêté").waitFor();
  await runLifecycle("start", port);
  await page.reload();
  await gather.waitFor();
  assert.equal(await engine().evaluate(() => gamePage.resPool.get("iron").value), 15);
  assert.deepEqual(outsideRequests, []);
  assert.deepEqual(errors, []);
});
