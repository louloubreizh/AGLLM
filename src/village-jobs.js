import { control, element, setText, textFromMarkup, villageIcon, villageLocale } from "./village-ui.js";

const pictures = import.meta.glob("../assets/jobs/*.jpg", { eager: true, import: "default", query: "?url" });
const jobArtwork = {
  woodcutter: ["wood", "#c9b483", "#2a3922"],
  farmer: ["catnip", "#b8d689", "#323d20"],
  scholar: ["science", "#a5d6da", "#14353b"],
  hunter: ["manpower", "#c4d59a", "#1d3a2c"],
  miner: ["minerals", "#c1d2e7", "#283746"],
  priest: ["faith", "#e8b9cf", "#483140"],
  geologist: ["coal", "#c6b7e6", "#233c43"],
  engineer: ["gear", "#a7d8cc", "#19393d"],
  ambassador: ["trade", "#e6c1a3", "#293c37"],
};

const labels = {
  fr: {
    assigned: "Affectés", add: "Affecter", remove: "Retirer", all: "Tout", details: "Détails et affectations",
    reset: "Tout désaffecter", crafting: "Artisanat", trade: "Commerce",
  },
  en: {
    assigned: "Assigned", add: "Assign", remove: "Unassign", all: "All", details: "Details and assignments",
    reset: "Clear assignments", crafting: "Crafting", trade: "Trade",
  },
};

const sections = new WeakMap();
const directions = [
  { links: "unassignLinks", first: "unassign", sign: "−", label: "remove" },
  { links: "assignLinks", first: "assign", sign: "+", label: "add" },
];

function createCard(document, game, button, copy, refresh) {
  const { domNode, buttonContent, model: { job } } = button;
  domNode.classList.add("village-job-card");
  domNode.setAttribute("aria-label", job.title);
  domNode.dataset.job = job.name;

  const cover = element(document, "div", "village-job-cover");
  const words = element(document, "div", "village-job-heading");
  const title = element(document, "h3", "village-job-name", job.title);
  const artwork = jobArtwork[job.name];
  if (artwork) {
    const [resource, accent, shade] = artwork;
    domNode.style.setProperty("--job-accent", accent);
    domNode.style.setProperty("--job-shade", shade);
    const picture = element(document, "img", "village-job-picture");
    picture.src = pictures[`../assets/jobs/${job.name}.jpg`];
    picture.alt = "";
    picture.draggable = false;
    picture.decoding = "async";
    cover.append(picture);

    const category = element(document, "div", "village-job-category");
    const symbol = villageIcon(document, resource);
    const label = { gear: copy.crafting, trade: copy.trade }[resource] ?? game.resPool.get(resource).title;
    category.append(symbol, label);
    words.append(category);
  }
  words.append(title);
  cover.append(words);

  const actions = element(document, "div", "village-job-actions");
  const stepper = element(document, "div", "village-job-stepper");
  stepper.setAttribute("role", "group");
  stepper.setAttribute("aria-label", job.title);
  const count = element(document, "output", "village-job-count");
  count.setAttribute("aria-label", copy.assigned);
  count.title = copy.assigned;
  const options = control(document, "village-job-options", "…", `${copy.details} · ${job.title}`);
  const popover = element(document, "div", "village-job-details");
  popover.popover = "auto";
  popover.setAttribute("role", "group");
  popover.setAttribute("aria-label", `${copy.details} · ${job.title}`);
  options.popoverTargetElement = popover;
  const description = element(document, "p", "village-job-description");
  popover.append(element(document, "h4", "village-job-details-title", job.title), description);

  function change(direction, id, event) {
    if (game.isReadOnly() || !job.unlocked) return;
    if (id === "assign" && (event.ctrlKey || event.metaKey || event.shiftKey)) {
      button.onClick(event);
    } else {
      button.model[direction.links].find((link) => link.id === id)?.handler();
      button.update();
    }
    refresh();
  }

  const controls = directions.map((direction) => {
    const label = copy[direction.label];
    const single = control(document, `village-job-step village-job-${direction.first}`, direction.sign, `${label} 1 · ${job.title}`);
    single.addEventListener("click", (event) => change(direction, direction.first, event));
    const batch = element(document, "div", "village-job-batch");
    batch.setAttribute("role", "group");
    batch.setAttribute("aria-label", label);
    const items = [5, 25, 100, copy.all].map((amount) => {
      const id = amount === copy.all
        ? (direction.first === "assign" ? "assignall" : "unassignAll")
        : `${direction.first}${amount}`;
      const item = control(document, "village-job-batch-action", `${direction.sign}${amount}`, `${label} ${amount.toString().toLowerCase()} · ${job.title}`);
      item.addEventListener("click", (event) => change(direction, id, event));
      batch.append(item);
      return { id, item };
    });
    popover.append(batch);
    return { direction, single, items };
  });

  stepper.append(controls[0].single, count, controls[1].single);
  actions.append(stepper, options, popover);
  for (const type of ["click", "keydown", "keypress"]) actions.addEventListener(type, (event) => event.stopPropagation());
  actions.addEventListener("mouseover", (event) => {
    event.stopPropagation();
    if (game.tooltipOwnerDomNode === domNode) document.defaultView.UIUtils.hideTooltip(game);
  });
  buttonContent.append(cover, actions);
  let previousDescription;

  return (canEdit, free, format) => {
    setText(count, format.format(job.value));
    domNode.toggleAttribute("data-staffed", job.value > 0);
    if (previousDescription !== job.description) {
      description.textContent = textFromMarkup(document, job.description);
      previousDescription = job.description;
    }
    const canAssign = canEdit && free > 0 && game.village.getJobLimit(job.name) > job.value;
    const canUnassign = canEdit && job.value > 0;
    for (const [index, { direction, single, items }] of controls.entries()) {
      const enabled = index === 0 ? canUnassign : canAssign;
      single.disabled = !enabled;
      for (const { id, item } of items) {
        item.hidden = !button.model[direction.links].some((link) => link.id === id);
        item.disabled = !enabled;
      }
    }
  };
}

