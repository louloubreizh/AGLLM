import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { chromium } from "playwright-core";
import { runLifecycle, unusedPort } from "../test/fixture.mjs";

test("le bouton AGLLM change l’espèce du village et mémorise le choix", { timeout: 40000 }, async (t) => {
  const port = await unusedPort();
  const url = `http://127.0.0.1:${port}/`;
  await runLifecycle("start", port);
  t.after(() => runLifecycle("stop", port));
  const browser = await chromium.launch({ channel: process.env.AGLLM_TEST_BROWSER || "chrome" });
  t.after(() => browser.close());
  const page = await browser.newPage({ locale: "fr-FR" });
  await page.route("**/*", (route) => route.request().url().startsWith(url) ? route.continue() : route.abort());
  await page.goto(url);
  const frame = page.frameLocator('iframe[title="Moteur AGLLM"]');
  const gather = frame.getByText("Cueillir de l'herbe à chat", { exact: true });
  await gather.waitFor();
  await page.getByRole("button", { name: "Mettre en pause", exact: true }).click();
  const journal = frame.locator("#rightColumn");
  const intro = (animal) => journal.getByText(`Vous êtes un ${animal} dans une forêt d'herbe à chat.`, { exact: true });
  await intro("chat").waitFor();

  const trigger = page.getByRole("button", { name: "AGLLM", exact: true });
  await trigger.click();
  const picker = page.getByRole("region", { name: "Habitants du village" });
  assert.equal(await picker.getByRole("radio").count(), 5);
  for (const animal of ["Chien", "Lapin", "Vélociraptor", "Drake des brumes", "Chat", "Lapin"]) {
    await picker.getByRole("radio", { name: new RegExp(`^${animal}`) }).check();
    await intro(animal.toLowerCase()).waitFor();
  }
  await page.keyboard.press("Escape");
  await picker.waitFor({ state: "hidden" });
  assert.equal(await gather.isVisible(), true);

  await page.reload();
  await gather.waitFor();
  await trigger.click();
  assert.equal(await picker.getByRole("radio", { name: /^Lapin/ }).isChecked(), true);
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
  const frameLocator = page.frameLocator('iframe[title="Moteur AGLLM"]');
  const pause = page.getByRole("button", { name: "Mettre en pause", exact: true });
  const options = page.getByRole("button", { name: "Options", exact: true });
  const gather = frameLocator.getByText("Cueillir de l'herbe à chat", { exact: true });
  await gather.waitFor();
  await pause.click();
  const secondTab = await context.newPage();
  await secondTab.goto(new URL("?mode=agllm", url).href);
  await secondTab.getByRole("status").getByText("Partie ouverte dans un autre onglet").waitFor();
  assert.equal(await secondTab.locator("iframe").count(), 0);
  await secondTab.close();
  const engine = () => page.frames().find((frame) => frame.url().startsWith(`${url}motorAGLLM/`));
  const motor = engine();
  assert.equal(await frameLocator.locator("#topBar").isVisible(), false);
  assert.equal(await frameLocator.locator("#footerLinks").isVisible(), false);
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
  const resourcesWithArt = await motor.evaluate(async () => {
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
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 14;
    const drawing = canvas.getContext("2d", { willReadFrequently: true });
    const silhouettes = new Set();
    for (const background of images) {
      const image = new Image();
      image.src = background.slice(5, -2);
      await image.decode();
      drawing.clearRect(0, 0, 14, 14);
      drawing.drawImage(image, 0, 0, 14, 14);
      const pixels = drawing.getImageData(0, 0, 14, 14).data;
      const corners = [0, 13, 182, 195];
      if (corners.some((corner) => pixels[corner * 4 + 3] > 0)) return false;
      const alpha = [];
      let colored = 0;
      for (let pixel = 0; pixel < pixels.length; pixel += 4) {
        const [red, green, blue, opacity] = pixels.subarray(pixel, pixel + 4);
        alpha.push(opacity > 128 ? 1 : 0);
        if (opacity > 128 && Math.max(red, green, blue) - Math.min(red, green, blue) > 15) colored++;
      }
      if (colored < 8) return false;
      silhouettes.add(alpha.join(""));
    }
    return silhouettes.size === resources.length;
  });
  assert.equal(resourcesWithArt, true);
  await motor.evaluate(() => {
    gamePage.diplomacy.races[0].pinned = true;
    gamePage.render();
  });
  const tradeIcons = frameLocator.locator("#leftColumn .pin-link .trade-icons").first();
  await tradeIcons.waitFor();
  assert.ok(await tradeIcons.evaluate((icons) => {
    const buy = getComputedStyle(icons, "::before").backgroundImage;
    const sell = getComputedStyle(icons, "::after").backgroundImage;
    return buy.includes("data:image/svg+xml") && sell.includes("data:image/svg+xml") && buy !== sell;
  }));
  await motor.evaluate(() => {
    gamePage.diplomacy.races[0].pinned = false;
    gamePage.render();
  });
  const before = await motor.evaluate(() => gamePage.resPool.get("catnip").value);
  await gather.click();
  assert.ok(await motor.evaluate(() => gamePage.resPool.get("catnip").value) > before);
  const tabs = frameLocator.getByRole("navigation", { name: "Sections du jeu" });
  assert.equal(await tabs.locator(".reference-tab-toggle").isVisible(), false);
  assert.equal(await tabs.locator("a.Bonfire").isVisible(), true);
  assert.deepEqual(await frameLocator.locator("[data-camp-action] .btnTitle").evaluateAll((titles) =>
    titles.map((title) => getComputedStyle(title).color)), ["rgb(255, 255, 255)", "rgb(255, 255, 255)"]);
  const sidebar = frameLocator.getByRole("region", { name: "Ressources", exact: true });

  const [resourcesPanel, play, journal] = await Promise.all(["Ressources", "Jeu", "Journal"]
    .map((name) => frameLocator.getByRole("region", { name, exact: true }).boundingBox()));
  assert.ok(resourcesPanel.x + resourcesPanel.width < play.x && play.x + play.width < journal.x);
  assert.ok(Math.abs(play.x + play.width / 2 - 720) < 1);
  assert.ok(play.y > resourcesPanel.y);
  const headers = await motor.evaluate(() => [...document.querySelectorAll("#game > .game-widget")].map((panel) => {
    const header = panel.querySelector(".widget-slot");
    const scroller = panel.querySelector(".tabInner") ?? panel.querySelector(".widget-content");
    const nav = panel.querySelector(".tabsContainer");
    const filler = document.createElement("div");
    filler.style.height = "1500px";
    scroller.append(filler);
    const before = header.getBoundingClientRect();
    const navTop = nav?.getBoundingClientRect().top;
    scroller.scrollTop = 100;
    const after = header.getBoundingClientRect();
    const outside = panel.getBoundingClientRect();
    const fixed = scroller.scrollTop > 0 && before.top === after.top && outside.width - after.width <= 2.1
      && navTop === nav?.getBoundingClientRect().top && getComputedStyle(scroller).scrollbarWidth === "none";
    filler.remove();
    scroller.scrollTop = 0;
    return fixed;
  }));
  assert.deepEqual(headers, [true, true, true]);
  await page.locator(".render-status").waitFor({ state: "hidden" });
  await page.mouse.move(720, 210);
  for (const button of ["middle", "right"]) {
    await page.mouse.down({ button });
    await frameLocator.locator(".reference-scene-input.is-moving").waitFor();
    await page.mouse.move(800, 235, { steps: 4 });
    await page.mouse.up({ button });
    await page.mouse.move(720, 210);
  }
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
  async function restoreViaOptions(source) {
    await motor.evaluate(() => {
      gamePage.bld.get("hut").val = 0;
      gamePage.calendar.year = 0;
      gamePage.science.get("agriculture").researched = false;
    });
    await options.click();
    await frameLocator.locator("#importButton").click();
    await frameLocator.getByLabel("Fichier de sauvegarde AGLLM").setInputFiles({
      name: "AGLLM.txt", mimeType: "text/plain", buffer: Buffer.from(source),
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
  await frameLocator.locator("#leftColumn .resource_iron .resource-name").getByText("fer", { exact: true }).waitFor();
  const resourceAccordion = sidebar.getByRole("button", { name: "Ressources", exact: true });
  await resourceAccordion.press("Space");
  assert.equal(await resourceAccordion.getAttribute("aria-expanded"), "false");
  await resourceAccordion.press("Enter");
  const selection = sidebar.getByRole("button", { name: "Sélection · Ressources" });
  await selection.press("Enter");
  const resourceName = sidebar.locator(".resource_iron .resource-name").first();
  const textSize = () => resourceName.evaluate((name) => {
    const style = getComputedStyle(name);
    return [parseFloat(style.fontSize), parseFloat(getComputedStyle(name, "::before").width), style.whiteSpace];
  });
  const [initialSize] = await textSize();
  await sidebar.getByRole("button", { name: "Taille +" }).press("Enter");
  assert.deepEqual(await textSize(), [initialSize + 1, initialSize + 1, "nowrap"]);
  await sidebar.getByRole("button", { name: "Taille −" }).press("Enter");
  await selection.press("Enter");

  await options.click();
  await frameLocator.locator("#exportButton").click();
  const file = page.waitForEvent("download");
  await frameLocator.locator("#exportToSimpleFile").click();
  const reexported = await readFile(await (await file).path(), "utf8");
  const save = await motor.evaluate((content) => JSON.parse(gamePage.decompressLZData(content)), reexported);
  assert.equal(save.calendar.year, 8);
  assert.equal(save.buildings.find(({ name }) => name === "hut").val, 4);
  assert.equal(save.science.techs.find(({ name }) => name === "agriculture").researched, true);
  await frameLocator.locator("#exportDiv #closeButton").click();
  await frameLocator.locator("#optionsDiv .close").click();
  assert.deepEqual(await restoreViaOptions(reexported), original);

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
  const campCards = await motor.evaluate(async () => {
    const { children, groupContainer } = gamePage.bldTab;
    const orderedBuildings = children.filter((button) => button.opts.building).map((button) => button.domNode);
    const cards = [...groupContainer.querySelectorAll(":scope > [data-building-icon]")];
    const visible = cards.filter((card) => card.getClientRects().length);
    const sizes = new Set(visible.map((card) => {
      const box = card.getBoundingClientRect();
      return `${Math.round(box.width)}×${Math.round(box.height)}`;
    }));
    const pictures = visible.map((card) => card.querySelector(".camp-building-preview img"));
    await Promise.all(pictures.map((picture) => picture.decode()));
    return {
      order: cards.length === orderedBuildings.length && cards.every((card, i) => card === orderedBuildings[i]),
      uniform: visible.length > 1 && sizes.size === 1,
      icons: new Set(pictures.map((picture) => picture.src)).size === pictures.length,
      glow: children.filter((button) => button.opts.building).every((button) =>
        button.domNode.hasAttribute("data-camp-unavailable") === !button.model.enabled),
      actions: visible.every((card) => {
        const toolbar = card.querySelector(".camp-building-actions");
        const center = toolbar.querySelector(".camp-building-primary").getBoundingClientRect();
        const bar = toolbar.getBoundingClientRect();
        return toolbar.querySelectorAll(".camp-building-primary > button").length === 2
          && Math.abs(center.left + center.width / 2 - bar.left - bar.width / 2) < 1
          && [...card.querySelectorAll("[data-camp-native]")].every((control) => toolbar.contains(control))
          && [...card.querySelectorAll("[data-camp-stage]")].every((control) => toolbar.contains(control));
      }),
    };
  });
  assert.deepEqual(campCards, { order: true, uniform: true, icons: true, glow: true, actions: true });
  const previousTheme = await motor.evaluate(() => {
    const theme = gamePage.colorScheme;
    if (!gamePage.unlockedSchemes.includes("factory")) gamePage.unlockedSchemes.push("factory");
    gamePage.toggleScheme("factory");
    return theme;
  });
  await frameLocator.locator("body.scheme_factory").waitFor();
  assert.ok(await accelerator.evaluate((card) => {
    const camp = card.closest(".bldTopContainer");
    const title = card.querySelector(".camp-building-heading .label-content");
    return getComputedStyle(camp).backgroundColor === "rgba(0, 0, 0, 0)"
      && getComputedStyle(camp).boxShadow === "none"
      && getComputedStyle(card).backgroundImage === "none"
      && getComputedStyle(title).color === "rgb(255, 255, 255)";
  }));
  await motor.evaluate((theme) => gamePage.toggleScheme(theme), previousTheme);
  const activate = accelerator.getByRole("button", { name: "Activer des bâtiments", exact: true });
  const deactivate = accelerator.getByRole("button", { name: "Désactiver des bâtiments", exact: true });
  await activate.click();
  await accelerator.getByRole("button", { name: "+5", exact: true }).click();
  await accelerator.getByText("5/8", { exact: true }).waitFor();
  await deactivate.dblclick();
  await accelerator.getByText("4/8", { exact: true }).waitFor();
  await deactivate.click();
  await accelerator.getByRole("link", { name: "−max", exact: true }).click();
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

  await motor.evaluate(() => {
    gamePage.opts.tooltipsInRightColumn = true;
    gamePage.ui.updateOptions();
  });
  const field = frameLocator.getByText(/Champ d'herbe à chat/).first();
  const tooltip = frameLocator.locator("#tooltip[data-floating]");
  await field.hover();
  await tooltip.getByText(/Planter de l'herbe à chat/).waitFor();
  assert.ok(await motor.evaluate(() => {
    const anchor = gamePage.tooltipOwnerDomNode.getBoundingClientRect();
    const tip = document.getElementById("tooltip").getBoundingClientRect();
    return Math.min(Math.abs(tip.left - anchor.right), Math.abs(anchor.left - tip.right),
      Math.abs(tip.top - anchor.bottom), Math.abs(anchor.top - tip.bottom)) <= 5;
  }));
  assert.ok(await tooltip.evaluate((tip) => {
    const style = getComputedStyle(tip);
    return style.backgroundColor === "rgb(21, 40, 32)" && parseFloat(style.borderRadius) >= 8
      && style.scrollbarWidth === "none";
  }));

  const grip = await sidebar.getByRole("button", { name: "Déplacer Ressources" }).boundingBox();
  await page.mouse.move(grip.x + 10, grip.y + 10);
  await page.mouse.down();
  await page.mouse.move(grip.x + play.x - resourcesPanel.x + 35, grip.y + play.y - resourcesPanel.y + 15, { steps: 6 });
  await page.mouse.up();
  const resize = sidebar.getByRole("button", { name: "Redimensionner Ressources" });
  await resize.press("ArrowDown");
  assert.ok(await sidebar.evaluate((widget) => {
    const content = widget.querySelector(".widget-content").getBoundingClientRect();
    return content.height > 40 && widget.contains(widget.ownerDocument.elementFromPoint(content.left + 10, content.top + 10));
  }));

  await page.setViewportSize({ width: 320, height: 740 });
  const campFilter = frameLocator.getByRole("combobox", { name: "Filtrer les bâtiments" });
  await campFilter.selectOption("food");
  assert.equal(await motor.evaluate(() => gamePage.bldTab.activeGroup), "food");
  await campFilter.selectOption("all");
  await field.hover();
  await tooltip.getByText(/Planter de l'herbe à chat/).waitFor();
  const tooltipBounds = await tooltip.boundingBox();
  assert.ok(tooltipBounds.x >= 0 && tooltipBounds.x + tooltipBounds.width <= 320);

  const compactTabs = tabs.getByRole("button", { name: /^Sections du jeu/ });
  await compactTabs.click();
  assert.equal(await compactTabs.getAttribute("aria-expanded"), "true");
  await compactTabs.press("Escape");
  assert.equal(await compactTabs.getAttribute("aria-expanded"), "false");
  async function openMobileTab(id) {
    await compactTabs.click();
    await tabs.locator(`a.${id}`).click();
    assert.equal(await compactTabs.getAttribute("aria-expanded"), "false");
  }
  await motor.evaluate(() => {
    gamePage.science.get("calendar").unlocked = true;
    gamePage.science.get("archery").unlocked = true;
    gamePage.science.getPolicy("liberty").unlocked = true;
    gamePage.resPool.get("science").value = 41;
    gamePage.toggleScheme("factory");
  });
  await openMobileTab("Science");
  const scienceTab = frameLocator.locator(".tabInner.Science");
  const policies = scienceTab.getByRole("button", { name: "Politiques", exact: true });
  await policies.waitFor();
  const calendar = scienceTab.getByText("Calendrier", { exact: true });
  const archery = scienceTab.getByText("Archerie", { exact: true });
  await calendar.waitFor();
  const researchStyle = (label) => label.evaluate((node) => {
    const card = getComputedStyle(node.closest(".btn"));
    return [getComputedStyle(node).color, card.boxShadow, card.borderTopWidth, card.backgroundImage];
  });
  assert.deepEqual((await researchStyle(calendar)).filter((_, i) => i !== 1), ["rgb(255, 255, 255)", "0px", "none"]);
  assert.match((await researchStyle(calendar))[1], /rgba\(255, 255, 255,/);
  assert.deepEqual((await researchStyle(archery)).filter((_, i) => i !== 1), ["rgb(255, 155, 155)", "0px", "none"]);
  assert.match((await researchStyle(archery))[1], /rgba\(255, 113, 113,/);
  await motor.evaluate(() => {
    gamePage.resPool.get("science").value = 10;
    gamePage.ui.update();
  });
  assert.equal((await researchStyle(calendar))[0], "rgb(255, 155, 155)");
  await motor.evaluate(() => {
    gamePage.resPool.get("science").value = 41;
    gamePage.ui.update();
  });
  assert.equal((await researchStyle(calendar))[0], "rgb(255, 255, 255)");
  assert.ok(await policies.evaluate((toggle) => {
    const panel = getComputedStyle(toggle.parentElement);
    return panel.display === "grid" && panel.borderTopWidth === "0px" && panel.boxShadow === "none";
  }));
  const policiesOpen = await policies.getAttribute("aria-expanded");
  await policies.press("Space");
  assert.notEqual(await policies.getAttribute("aria-expanded"), policiesOpen);
  await policies.click();
  assert.equal(await policies.getAttribute("aria-expanded"), policiesOpen);
  await motor.evaluate((theme) => gamePage.toggleScheme(theme), previousTheme);
  await motor.evaluate(() => {
    gamePage.science.get("construction").researched = true;
    gamePage.science.get("mechanization").researched = true;
    gamePage.workshop.getCraft("beam").unlocked = true;
    gamePage.workshop.get("bolas").unlocked = true;
    gamePage.bld.get("factory").val = 1;
    const engineer = gamePage.village.getJob("engineer");
    engineer.unlocked = true;
    gamePage.village.assignJob(engineer, 1);
    gamePage.toggleScheme("factory");
  });
  await openMobileTab("Workshop");
  const workshop = frameLocator.locator(".tabInner.Workshop");
  const crafting = workshop.getByRole("button", { name: "Artisanat", exact: true });
  await crafting.waitFor();
  if (await crafting.getAttribute("aria-expanded") === "false") await crafting.click();
  await crafting.press("Space");
  assert.equal(await crafting.getAttribute("aria-expanded"), "false");
  await crafting.click();
  const beam = workshop.locator(".workshop-craft").filter({ hasText: "Poutre de bois" });
  const assign = beam.getByRole("button", { name: "Affecter 1 · Poutre de bois" });
  const unassign = beam.getByRole("button", { name: "Retirer 1 · Poutre de bois" });
  const initialWood = await motor.evaluate(() => gamePage.resPool.get("wood").value);
  assert.equal((await researchStyle(beam.locator(".btnTitle")))[0], "rgb(255, 155, 155)");
  assert.equal(await unassign.isDisabled(), true);
  await assign.click();
  assert.equal(await motor.evaluate(() => gamePage.workshop.getCraft("beam").value), 1);
  assert.equal(await motor.evaluate(() => gamePage.resPool.get("wood").value), initialWood);
  await workshop.locator(".workshop-flow-production").getByText("poutres", { exact: true }).waitFor();
  await workshop.locator(".workshop-flow-consumption").getByText("bois", { exact: true }).waitFor();
  await unassign.click();
  assert.equal(await motor.evaluate(() => gamePage.workshop.getCraft("beam").value), 0);
  assert.equal(await workshop.locator(".workshop-flow-rows dt").count(), 0);
  await motor.evaluate(() => {
    gamePage.resPool.get("wood").value = 200;
    gamePage.ui.update();
  });
  assert.equal((await researchStyle(beam.locator(".btnTitle")))[0], "rgb(255, 255, 255)");
  await motor.evaluate(({ theme, wood }) => {
    const engineer = gamePage.village.sim.kittens.find((kitten) => kitten.job === "engineer");
    gamePage.village.unassignJob(engineer);
    gamePage.resPool.get("wood").value = wood;
    gamePage.toggleScheme(theme);
  }, { theme: previousTheme, wood: initialWood });
  const tradeStocks = await motor.evaluate(() => {
    const stocks = Object.fromEntries(["minerals", "gold", "manpower", "wood"].map((id) => [id, gamePage.resPool.get(id).value]));
    gamePage.diplomacy.get("lizards").unlocked = true;
    gamePage.diplomacy.get("sharks").unlocked = true;
    gamePage.diplomacyTab.visible = true;
    gamePage.resPool.get("minerals").value = 0;
    gamePage.toggleScheme("factory");
    gamePage.render();
    return stocks;
  });
  await openMobileTab("Trade");
  const commerce = frameLocator.locator(".tabInner.Trade");
  const lizards = frameLocator.getByRole("button", { name: /^Lézards/ });
  const lizardPanel = commerce.locator(".panelContainer").filter({ has: lizards });
  const sendCaravan = lizardPanel.getByText("Expédier caravane", { exact: true });
  await commerce.getByRole("link", { name: "Tout réduire", exact: true }).click();
  assert.equal(await lizards.getAttribute("aria-expanded"), "false");
  await lizards.press("Space");
  assert.equal(await lizards.getAttribute("aria-expanded"), "true");
  await lizardPanel.locator(".trade-offers-buys").getByText("minerai", { exact: true }).waitFor();
  await lizardPanel.locator(".trade-offers-sells").getByText("bois", { exact: true }).waitFor();
  assert.deepEqual((await researchStyle(sendCaravan)).filter((_, i) => i !== 1), ["rgb(255, 155, 155)", "0px", "none"]);
  assert.match((await researchStyle(sendCaravan))[1], /rgba\(255, 113, 113,/);
  assert.ok(await lizardPanel.evaluate((panel) => {
    const style = getComputedStyle(panel);
    return style.backgroundColor === "rgba(0, 0, 0, 0)" && style.boxShadow === "none";
  }));
  await motor.evaluate(() => {
    const race = gamePage.diplomacy.get("lizards");
    gamePage.resPool.get("minerals").value = race.buys[0].val * gamePage.diplomacy.getTradeVolume();
    gamePage.resPool.get("gold").value = gamePage.diplomacy.getGoldCost();
    gamePage.resPool.get("manpower").value = gamePage.diplomacy.getManpowerCost();
    gamePage.ui.update();
  });
  assert.equal((await researchStyle(sendCaravan))[0], "rgb(255, 255, 255)");
  assert.match((await researchStyle(sendCaravan))[1], /rgba\(255, 255, 255,/);
  await sendCaravan.click();
  assert.equal(await motor.evaluate(() => gamePage.resPool.get("minerals").value), 0);
  await motor.evaluate(({ stocks, theme }) => {
    for (const [id, value] of Object.entries(stocks)) gamePage.resPool.get(id).value = value;
    gamePage.toggleScheme(theme);
  }, { stocks: tradeStocks, theme: previousTheme });
  await openMobileTab("Village");
  await motor.evaluate(() => gamePage.toggleScheme("factory"));
  await frameLocator.locator("body.scheme_factory").waitFor();
  const woodcutter = frameLocator.locator('.village-job-card[data-job="woodcutter"]');
  await woodcutter.locator(".village-job-picture").waitFor();
  assert.ok(await woodcutter.locator(".village-job-picture").evaluate((image) => image.decode().then(() => image.naturalWidth > 0)));
  const jobs = frameLocator.getByRole("button", { name: "Emplois", exact: true });
  await page.mouse.move(0, 0);
  assert.ok(await jobs.evaluate((toggle) => {
    const title = toggle.nextElementSibling;
    return [toggle.parentElement, toggle, title].every((node) => {
      const style = getComputedStyle(node);
      return style.borderTopWidth === "0px" && style.boxShadow === "none"
        && style.backgroundColor === "rgba(0, 0, 0, 0)";
    }) && Math.abs(toggle.getBoundingClientRect().width - title.getBoundingClientRect().width) < 1
      && getComputedStyle(title, "::after").backgroundImage.includes("data:image/svg+xml");
  }));
  await jobs.press("Space");
  assert.equal(await jobs.getAttribute("aria-expanded"), "false");
  await jobs.click();
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
  const advancedOptions = await motor.evaluate(() => {
    const showQuantities = gamePage.opts.showNonApplicableButtons;
    gamePage.opts.showNonApplicableButtons = true;
    for (const tab of [gamePage.religionTab, gamePage.spaceTab, gamePage.timeTab]) tab.visible = true;
    Object.assign(gamePage.bld.get("ziggurat"), { val: 1, on: 1, unlocked: true });
    gamePage.resPool.get("unicorns").value = 3000;
    gamePage.resPool.get("temporalFlux").value = 20;
    gamePage.space.getProgram("orbitalLaunch").unlocked = true;
    Object.assign(gamePage.space.getPlanet("moon"), { unlocked: true, reached: true });
    Object.assign(gamePage.space.getBuilding("moonOutpost"), { val: 2, on: 2, unlocked: true, togglable: true });
    gamePage.workshop.get("chronoforge").researched = true;
    gamePage.render();
    return showQuantities;
  });
  async function checkAdvancedAccordion(id, name) {
    await openMobileTab(id);
    const section = frameLocator.locator(`.tabInner.${id}`);
    const toggle = section.getByRole("button", { name, exact: true });
    await toggle.waitFor();
    if (await toggle.getAttribute("aria-expanded") === "false") await toggle.click();
    await toggle.press("Space");
    assert.equal(await toggle.getAttribute("aria-expanded"), "false");
    await toggle.click();
    assert.equal(await toggle.getAttribute("aria-expanded"), "true");
    assert.ok(await toggle.evaluate((node) => {
      const style = getComputedStyle(node.parentElement);
      return style.borderTopWidth === "0px" && style.boxShadow === "none" && style.backgroundImage === "none";
    }));
    return section;
  }
  const religionTab = await checkAdvancedAccordion("Religion", "Ziggourats");
  const sacrificeCard = religionTab.locator(".btn.modern").filter({ hasText: "Sacrifier les licornes" });
  assert.equal((await researchStyle(sacrificeCard.locator(".btnTitle")))[0], "rgb(255, 255, 255)");
  const sacrificeLinks = sacrificeCard.locator(".btnContent a:visible");
  assert.ok(await sacrificeLinks.count() > 0);
  assert.equal(await sacrificeLinks.first().evaluate((link) => getComputedStyle(link).borderTopWidth), "0px");
  const spaceTab = await checkAdvancedAccordion("Space", "Lune de sang");
  const moonBase = spaceTab.locator(".btn.modern").filter({ hasText: "Avant-poste lunaire" });
  const bulkRemove = moonBase.getByRole("button", { name: /Quantités.* · -$/ });
  await bulkRemove.click();
  await moonBase.locator(".reference-child-popover:popover-open").getByRole("link", { name: "-25", exact: true }).click();
  assert.equal(await motor.evaluate(() => gamePage.space.getBuilding("moonOutpost").on), 0);
  const timeTab = await checkAdvancedAccordion("Time", "Temps");
  const acceleration = timeTab.locator(".btn.modern").filter({ hasText: "Tempus Fugit" });
  await acceleration.locator("a.fugit-off").click();
  assert.equal(await motor.evaluate(() => gamePage.time.isAccelerated), true);
  await motor.evaluate((showQuantities) => {
    gamePage.time.isAccelerated = false;
    gamePage.opts.showNonApplicableButtons = showQuantities;
  }, advancedOptions);
  await motor.evaluate((theme) => gamePage.toggleScheme(theme), previousTheme);
  await openMobileTab("Bonfire");

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
