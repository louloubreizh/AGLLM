import { iconImage } from "./Icon.jsx";
import { buildingUpgrades } from "./building-icons.js";
import { updateBuildingCard } from "./camp-buttons.js";
import { resourceIcons } from "./resource-icons.js";
import { tabArt } from "./tab-art.js";
import { updateVillageCensus } from "./village-census.js";
import { updateVillageJobs } from "./village-jobs.js";
import { updateVillageManagement } from "./village-management.js";

const tabs = {
  Bonfire: ["camp", "camp"], Village: ["village", "village"], Science: ["research", "scienceTab"],
  Workshop: ["workshop", "tools"], Trade: ["market", "trade"], Religion: ["camp", "star"],
  Space: ["trails", "world"], Time: ["research", "calendar"], Achievements: ["camp", "star"],
  Challenges: ["trails", "star"], Stats: ["research", "info"], Queue: ["workshop", "journal"],
};
const imageURL = (url) => `url("${url}")`;

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
  ${["account", "chart", "tools", "leaf"].map((name) => `--icon-${name}: ${imageURL(iconImage(name))};`).join("")}
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
  const visible = game.tabs.filter((tab) => tab.visible && tab.domNode?.isConnected);
  const signature = JSON.stringify(visible.map((tab) => [tab.tabId, tab.domNode.textContent]));
  let picker = nav.querySelector(".reference-tab-picker");

  if (!picker) {
    nav.setAttribute("role", "navigation");
    nav.setAttribute("aria-label", "Sections du jeu");
    picker = document.createElement("select");
    picker.className = "reference-tab-picker";
    picker.setAttribute("aria-label", "Section du jeu");
    picker.addEventListener("change", () => {
      game.tabs.find((tab) => tab.tabId === picker.value)?.domNode?.click();
      document.defaultView.requestAnimationFrame(() => menu.querySelector(".reference-tab-picker")?.focus());
    });
    for (const type of ["keydown", "keyup"]) picker.addEventListener(type, (event) => event.stopPropagation());
    nav.prepend(picker);
  }
  if (picker.dataset.tabs !== signature) {
    picker.dataset.tabs = signature;
    picker.replaceChildren(...visible.map((tab) => {
      const option = document.createElement("option");
      option.value = tab.tabId;
      option.textContent = tab.domNode.textContent;
      return option;
    }));
  }
  if (picker.value !== active) picker.value = active;
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
    for (const [index, button] of game.bldTab.children.entries()) {
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
}
