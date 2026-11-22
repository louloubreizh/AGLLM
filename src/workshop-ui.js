import { iconImage } from "./Icon.jsx";
import { control, element, setText, villageIcon, villageLocale } from "./village-ui.js";

const sections = new WeakMap();
const automation = new WeakMap();
const directions = [
  ["unassignCraftLinks", "unassign", "−", "remove"],
  ["assignCraftLinks", "assign", "+", "add"],
];
const labels = {
  fr: {
    production: "Production prévue", consumption: "Consommation prévue", idle: "Aucun débit prévu",
    add: "Affecter", remove: "Retirer", engineers: "Ingénieurs", batch: "Affectation par groupes",
  },
  en: {
    production: "Expected output", consumption: "Expected consumption", idle: "No expected flow",
    add: "Assign", remove: "Unassign", engineers: "Engineers", batch: "Batch assignments",
  },
};

function flowSection(document, title, kind) {
  const section = element(document, "section", `workshop-flow workshop-flow-${kind}`);
  const heading = element(document, "h3", "", title);
  const rows = element(document, "dl", "workshop-flow-rows");
  section.append(heading, rows);
  return { section, rows };
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
    flow.section.append(flow.empty);
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
  tab.resTd.classList.replace("craftStuffPanel", "workshop-stock");
  statistics.append(production.section, consumption.section, tab.resTd);
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
  const batch = element(document, "div", "workshop-engineer-menu");
  batch.popover = "auto";
  const options = control(document, "workshop-engineer-options", "…", `${copy.batch} · ${label}`);
  options.popoverTargetElement = batch;

  function activate(list, id) {
    const craft = button.model.craft;
    if (game.isReadOnly() || !craft.unlocked) return;
    button.model[list].find((item) => item.id === id)?.handler();
    game.village.updateResourceProduction();
    game.ui.update();
  }

  const controls = directions.map(([list, id, sign, action]) => {
    const single = control(document, "workshop-engineer-step", sign, `${copy[action]} 1 · ${label}`);
    single.addEventListener("click", () => activate(list, id));
    const items = [5, 25, 100].map((amount) => {
      const key = `${id}${amount}`;
      const item = control(document, "workshop-engineer-batch", `${sign}${amount}`, `${copy[action]} ${amount} · ${label}`);
      item.addEventListener("click", () => {
        batch.hidePopover();
        activate(list, key);
      });
      batch.append(item);
      return { key, item };
    });
    return { list, single, items };
  });
  strip.append(controls[0].single, count, controls[1].single, options, batch);
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
    let hasBatch = false;
    controls.forEach(({ list, single, items }, index) => {
      const enabled = canEdit && (index === 0 ? assigned > 0 : free > 0);
      single.disabled = !enabled;
      for (const { key, item } of items) {
        item.hidden = !button.model[list].some((link) => link.id === key);
        item.disabled = !enabled;
        hasBatch ||= !item.hidden;
      }
    });
    options.hidden = !hasBatch;
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
