import { iconImage } from "./Icon.jsx";
import { buildingUpgrades, campToolIcons } from "./building-icons.js";
import { updateBuildingCard } from "./camp-buttons.js";
import { resourceIcons } from "./resource-icons.js";
import { tabArt } from "./tab-art.js";
import { updateVillageCensus } from "./village-census.js";
import { updateVillageJobs } from "./village-jobs.js";
import { updateVillageManagement } from "./village-management.js";
import { updateWorkshop } from "./workshop-ui.js";
import { updateTrade } from "./trade-ui.js";

const tabs = {
  Bonfire: ["camp", "camp"], Village: ["village", "village"], Science: ["research", "scienceTab"],
  Workshop: ["workshop", "tools"], Trade: ["market", "trade"], Religion: ["camp", "star"],
  Space: ["trails", "world"], Time: ["research", "calendar"], Achievements: ["camp", "star"],
  Challenges: ["trails", "star"], Stats: ["research", "info"], Queue: ["workshop", "journal"],
};
const imageURL = (url) => `url("${url}")`;
const tabScroll = new WeakMap();

export const referenceResourceIcons = [
  `.reference-game .resource-name { --resource-mark: ${imageURL(iconImage("resources"))}; }`,
  ...Object.keys(resourceIcons).map((id) =>
    `.reference-game .resource_${id} .resource-name { --resource-mark: ${imageURL(iconImage(id))}; }`),
].join("\n");

const controlIcons = {
  eye: "eye", info: "info", plus: "plus", minus: "minus", power: "power", automation: "settings",
  sell: "trade", flag: "flag", star: "star", upgrade: "up", downgrade: "down", unassign: "minus",
};
export const referenceControlIcons = `:root {
  ${Object.entries(controlIcons).map(([name, icon]) => `--control-icon-${name}: ${imageURL(iconImage(icon))};`).join("")}
  ${["account", "chart", "tools", "leaf", "hunt", "unicorns", "sun", "gear", "catnip", "wood", "chevron", "world", "calendar"].map((name) => `--icon-${name}: ${imageURL(iconImage(name))};`).join("")}
  ${Object.entries(campToolIcons).map(([name, icon]) => `--camp-tool-${name}: ${imageURL(icon)};`).join("")}
}`;

function addImage(document, name, className) {
  const image = document.createElement("img");
  image.src = name;
  image.alt = "";
  image.draggable = false;
  image.className = className;
  return image;
}

function updateNavigation(document, game) {
  const menu = document.getElementById("gameContainerId");
  const nav = menu.querySelector(".tabsContainer");
  const contents = menu.querySelector(".tabInner");
  if (!nav || !contents) return;
  const active = game.ui.activeTabId;
  let scroll = tabScroll.get(menu);
  if (!scroll) {
    scroll = { positions: new Map(), contents: null };
    tabScroll.set(menu, scroll);
  }
  if (scroll.contents !== contents) {
    scroll.contents = contents;
    contents.tabIndex = 0;
    contents.setAttribute("role", "region");
    const position = scroll.positions.get(active) ?? 0;
    contents.addEventListener("scroll", () => scroll.positions.set(active, contents.scrollTop), { passive: true });
    document.defaultView.requestAnimationFrame(() => {
      if (contents.isConnected) contents.scrollTop = position;
    });
  }
  const visible = game.tabs.filter((tab) => tab.visible && tab.domNode?.isConnected);
  if (!nav.hasAttribute("role")) {
    nav.setAttribute("role", "navigation");
    nav.setAttribute("aria-label", "Sections du jeu");
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "reference-tab-toggle";
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-controls", "agllm-game-tabs");
    const links = document.createElement("div");
    links.id = "agllm-game-tabs";
    links.className = "reference-tab-links";
    links.append(...nav.querySelectorAll("a.tab"));
    nav.prepend(toggle, links);
    function expand(expanded) {
      toggle.setAttribute("aria-expanded", String(expanded));
    }
    toggle.addEventListener("click", () => expand(toggle.getAttribute("aria-expanded") === "false"));
    nav.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || toggle.getAttribute("aria-expanded") !== "true") return;
      event.preventDefault();
      event.stopPropagation();
      expand(false);
      toggle.focus();
    });
    nav.addEventListener("click", (event) => {
      if (event.detail !== 0 || !event.target.closest("a.tab")) return;
      document.defaultView.requestAnimationFrame(() => {
        const compact = menu.querySelector(".reference-tab-toggle");
        const target = compact?.getClientRects().length ? compact : menu.querySelector(".tabsContainer a.activeTab");
        target?.focus({ preventScroll: true });
      });
    });
    contents.setAttribute("aria-label", visible.find((tab) => tab.tabId === active)?.domNode.textContent ?? "Contenu du jeu");
  }
  nav.toggleAttribute("data-single-tab", visible.length === 1);
  const toggle = nav.querySelector(".reference-tab-toggle");
  const activeLabel = visible.find((tab) => tab.tabId === active)?.domNode.textContent.trim() ?? "Sections du jeu";
  if (toggle.textContent !== activeLabel) {
    toggle.textContent = activeLabel;
    toggle.setAttribute("aria-label", `Sections du jeu · ${activeLabel}`);
    toggle.style.setProperty("--tab-mark", imageURL(iconImage(tabs[active]?.[1] ?? "camp")));
  }
  for (const tab of visible) {
    const link = tab.domNode;
    if (tab.tabId === active && link.getAttribute("aria-current") !== "page") {
      link.setAttribute("aria-current", "page");
    } else if (tab.tabId !== active) {
      link.removeAttribute("aria-current");
    }
    if (!link.style.getPropertyValue("--tab-mark")) {
      link.style.setProperty("--tab-mark", imageURL(iconImage(tabs[tab.tabId]?.[1] ?? "camp")));
    }
  }
  const illustration = tabArt[tabs[active]?.[0] ?? "camp"];
  const banner = contents.querySelector(".reference-section-art");
  if (!banner) {
    contents.prepend(addImage(document, illustration, "reference-section-art"));
  } else if (banner.getAttribute("src") !== illustration) {
    banner.src = illustration;
  }
}

