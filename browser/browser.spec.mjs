import assert from "node:assert/strict";
import { test } from "node:test";
import { chromium } from "playwright-core";
import { runLifecycle, unusedPort } from "../test/fixture.mjs";
import { resourceIcons } from "../src/resource-icons.js";
import { buildingIcons } from "../src/building-icons.js";
import { illustration } from "../src/illustration.js";
import { tabArt } from "../src/tab-art.js";

test("l’interface native responsive pilote le monde 3D et restaure la sauvegarde", { timeout: 60000 }, async (t) => {
  const port = await unusedPort();
  const url = `http://127.0.0.1:${port}/`;
  await runLifecycle("start", port);
  t.after(() => runLifecycle("stop", port));

  const browser = await chromium.launch({
    channel: process.env.KGLLM_TEST_BROWSER || "chrome",
    headless: true,
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
  });
  t.after(() => browser.close());
  const context = await browser.newContext({ viewport: { width: 1440, height: 980 }, locale: "en-US" });
  await context.route("**/*", (route) => {
    return new URL(route.request().url()).origin === new URL(url).origin ? route.continue() : route.abort();
  });

  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(url);
  const navbar = page.getByRole("navigation", { name: "Navigation KGLLM" });
  await navbar.getByText("Partie en cours", { exact: true }).waitFor({ state: "attached" });
  const info = navbar.getByRole("button", { name: "Infos", exact: true });
  assert.equal(await info.locator('img[src^="data:image/svg+xml"]').count(), 1);
  const popover = navbar.getByRole("region", { name: "Informations de la partie" });
  for (const label of ["Jeu", "Ressources", "Journal", "DEV"]) {
    assert.equal(await navbar.getByRole("button", { name: label, exact: true }).count(), 0);
  }
  assert.equal(await popover.isVisible(), false);
  await info.hover();
  await popover.getByText(/^FPS \d/).waitFor();
  assert.ok(await popover.locator('.information-row img[src^="data:image/svg+xml"]').count() >= 3);
  const fpsDescription = popover.getByText("Temps de calcul d’un tick du jeu.", { exact: true });
  assert.equal(await fpsDescription.isVisible(), false);
  await popover.getByText("Performances", { exact: true }).hover();
  await fpsDescription.waitFor({ state: "visible" });
  await page.keyboard.press("Escape");
  await popover.waitFor({ state: "hidden" });
  const game = page.frame({ url: `${url}jeu/` });
  assert.ok(game);
  const catalog = await game.evaluate(() => ({
    resources: window.gamePage.resPool.resources.map((resource) => resource.name),
    buildings: window.gamePage.bld.buildingsData.map((building) => building.name),
  }));
  assert.deepEqual(catalog.resources.filter((name) => !Object.hasOwn(resourceIcons, name)), []);
  assert.deepEqual(catalog.buildings.filter((name) => !Object.hasOwn(buildingIcons, name)), []);
  assert.equal(new Set(Object.values(resourceIcons)).size, Object.keys(resourceIcons).length);
  assert.equal(new Set(Object.values(buildingIcons)).size, Object.keys(buildingIcons).length);
  const artworks = [...Object.entries(resourceIcons), ...Object.entries(buildingIcons)]
    .map(([name, path]) => illustration(name, path));
  assert.equal(new Set(artworks).size, artworks.length);
  assert.deepEqual(await page.evaluate(async (items) => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 24;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    const failures = [];
    for (const [index, svg] of items.entries()) {
      const image = new Image(24, 24);
      image.src = `data:image/svg+xml,${encodeURIComponent(svg)}`;
      await image.decode();
      context.clearRect(0, 0, 24, 24);
      context.drawImage(image, 0, 0, 24, 24);
      const { data } = context.getImageData(0, 0, 24, 24);
      let transparent = false;
      let colored = false;
      for (let pixel = 0; pixel < data.length; pixel += 4) {
        transparent ||= data[pixel + 3] === 0;
        colored ||= data[pixel + 3] === 255 && data[pixel] !== data[pixel + 1];
      }
      if (!transparent || !colored) failures.push(index);
    }
    return failures;
  }, artworks), []);
  assert.match(await navbar.innerText(), /KGLLM.*v0\.1/s);
  assert.equal(await game.locator("#leftColumn #headerLinks").count(), 0);
  assert.equal(await game.locator("#topBar").isVisible(), false);
  assert.equal(await game.locator("#footerLinks").isVisible(), false);
  for (const label of ["Jeu", "Ressources", "Journal"]) {
    await game.getByRole("button", { name: `Réduire ${label}`, exact: true }).click();
    const expand = game.getByRole("button", { name: `Agrandir ${label}`, exact: true });
    assert.equal(await expand.getAttribute("aria-expanded"), "false");
    await expand.click();
  }
  for (const [label, id] of [["Jeu", "#midColumn"], ["Ressources", "#leftColumn"], ["Journal", "#rightColumn"]]) {
    const widget = game.locator(id);
    const resize = game.getByRole("button", { name: `Redimensionner ${label}`, exact: true });
    const beforeSize = await widget.boundingBox();
    await resize.press("ArrowRight");
    await resize.press("ArrowDown");
    const afterSize = await widget.boundingBox();
    assert.ok(afterSize.width > beforeSize.width && afterSize.height > beforeSize.height, label);
    await resize.press("ArrowLeft");
    await resize.press("ArrowUp");
  }
  const resizeGame = game.getByRole("button", { name: "Redimensionner Jeu", exact: true });
  const gamePanel = game.locator("#midColumn");
  const initialSize = await gamePanel.boundingBox();
  const resizeOrigin = await resizeGame.boundingBox();
  await page.mouse.move(resizeOrigin.x + 12, resizeOrigin.y + 12);
  await page.mouse.down();
  await page.mouse.move(resizeOrigin.x + 47, resizeOrigin.y + 37, { steps: 5 });
  await page.mouse.up();
  const resizedGame = await gamePanel.boundingBox();
  assert.ok(resizedGame.width > initialSize.width && resizedGame.height > initialSize.height);
  await page.setViewportSize({ width: 1439, height: 980 });
  await game.waitForFunction(() => !document.getElementById("midColumn").hasAttribute("data-resized"));
  const grip = game.getByRole("button", { name: "Déplacer Jeu", exact: true });
  assert.equal(await grip.locator('img[src^="data:image/svg+xml"]').count(), 2);
  const start = await grip.boundingBox();
  await page.mouse.move(start.x + 12, start.y + 12);
  await page.mouse.down();
  await page.mouse.move(start.x + 52, start.y - 28, { steps: 5 });
  await page.mouse.up();
  const moved = await grip.boundingBox();
  assert.ok(moved.x > start.x && moved.y < start.y);
  assert.equal(await game.evaluate(() => getComputedStyle(document.body).backgroundColor), "rgba(0, 0, 0, 0)");
  for (const id of ["#leftColumn", "#midColumn", "#rightColumn"]) {
    assert.ok(await game.locator(id).isVisible());
  }
  await game.getByText("Gather catnip", { exact: true }).click();
  assert.equal(await game.locator("#midColumnViewport").isVisible(), false);
  const card = game.locator(".btn.modern").filter({ hasText: "Gather catnip" });
  const hint = game.locator("#tooltip");
  async function checkTooltip() {
    await hint.waitFor({ state: "visible" });
    const geometry = await game.evaluate(() => {
      const tooltip = document.getElementById("tooltip");
      const hint = tooltip.getBoundingClientRect();
      const owner = window.gamePage.tooltipOwnerDomNode.getBoundingClientRect();
      return {
        fits: hint.left >= 0 && hint.top >= 0 && hint.right <= innerWidth && hint.bottom <= innerHeight,
        gap: Math.max(hint.left - owner.right, owner.left - hint.right, hint.top - owner.bottom, owner.top - hint.bottom),
      };
    });
    assert.ok(geometry.fits && geometry.gap >= 5 && geometry.gap <= 12, JSON.stringify(geometry));
  }
  await card.hover();
  await checkTooltip();
  await card.press("Space");
  await checkTooltip();
  assert.ok(await hint.evaluate((tooltip) => tooltip === document.activeElement));
  await hint.press("Escape");
  await hint.waitFor({ state: "hidden" });
  assert.ok(await game.locator(".tabsContainer a.activeTab").evaluate((tab) =>
    getComputedStyle(tab, "::before").backgroundImage.includes("data:image/svg+xml")));
  assert.ok(await game.evaluate(() => window.gamePage.resPool.get("catnip").value) > 0);
  await navbar.getByRole("button", { name: "Sauvegarder" }).click();
  await navbar.getByText("Saved!", { exact: true }).waitFor({ state: "attached" });
  assert.ok(await game.evaluate(() => localStorage.getItem("com.nuclearunicorn.kittengame.savedata")));
  const historyBeforeOptions = await page.evaluate(() => history.length);
  await navbar.getByRole("button", { name: "Options" }).click();
  await game.locator("#optionsDiv").waitFor({ state: "visible" });
  await game.locator("#optionsDiv #dialogClose").click();
  const login = navbar.getByRole("button", { name: "Connexion", exact: true });
  await login.click();
  await game.locator(".login-popup").waitFor({ state: "visible" });
  await login.click();
  await game.locator(".login-popup").waitFor({ state: "hidden" });
  assert.equal(await page.evaluate(() => history.length), historyBeforeOptions);
  await game.locator("#pauseBtn").click();
  await navbar.getByText("Partie en pause", { exact: true }).waitFor({ state: "attached" });

  const duplicate = await context.newPage();
  await duplicate.goto(url);
  await duplicate.locator("main").getByText("Partie ouverte dans un autre onglet", { exact: true }).waitFor();
  assert.equal(await duplicate.locator("iframe").count(), 0);
  await duplicate.close();
  await page.bringToFront();

  const canvas = page.getByLabel("Scène 3D du village");
  const embeddedGame = page.locator("iframe");
  const offset = await embeddedGame.boundingBox();
  const openTerrain = await game.evaluate(() => {
    const surface = document.querySelector(".kgllm-scene-input");
    const x = Math.floor(innerWidth / 2);
    for (let y = 70; y < innerHeight / 2; y += 10) {
      if (document.elementFromPoint(x, y) === surface && document.elementFromPoint(x + 64, y) === surface) {
        return { x, y };
      }
    }
    return null;
  });
  assert.ok(openTerrain, "Le décor doit être accessible entre les widgets.");
  const terrainX = offset.x + openTerrain.x;
  const terrainY = offset.y + openTerrain.y;
  await page.mouse.move(terrainX, terrainY);
  const beforeDrag = await canvas.screenshot();
  await page.mouse.down();
  await page.mouse.move(terrainX + 64, terrainY + 8, { steps: 5 });
  await page.mouse.up();
  const afterDrag = await canvas.screenshot();
  assert.notDeepEqual(afterDrag, beforeDrag);
  await page.mouse.wheel(0, -180);
  assert.notDeepEqual(await canvas.screenshot(), afterDrag);
  assert.ok(await embeddedGame.isVisible());
  await page.getByRole("button", { name: "Caméra 3D" }).click();
  assert.equal(await page.locator("iframe").isVisible(), false);
  await page.waitForFunction(() => document.querySelector("canvas").tabIndex === 0);
  const before = await canvas.screenshot();
  await game.evaluate(() => {
    const game = window.gamePage;
    Object.assign(game.calendar, { year: 7, day: 24, season: 3, weather: "cold" });
    game.bld.get("field").val = 9;
    game.bld.get("hut").val = 4;
    game.resPool.get("catnip").value = 48.5;
  });
  await navbar.getByText("An 8 · Jour 25", { exact: true }).waitFor({ state: "attached" });
  await navbar.getByText("Hiver", { exact: true }).waitFor({ state: "attached" });
  const changed = await canvas.screenshot();
  assert.notDeepEqual(changed, before);
  await page.getByRole("button", { name: "Zoom avant" }).click();
  assert.notDeepEqual(await canvas.screenshot(), changed);
  await page.getByRole("button", { name: "Recentrer" }).click();
  await page.keyboard.press("Escape");
  await game.locator("#midColumn").waitFor({ state: "visible" });

  const panelNavigation = page.getByRole("navigation", { name: "Panneaux de jeu" });
  for (const width of [280, 320, 390, 481, 560, 561, 620, 621, 680, 681, 768, 800, 801, 840, 841, 1024, 1050, 1051, 1440]) {
    const height = width === 800 ? 390 : 844;
    await page.setViewportSize({ width, height });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width, `Page à ${width} px`);
    assert.equal(await game.evaluate(() => document.documentElement.scrollWidth), width, `Jeu à ${width} px`);
    assert.ok(await navbar.evaluate((nav) => nav.scrollWidth <= nav.clientWidth), `Barre principale à ${width} px`);
    assert.equal(await panelNavigation.isVisible(), width <= 1050, `Navigation des panneaux à ${width} px`);
    await info.click();
    const bounds = await popover.boundingBox();
    assert.ok(bounds && bounds.x >= 0 && bounds.x + bounds.width <= width && bounds.y + bounds.height <= height,
      `Menu Infos à ${width} × ${height} px`);
    await page.keyboard.press("Escape");
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await card.hover();
  await checkTooltip();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 390);
  assert.equal(await game.evaluate(() => document.documentElement.scrollWidth), 390);
  await page.getByRole("button", { name: "Ressources", exact: true }).click();
  await game.locator("#leftColumn").waitFor({ state: "visible" });
  assert.equal(await game.locator("#leftColumn .res-toolbar .tooltip-block:has(> .question-mark)").isVisible(), false);
  assert.ok(await game.getByTitle("Resource settings", { exact: true }).isVisible());
  const resourcesWidget = game.locator("#leftColumn");
  const resourceResizer = game.getByRole("button", { name: "Redimensionner Ressources", exact: true });
  const mobileWidget = await resourcesWidget.boundingBox();
  await resourceResizer.press("ArrowLeft");
  const smallerWidget = await resourcesWidget.boundingBox();
  assert.ok(smallerWidget.width < mobileWidget.width && smallerWidget.x >= 0);
  await resourceResizer.press("ArrowRight");
  assert.ok(await game.locator("#leftColumn").evaluate((panel) => panel.scrollWidth <= panel.clientWidth + 1));
  await page.setViewportSize({ width: 320, height: 844 });
  await game.evaluate(() => {
    const game = window.gamePage;
    const wood = game.resPool.get("wood");
    wood.unlocked = true;
    wood.value = 9876543210123;
    game.bld.get("field").unlocked = true;
    game.render();
  });
  const woodValue = game.locator(".res-row").filter({ hasText: "wood" }).locator(".resAmount");
  assert.ok(await game.locator(".resource_wood .resource-name").evaluate((name) =>
    getComputedStyle(name, "::before").backgroundImage.includes("data:image/svg+xml")));
  assert.ok(await woodValue.evaluate((value) => {
    const text = document.createRange();
    text.selectNodeContents(value);
    const lines = Array.from(text.getClientRects(), (rect) => rect.top);
    return lines.length > 0 && new Set(lines).size === 1 && getComputedStyle(value).whiteSpace === "nowrap";
  }));
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await game.locator("#midColumn").isVisible(), false);
  await page.getByRole("button", { name: "Journal", exact: true }).click();
  await game.locator("#rightColumn").waitFor({ state: "visible" });
  assert.ok(await game.locator("#rightColumn").evaluate((panel) => panel.scrollWidth <= panel.clientWidth + 1));
  assert.equal(await game.locator("#leftColumn").isVisible(), false);
  await page.getByRole("button", { name: "Jeu", exact: true }).click();
  await game.getByText("Gather catnip", { exact: true }).waitFor({ state: "visible" });
  assert.equal(await game.locator(".Bonfire .bldGroupContainer").evaluate((group) => getComputedStyle(group).display), "grid");
  assert.equal(await game.locator('[data-camp-action="gather"]').evaluate((button) => getComputedStyle(button).order), "0");
  assert.ok(await game.locator('[data-building-icon="field"] .btnTitle').evaluate((title) =>
    getComputedStyle(title, "::before").backgroundImage.includes("data:image/svg+xml")));
  const field = game.locator('[data-building-icon="field"]');
  assert.equal(await field.locator(".camp-building-actions button").count(), 2);
  await field.getByText("(9)", { exact: true }).and(field.locator(".camp-building-count")).waitFor();
  const information = field.getByRole("button", { name: "Informations sur Catnip Field", exact: true });
  await information.press("Enter");
  const fieldSheet = page.getByRole("dialog", { name: "Catnip Field" });
  await fieldSheet.getByText(/Plant some catnip to grow in the village/).waitFor();
  assert.ok(await fieldSheet.locator("img.building-info-picture").evaluate(async (image) => {
    await image.decode();
    return image.naturalWidth > 0;
  }));
  await page.keyboard.press("Escape");
  await fieldSheet.waitFor({ state: "hidden" });
  assert.equal(await game.evaluate(() => window.gamePage.bld.get("field").val), 9);
  const eye = field.getByRole("button", { name: "Observer Catnip Field", exact: true });
  await eye.click();
  await page.locator(".camera-subject").getByText("Catnip Field", { exact: true }).waitFor();
  assert.equal(await embeddedGame.isVisible(), false);
  const firstObservation = await canvas.screenshot();
  await page.getByRole("button", { name: "Revenir au jeu" }).click();
  await eye.click();
  await page.locator(".camera-subject").getByText("Catnip Field", { exact: true }).waitFor();
  assert.notDeepEqual(await canvas.screenshot(), firstObservation);
  await page.keyboard.press("Escape");
  await eye.waitFor();
  assert.equal(await game.evaluate(() => window.gamePage.bld.get("field").val), 9);
  const camp = game.locator("#midColumn");
  const refine = game.getByText("Refine catnip", { exact: true });
  for (const mobileWidth of [390, 320]) {
    await page.setViewportSize({ width: mobileWidth, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), mobileWidth);
    assert.ok(await navbar.evaluate((nav) => nav.scrollWidth <= nav.clientWidth));
    await camp.evaluate((panel) => {
      if (panel.scrollWidth > panel.clientWidth + 1) {
        throw new Error("Le campement déborde horizontalement.");
      }
    });
    const bounds = await refine.boundingBox();
    assert.ok(bounds && bounds.x >= 0 && bounds.x + bounds.width <= mobileWidth);
  }
  await info.click();
  await popover.waitFor({ state: "visible" });
  const mobilePopover = await popover.boundingBox();
  assert.ok(mobilePopover.x >= 0 && mobilePopover.x + mobilePopover.width <= 320);
  await info.click();
  await popover.waitFor({ state: "hidden" });
  await page.setViewportSize({ width: 390, height: 844 });
  await navbar.getByRole("button", { name: "Options" }).click();
  const dialog = game.locator("#optionsDiv");
  await dialog.waitFor({ state: "visible" });
  const { x, width } = await dialog.boundingBox();
  assert.ok(x >= 0 && x + width <= 390);
  await dialog.locator("#dialogClose").click();

  await runLifecycle("stop", port);
  await page.locator("main").getByText("KGLLM est arrêté", { exact: true }).waitFor();
  assert.equal(await page.locator("iframe").count(), 0);
  assert.equal(await page.locator("canvas").count(), 0);

  await runLifecycle("start", port);
  await page.reload();
  await navbar.getByText("Partie en cours", { exact: true }).waitFor({ state: "attached" });
  const restored = await page.frame({ url: `${url}jeu/` }).evaluate(() => ({
    catnip: window.gamePage.resPool.get("catnip").value,
    fields: window.gamePage.bld.get("field").val,
    huts: window.gamePage.bld.get("hut").val,
    year: window.gamePage.calendar.year,
  }));
  assert.ok(restored.catnip >= 48.5);
  assert.equal(restored.fields, 9);
  assert.equal(restored.huts, 4);
  assert.equal(restored.year, 7);
  const menus = page.frame({ url: `${url}jeu/` });
  const submenus = await menus.evaluate(() => {
    const game = window.gamePage;
    game.isPaused = true;
    game.unlockAll();
    Object.assign(game.bld.get("ziggurat"), { val: 1, on: 1, unlocked: true });
    Object.assign(game.bld.get("smelter"), { val: 3, on: 1, unlocked: true });
    Object.assign(game.bld.get("steamworks"), { val: 1, on: 1, unlocked: true, isAutomationEnabled: true });
    Object.assign(game.bld.get("workshop"), { val: 0, on: 0, unlocked: true });
    game.render();
    return game.tabs.map((tab) => tab.tabId);
  });
  assert.deepEqual(submenus.filter((id) => !Object.hasOwn(tabArt, id)), []);
  await page.setViewportSize({ width: 1440, height: 980 });
  const smelter = menus.locator('[data-building-icon="smelter"]');
  const workshop = menus.locator('[data-building-icon="workshop"]');
  assert.ok(await workshop.locator('[data-camp-tool="eye"]').isDisabled());
  assert.ok(await workshop.locator('[data-camp-tool="info"]').isEnabled());
  await workshop.getByText("(0)", { exact: true }).and(workshop.locator(".camp-building-count")).waitFor();
  await smelter.getByText("(1/3)", { exact: true }).and(smelter.locator(".camp-building-count")).waitFor();
  const expectedBuildings = await menus.evaluate(() => window.gamePage.bldTab.children.filter((button) => button.opts?.building && button.model.visible).length);
  const visibleBuildings = menus.locator(".Bonfire [data-building-icon]:visible");
  assert.equal(await visibleBuildings.count(), expectedBuildings);
  for (const tool of ["eye", "info"]) {
    assert.equal(await visibleBuildings.locator(`[data-camp-tool="${tool}"]:visible`).count(), expectedBuildings);
  }
  const add = smelter.locator(".add1Link");
  await add.hover();
  const batch = smelter.getByRole("link", { name: "+25", exact: true });
  await batch.waitFor({ state: "visible" });
  await batch.click();
  assert.equal(await menus.evaluate(() => window.gamePage.bld.get("smelter").on), 3);
  await smelter.getByText("(3)", { exact: true }).and(smelter.locator(".camp-building-count")).waitFor();
  await smelter.locator(".off1Link").click();
  assert.equal(await menus.evaluate(() => window.gamePage.bld.get("smelter").on), 2);
  await smelter.getByText("(2/3)", { exact: true }).and(smelter.locator(".camp-building-count")).waitFor();
  const automation = menus.locator('[data-building-icon="steamworks"] .auto-on');
  await automation.click();
  assert.equal(await menus.evaluate(() => window.gamePage.bld.get("steamworks").isAutomationEnabled), false);
  await menus.locator(".tabsContainer a.Science").click();
  assert.equal(await menus.evaluate(() => window.gamePage.ui.activeTabId), "Science");
  assert.equal(await menus.locator(".tabsContainer a.Science").getAttribute("aria-current"), "page");
  const chooser = menus.getByRole("combobox", { name: "Sous-menu du jeu" });
  const resizeMenu = menus.getByRole("button", { name: "Redimensionner Jeu", exact: true });
  for (let step = 0; step < 22 && !await chooser.isVisible(); step += 1) {
    await resizeMenu.press("ArrowLeft");
  }
  assert.ok(await chooser.isVisible());
  assert.equal(await chooser.inputValue(), "Science");
  await page.setViewportSize({ width: 320, height: 844 });
  for (const id of submenus) {
    await chooser.selectOption(id);
    assert.equal(await menus.evaluate(() => window.gamePage.ui.activeTabId), id);
    const banner = menus.locator(`.tabInner.${id} .kgllm-tab-banner`);
    assert.equal(await banner.locator("img").getAttribute("src"), tabArt[id].image);
    assert.ok(await banner.locator("img").evaluate((image) => image.decode().then(() => image.naturalWidth > 0)));
    const width = await menus.locator("#midColumn").evaluate((widget) => [widget.scrollWidth, widget.clientWidth]);
    assert.ok(width[0] <= width[1] + 1, `${id} déborde à 320 px (${width.join("/")})`);
    if (id === "Religion") {
      const ziggurats = menus.getByRole("button", { name: "Ziggurats", exact: true });
      const sun = menus.getByRole("button", { name: "Order of the Sun", exact: true });
      assert.equal(await ziggurats.getAttribute("aria-expanded"), "true");
      await menus.locator(".panelContainer > .title").getByText("Ziggurats", { exact: true }).click();
      assert.equal(await ziggurats.getAttribute("aria-expanded"), "false");
      assert.equal(await sun.getAttribute("aria-expanded"), "true");
      await ziggurats.press("Space");
      assert.equal(await ziggurats.getAttribute("aria-expanded"), "true");

      await menus.evaluate(() => {
        const title = [...document.querySelectorAll(".Religion .panelContainer > .title")]
          .find((heading) => heading.textContent === "Ziggurats");
        const Panel = window.com.nuclearunicorn.game.ui.Panel;
        new Panel("Nested section").render(title.parentElement.querySelector(":scope > .container"));
      });
      const nested = menus.getByRole("button", { name: "Nested section", exact: true });
      await nested.press("Space");
      assert.equal(await nested.getAttribute("aria-expanded"), "false");
      await ziggurats.press("Space");
      assert.equal(await nested.isVisible(), false);
      await ziggurats.press("Space");
      assert.equal(await nested.getAttribute("aria-expanded"), "false");
    }
    if (id === "Stats") {
      assert.ok(await menus.locator(".statTable").first().evaluate((table) =>
        getComputedStyle(table).fontVariantNumeric === "tabular-nums"));
    }
  }
  assert.deepEqual(errors, []);
  if (process.platform === "win32") {
    await page.close();
    const unrelated = await context.newPage();
    const popup = unrelated.waitForEvent("popup");
    await unrelated.evaluate((address) => { window.open(address, "_blank"); }, url);
    const launchedGame = await popup;
    await launchedGame.getByText("Partie en cours", { exact: true }).waitFor({ state: "attached" });
    const closed = launchedGame.waitForEvent("close", { timeout: 8000 });
    await runLifecycle("stop", port, true);
    await closed;
    assert.equal(unrelated.isClosed(), false);
  }
});
