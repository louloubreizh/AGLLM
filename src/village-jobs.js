import { quantityDirection } from "./quantity-buttons.js";
import { control, element, setText, villageLocale } from "./village-ui.js";

const pictures = import.meta.glob("../assets/jobs/*.jpg", { eager: true, import: "default", query: "?url" });

const labels = {
  fr: {
    assigned: "Affectés", add: "Affecter", remove: "Retirer", reset: "Tout désaffecter",
  },
  en: {
    assigned: "Assigned", add: "Assign", remove: "Unassign", reset: "Clear assignments",
  },
};

const sections = new WeakMap();
const directions = [
  { method: "unassignJobs", maximum: "unassignAllJobs", first: "unassign", sign: "−", label: "remove" },
  { method: "assignJobs", maximum: "assignAllJobs", first: "assign", sign: "+", label: "add" },
];

function createCard(document, game, button, copy, refresh) {
  const { domNode, buttonContent, model: { job } } = button;
  domNode.classList.add("village-job-card");
  domNode.setAttribute("aria-label", job.title);
  domNode.dataset.job = job.name;

  const cover = element(document, "div", "village-job-cover");
  const words = element(document, "div", "village-job-heading");
  const title = element(document, "h3", "village-job-name", job.title);
  const artwork = pictures[`../assets/jobs/${job.name}.jpg`];
  if (artwork) {
    const picture = element(document, "img", "village-job-picture");
    picture.src = artwork;
    picture.alt = "";
    picture.draggable = false;
    picture.decoding = "async";
    cover.append(picture);
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

  function change(direction, amount, event) {
    if (game.isReadOnly() || !job.unlocked) return;
    if (direction.first === "assign" && amount === 1 && (event.ctrlKey || event.metaKey || event.shiftKey)) {
      button.onClick(event);
    } else {
      const method = amount === "max" ? direction.maximum : direction.method;
      button.controller[method](button.model, amount);
      button.update();
    }
    refresh();
  }

  const controls = directions.map((direction) => quantityDirection(document, {
    label: (amount) => [copy[direction.label], amount].filter(Boolean).join(" ") + ` · ${job.title}`,
    sign: direction.sign,
    amounts: [5, 25, 100, "max"],
    activate: (amount, event) => change(direction, amount, event),
    stepClass: `village-job-step village-job-${direction.first}`,
  }));

  stepper.append(controls[0].group, count, controls[1].group);
  actions.append(stepper);
  for (const type of ["click", "keydown", "keypress"]) actions.addEventListener(type, (event) => event.stopPropagation());
  actions.addEventListener("mouseover", (event) => {
    event.stopPropagation();
    if (game.tooltipOwnerDomNode === domNode) document.defaultView.UIUtils.hideTooltip(game);
  });
  buttonContent.append(cover, actions);
  return (canEdit, free, format) => {
    setText(count, format.format(job.value));
    domNode.toggleAttribute("data-staffed", job.value > 0);
    const canAssign = canEdit && free > 0 && game.village.getJobLimit(job.name) > job.value;
    const canUnassign = canEdit && job.value > 0;
    controls[0].enable(canUnassign);
    controls[1].enable(canAssign);
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