export function decorateReferenceGame(document, game, inspect, showBuilding) {
  if (!game?.ui?.activeTabId) return;
  updateNavigation(document, game);
  if (game.ui.activeTabId === "Bonfire") {
    const { groupContainer, children, bldGroups } = game.bldTab;
    if (groupContainer && !groupContainer.hasAttribute("data-camp-grid")) {
      // The native table distributes alternating buttons across two columns.
      const table = groupContainer.querySelector(":scope > table");
      if (table) table.replaceWith(...children.map((button) => button.domNode));
      const commands = children.filter((button) => !button.opts?.building);
      if (commands.length) {
        const actions = document.createElement("div");
        actions.className = "camp-core-actions";
        actions.setAttribute("role", "group");
        actions.setAttribute("aria-label", "Collecte et transformation");
        actions.append(...commands.map((button) => button.domNode));
        groupContainer.prepend(actions);
      }
      const filters = document.createElement("div");
      filters.className = "camp-filters";
      filters.setAttribute("role", "group");
      filters.setAttribute("aria-label", "Filtres des bâtiments");
      const picker = document.createElement("select");
      picker.className = "camp-filter-picker";
      picker.setAttribute("aria-label", "Filtrer les bâtiments");
      for (const { group, tab, visible } of bldGroups) {
        filters.append(tab);
        if (group.name === game.bldTab.activeGroup) tab.setAttribute("aria-current", "true");
        if (!visible) continue;
        const option = document.createElement("option");
        option.value = group.name;
        option.textContent = tab.textContent;
        picker.append(option);
      }
      picker.value = game.bldTab.activeGroup;
      picker.addEventListener("change", () => {
        bldGroups.find(({ group }) => group.name === picker.value)?.tab.click();
        document.defaultView.requestAnimationFrame(() => document.querySelector(".camp-filter-picker")?.focus());
      });
      for (const type of ["keydown", "keyup"]) picker.addEventListener(type, (event) => event.stopPropagation());
      groupContainer.before(filters, picker);
      groupContainer.setAttribute("data-camp-grid", "");
    }
    for (const [index, button] of children.entries()) {
      const node = button.domNode;
      if (!node?.isConnected) continue;
      const id = button.opts?.building;
      if (!id || !button.model?.metadata) {
        if (index < 2) node.dataset.campAction = index === 0 ? "gather" : "refine";
        continue;
      }
      const art = button.model.metadata.stage > 0 ? buildingUpgrades[id] ?? id : id;
      if (node.dataset.buildingIcon !== art) node.dataset.buildingIcon = art;
      updateBuildingCard(document, game, button, { inspect, information: showBuilding });
    }
  }
  if (game.ui.activeTabId === "Village") {
    updateVillageJobs(document, game);
    updateVillageManagement(document, game);
    updateVillageCensus(document, game);
  }
  if (game.ui.activeTabId === "Workshop") updateWorkshop(document, game);
  if (game.ui.activeTabId === "Trade") updateTrade(document, game);
}