function createSection(document, game, tab, panel) {
  const { panelDiv, contentDiv } = panel;
  panelDiv.classList.add("village-section", "village-jobs");
  const language = villageLocale(document);
  const copy = labels[language] ?? labels.en;
  const format = new Intl.NumberFormat(language);
  const overview = element(document, "div", "village-jobs-overview");
  const stats = element(document, "dl", "village-jobs-stats");
  const [freeCount, assignedCount] = [document.defaultView.$I("village.general.free.kittens.label"), copy.assigned].map((label) => {
    const stat = element(document, "div", "village-jobs-stat");
    const value = document.createElement("dd");
    stat.append(element(document, "dt", "", label), value);
    stats.append(stat);
    return value;
  });
  overview.append(stats);

  const grid = element(document, "div", "village-job-grid");
  const nativeButtons = tab.buttons.filter((button) => button.domNode?.parentElement === contentDiv);
  const refresh = () => updateVillageJobs(document, game);
  const cards = nativeButtons.filter((button) => button.model?.job).map((button) => {
    grid.append(button.domNode);
    return createCard(document, game, button, copy, refresh);
  });

  const nativeReset = nativeButtons.find((button) => !button.model?.job);
  const reset = nativeReset && control(document, "village-jobs-reset", copy.reset, copy.reset);
  if (reset) {
    nativeReset.domNode.hidden = true;
    reset.addEventListener("click", () => {
      nativeReset.domNode.click();
      refresh();
    });
    overview.append(reset);
  }

  if (tab.tdTop) {
    tab.tdTop.hidden = true;
    const loadouts = contentDiv.querySelector(":scope > .loadout");
    const table = tab.tdTop.closest("table");
    if (loadouts && table) {
      const presets = element(document, "div", "village-job-presets");
      presets.hidden = loadouts.style.visibility === "hidden";
      presets.append(table, loadouts);
      contentDiv.append(presets);
    }
  }
  contentDiv.prepend(overview, grid);

  return () => {
    const free = game.village.getFreeKittens();
    const assigned = game.village.getDiligentKittens() - free;
    const canEdit = !game.isReadOnly();
    setText(freeCount, format.format(free));
    setText(assignedCount, format.format(assigned));
    if (reset) reset.hidden = !canEdit;
    for (const update of cards) update(canEdit, free, format);
  };
}

export function updateVillageJobs(document, game) {
  const tab = game.villageTab;
  const panel = tab.jobsPanel;
  if (!panel?.panelDiv?.isConnected) return;
  let update = sections.get(panel);
  if (!update) {
    update = createSection(document, game, tab, panel);
    sections.set(panel, update);
  }
  update();
}
