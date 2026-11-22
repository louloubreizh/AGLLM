import { control, element, setText, textFromMarkup, villageIcon, villageLocale } from "./village-ui.js";

const sections = new WeakMap();
const commands = [
  { key: "huntBtn", icon: "manpower", fr: ["Chasse", "Envoyer"], en: ["Hunting", "Send"], links: ["huntFifthHref", "huntHalfHref", "huntAllHref"] },
  { key: "festivalBtn", icon: "fire", fr: ["Festival", "Organiser"], en: ["Festival", "Hold"], links: ["x10", "x100"] },
  { key: "optimizeJobsBtn", icon: "tools", fr: ["Répartition des emplois", "Optimiser"], en: ["Job distribution", "Optimize"] },
  { key: "promoteKittensBtn", icon: "star", fr: ["Promotions", "Promouvoir"], en: ["Promotions", "Promote"] },
  { key: "redeemGiftBtn", icon: "elderBox", fr: ["Cadeau", "Ouvrir"], en: ["Gift", "Unwrap"] },
];

function metric(document, label, icon) {
  const card = element(document, "div", "village-management-metric");
  const image = element(document, "div", "village-command-icon");
  image.append(villageIcon(document, icon));
  const details = element(document, "dl", "village-metric-data");
  const value = element(document, "dd", "village-metric-value");
  details.append(element(document, "dt", "village-metric-label", label), value);
  card.append(image, details);
  return { card, value };
}

function createCommand(document, game, button, config, language, refresh) {
  const [name, action] = config[language];
  const card = element(document, "article", "village-command");
  card.dataset.command = config.key;
  const head = element(document, "div", "village-command-heading");
  const image = element(document, "div", "village-command-icon");
  image.append(villageIcon(document, config.icon));
  head.append(image, element(document, "h3", "village-command-name", name));
  const description = element(document, "p", "village-command-description", textFromMarkup(document, button.model.description));
  description.hidden = !description.textContent;
  const prices = element(document, "ul", "village-command-prices");
  const actions = element(document, "div", "village-command-actions");
  const primary = control(document, "village-control", action, `${action} · ${name}`);
  primary.dataset.primary = "";
  primary.addEventListener("click", (event) => {
    button.onClick(event);
    refresh();
  });
  actions.append(primary);

  const options = (config.links ?? []).flatMap((key) => {
    const native = button[key]?.link;
    if (!native) return [];
    const option = control(document, "village-control village-command-batch");
    option.addEventListener("click", () => {
      native.click();
      refresh();
    });
    actions.append(option);
    return [{ native, option }];
  });
  card.append(head, description, prices, actions);

  let priceSignature;
  function update() {
    const model = button.model;
    card.hidden = !model.visible;
    if (card.hidden) return;
    const readOnly = game.isReadOnly();
    const enabled = model.enabled && !readOnly;
    primary.disabled = !enabled;
    for (const { native, option } of options) {
      option.hidden = native.style.display === "none" || readOnly;
      option.disabled = !enabled;
      setText(option, native.textContent.trim());
      option.title = native.title;
      option.setAttribute("aria-label", `${name} · ${option.textContent}${native.title && native.title !== option.textContent ? ` (${native.title})` : ""}`);
    }
    const costs = model.prices.map(({ name, val }) => {
      const resource = game.resPool.get(name);
      return { name, title: resource.title || resource.name, val, affordable: resource.value >= val };
    });
    const signature = JSON.stringify(costs);
    if (priceSignature === signature) return;
    priceSignature = signature;
    prices.hidden = !costs.length;
    prices.replaceChildren(...costs.map(({ name, title, val, affordable }) => {
      const item = document.createElement("li");
      item.toggleAttribute("data-unavailable", !affordable);
      item.append(villageIcon(document, name), `${game.getDisplayValueExt(val)} ${title}`);
      return item;
    }));
  }
  return { card, update };
}

function createSection(document, game, tab, panel) {
  panel.panelDiv.classList.add("village-section", "village-management");
  const translate = document.defaultView.$I;
  const language = villageLocale(document) === "fr" ? "fr" : "en";
  const summary = element(document, "div", "village-management-summary");
  const happiness = metric(document, translate("village.census.lbl.happiness"), "heart");
  const festival = metric(document, commands[1][language][0], "calendar");
  const info = control(document, "village-control village-metric-info", "", translate("village.census.lbl.happiness"));
  info.append(villageIcon(document, "info"));
  const tip = element(document, "p", "village-popover village-metric-description", textFromMarkup(document, translate("village.panel.management.desc")));
  tip.popover = "auto";
  info.popoverTargetElement = tip;
  happiness.card.append(info, tip);
  summary.append(happiness.card, festival.card);

  const grid = element(document, "div", "village-command-grid");
  const cards = commands.map((config) => createCommand(document, game, tab[config.key], config, language, refresh));
  grid.append(...cards.map(({ card }) => card));
  tab.advVillageTable.hidden = true;
  panel.contentDiv.prepend(summary, grid);

  function refresh() {
    const percent = game.village.happiness * 100;
    setText(happiness.value, `${percent < 10000 ? Math.floor(percent) : game.getDisplayValueExt(percent)} %`);
    const days = game.calendar.festivalDays;
    festival.card.hidden = !tab.festivalBtn.model.visible && !days;
    festival.card.toggleAttribute("data-active", Boolean(days));
    setText(festival.value, days ? game.toDisplayDays(days) : language === "fr" ? "Inactif" : "Inactive");
    for (const { update } of cards) update();
    grid.hidden = cards.every(({ card }) => card.hidden);
  }
  return refresh;
}

export function updateVillageManagement(document, game) {
  const tab = game.villageTab;
  const panel = tab.statisticsPanel;
  if (!panel?.visible || !panel.panelDiv?.isConnected) return;
  if (!sections.has(panel)) sections.set(panel, createSection(document, game, tab, panel));
  if (!panel.collapsed) sections.get(panel)();
}
