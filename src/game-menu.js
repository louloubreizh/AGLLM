import { tabArt } from "./tab-art.js";

export function updateGameMenu(document, game) {
  const container = document.getElementById("gameContainerId");
  const navigation = container.querySelector(".tabsContainer");
  const content = container.querySelector(".tabInner");
  const active = game.tabs.find((tab) => tab.tabId === game.ui.activeTabId);
  if (!navigation || !content || !active) return;

  if (!navigation.hasAttribute("role")) {
    navigation.setAttribute("role", "navigation");
    navigation.setAttribute("aria-label", "Sous-menus du jeu");
  }
  const tabs = game.tabs.filter((tab) => tab.visible && tab.domNode?.isConnected);
  const signature = tabs.map((tab) => `${tab.tabId}:${tab.domNode.textContent}`).join("|");
  let chooser = navigation.querySelector(".kgllm-tab-picker");
  if (!chooser || chooser.dataset.tabs !== signature) {
    const select = document.createElement("select");
    select.className = "kgllm-tab-picker";
    select.setAttribute("aria-label", "Sous-menu du jeu");
    select.dataset.tabs = signature;
    for (const tab of tabs) {
      const option = document.createElement("option");
      option.value = tab.tabId;
      option.textContent = tab.domNode.textContent;
      select.append(option);
    }
    select.addEventListener("change", () => {
      game.tabs.find((tab) => tab.tabId === select.value)?.domNode?.click();
      container.querySelector(".kgllm-tab-picker")?.focus({ preventScroll: true });
    });
    select.addEventListener("keyup", (event) => {
      if (!["Shift", "Control", "Alt", "Meta"].includes(event.key)) event.stopPropagation();
    });
    if (chooser) chooser.replaceWith(select);
    else navigation.prepend(select);
    chooser = select;
  }
  if (chooser.value !== active.tabId) chooser.value = active.tabId;
  if (active.domNode?.getAttribute("aria-current") !== "page") {
    active.domNode?.setAttribute("aria-current", "page");
  }
  const artwork = tabArt[active.tabId];
  if (!artwork || content.querySelector(".kgllm-tab-banner")) return;

  const banner = document.createElement("header");
  banner.className = "kgllm-tab-banner";
  banner.style.setProperty("--tab-accent", artwork.accent);
  const heading = document.createElement("h2");
  heading.textContent = active.domNode?.textContent ?? active.tabName;
  const picture = document.createElement("img");
  picture.src = artwork.image;
  picture.alt = "";
  picture.width = 270;
  picture.height = 108;
  picture.draggable = false;
  banner.append(heading, picture);
  content.prepend(banner);
}
