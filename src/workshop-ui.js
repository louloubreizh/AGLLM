import { quantityDirection } from "./quantity-buttons.js";
import { iconImage } from "./Icon.jsx";
import { element, setText, villageIcon, villageLocale } from "./village-ui.js";

const sections = new WeakMap();
const automation = new WeakMap();
const directions = [
  ["unassignCraftJob", "−", "remove"],
  ["assignCraftJob", "+", "add"],
];
const labels = {
  fr: {
    production: "Production prévue", consumption: "Consommation prévue", idle: "Aucun débit prévu",
    add: "Affecter", remove: "Retirer", engineers: "Ingénieurs",
  },
  en: {
    production: "Expected output", consumption: "Expected consumption", idle: "No expected flow",
    add: "Assign", remove: "Unassign", engineers: "Engineers",
  },
};

function flowSection(document, title, kind) {
  const section = element(document, "details", `workshop-flow workshop-flow-${kind}`);
  const heading = element(document, "summary", "", title);
  const body = element(document, "div", "workshop-flow-body");
  const rows = element(document, "dl", "workshop-flow-rows");
  body.append(rows);
  section.append(heading, body);
  return { section, body, rows };
}

function updateFlow(document, game, flow, values, copy) {
  const rows = values.map(([name, rate]) => {
    const formatted = game.getDisplayValueExt(rate, true, true, 3);
    return [name, game.opts.usePerSecondValues ? formatted : `${formatted}/tick`];
  });
  const signature = JSON.stringify(rows);
  if (signature === flow.signature) return;
  flow.signature = signature;
  if (!rows.length) {
    flow.rows.replaceChildren();
    flow.empty ??= element(document, "p", "workshop-flow-empty", copy.idle);
    flow.body.append(flow.empty);
    flow.rows.hidden = true;
    return;
  }
  flow.empty?.remove();
  flow.rows.hidden = false;
  flow.rows.replaceChildren(...rows.map(([name, rate]) => {
    const row = element(document, "div", "workshop-flow-row");
    const resource = game.resPool.get(name);
    const label = element(document, "dt");
    label.append(villageIcon(document, name), resource.title || name);
    row.append(label, element(document, "dd", "", rate));
    return row;
  }));
}

function createSection(document, tab, copy) {
  const table = tab.tdTop.closest("table");
  if (!table) return;
  const panel = table.closest(".panelContainer");
  panel.classList.add("workshop-craft-panel");
  const production = flowSection(document, copy.production, "production");
  const consumption = flowSection(document, copy.consumption, "consumption");
  const statistics = element(document, "div", "workshop-statistics");
  statistics.append(production.section, consumption.section);
  tab.tdTop.classList.add("workshop-engineer-summary");
  const crafts = element(document, "div", "workshop-craft-grid");
  for (const button of tab.craftBtns) {
    button.domNode.classList.add("workshop-craft");
    button.domNode.style.setProperty("--workshop-icon", `url("${iconImage(button.craftName)}")`);
    crafts.append(button.domNode);
  }
  table.replaceWith(tab.tdTop, statistics, crafts);
  return { statistics, production, consumption };
}

function createAutomation(document, game, button, copy) {
  const { buttonContent, domNode } = button;
  const label = button.model.craft.label;
  const strip = element(document, "div", "workshop-engineers");
  strip.setAttribute("role", "group");
  strip.setAttribute("aria-label", `${copy.engineers} · ${label}`);
  const count = element(document, "span", "workshop-engineer-count");
  const controls = directions.map(([method, sign, action]) => quantityDirection(document, {
    label: (amount) => [copy[action], amount].filter(Boolean).join(" ") + ` · ${label}`,
    sign,
    amounts: [5, 25],
    stepClass: "workshop-engineer-step",
    activate(amount) {
      if (game.isReadOnly() || !button.model.craft.unlocked) return;
      button.controller[method](button.model, amount);
      game.village.updateResourceProduction();
      game.ui.update();
    },
  }));
  strip.classList.add("quantity-controls");
  strip.append(controls[0].group, count, controls[1].group);
  for (const type of ["click", "keydown", "keypress"]) strip.addEventListener(type, (event) => event.stopPropagation());
  strip.addEventListener("mouseover", (event) => {
    event.stopPropagation();
    if (game.tooltipOwnerDomNode === domNode) document.defaultView.UIUtils.hideTooltip(game);
  });
  for (const links of [button.unassignCraftLinks, button.assignCraftLinks]) {
    const root = Object.values(links ?? {})[0]?.link;
    [...buttonContent.children].find((child) => root && child.contains(root))?.remove();
  }
  buttonContent.append(strip);
  return (free, canEdit) => {
    const assigned = button.model.craft.value;
    setText(count, String(assigned));
    controls[0].enable(canEdit && assigned > 0);
    controls[1].enable(canEdit && free > 0);
  };
}

export function updateWorkshop(document, game) {
  const tab = game.workshopTab;
  if (!tab?.tdTop?.isConnected) return;
  const copy = labels[villageLocale(document)] ?? labels.en;
  let section = sections.get(tab.tdTop);
  if (!section) {
    section = createSection(document, tab, copy);
    if (!section) return;
    sections.set(tab.tdTop, section);
    document.querySelector(".Workshop #toggleResearched")?.addEventListener("click", () => updateWorkshop(document, game));
  }
  const mechanized = game.science.get("mechanization").researched;
  section.statistics.toggleAttribute("data-mechanized", mechanized);
  if (!mechanized) return;
  const free = game.village.getFreeEngineers();
  const canEdit = !game.isReadOnly();
  const production = [];
  for (const button of tab.craftBtns) {
    const { craft } = button.model;
    if (!craft.unlocked) continue;
    let update = automation.get(button.domNode);
    if (!update) {
      update = createAutomation(document, game, button, copy);
      automation.set(button.domNode, update);
    }
    update(free, canEdit);
    if (craft.value) {
      const rate = game.workshop.getEffectEngineer(craft.name, true);
      if (rate) production.push([craft.name, rate]);
    }
  }
  updateFlow(document, game, section.production, production, copy);
  updateFlow(document, game, section.consumption, Object.entries(game.workshop.getConsumptionEngineers()), copy);
}
