import { iconImage } from "./Icon.jsx";
import { installResourceDescriptions, updateResourceAmounts } from "./resource-descriptions.js";

export function installReferenceControls(document) {
  const menu = document.getElementById("gameContainerId");
  const toggleSelector = ".panelContainer > .toggle";
  const batchSelector = ":is(.Religion, .Space, .Time) .btnContent .linkContent:has(> a):not([popover])";
  const censusActions = ".links-container :is(.favoriteHref, .leaderHref, .promoteHref)";
  const sidebar = document.getElementById("leftColumn");
  const removeResourceDescriptions = installResourceDescriptions(sidebar);
  const resourceButtons = ".reference-resource-header a.link";
  let nextId = 0;

  function markResourceControls() {
    const game = document.defaultView?.gamePage;
    if (!game) return;
    updateResourceAmounts(sidebar, game);
    for (const toggle of sidebar.querySelectorAll("a.collapse")) {
      const header = toggle.parentElement.parentElement;
      const label = toggle.title === "Toggle resources" ? "Ressources"
        : toggle.title === "Toggle craft" ? "Fabriquer" : toggle.title;
      const expanded = Boolean(toggle.querySelector(".down"));
      if (!header.classList.contains("reference-resource-header")) header.classList.add("reference-resource-header");
      const body = header.nextElementSibling;
      if (body && !body.classList.contains("reference-resource-body")) body.classList.add("reference-resource-body");
      if (!header.parentElement.classList.contains("reference-resource-section")) {
        header.parentElement.classList.add("reference-resource-section");
      }
      header.toggleAttribute("data-expanded", expanded);
      const hidden = header.parentElement.querySelector(".res-toggle-hidden input");
      hidden?.setAttribute("aria-label", "Afficher les ressources cachées");
      toggle.dataset.label = label;
      toggle.setAttribute("aria-label", label);
      toggle.setAttribute("aria-expanded", String(expanded));
      toggle.setAttribute("role", "button");
      toggle.tabIndex = 0;
      const selection = header.querySelector(".res-toolbar.right > a");
      if (selection) {
        selection.setAttribute("aria-label", `Sélection · ${label}`);
        selection.setAttribute("aria-pressed", String(selection.classList.contains("toggled")));
        selection.setAttribute("role", "button");
        selection.tabIndex = 0;
      }
    }
    const tradeLinks = sidebar.querySelectorAll(".pin-link .trade-icons");
    if (tradeLinks.length) {
      const races = game.diplomacy.races.filter((race) => race.pinned);
      tradeLinks.forEach((icons, index) => {
        const race = races[index];
        if (!race) return;
        for (const [side, resource] of [["buy", race.buys[0]], ["sell", race.sells[0]]]) {
          const image = `url("${iconImage(resource?.name)}")`;
          const property = `--trade-${side}`;
          if (icons.style.getPropertyValue(property) !== image) icons.style.setProperty(property, image);
        }
      });
    }

  }

  function activateResourceButton(event) {
    if (!event.target.matches(resourceButtons) || !["Enter", " "].includes(event.key)) return;
    event.preventDefault();
    event.stopPropagation();
    event.target.click();
  }

  function markToggle(toggle) {
    const panel = toggle.parentElement;
    const title = panel.querySelector(":scope > .title");
    const content = panel.querySelector(":scope > .container");
    if (!title || !content) return;
    if (!toggle.hasAttribute("aria-controls")) {
      nextId += 1;
      if (!title.id) title.id = `agllm-panel-title-${nextId}`;
      if (!content.id) content.id = `agllm-panel-content-${nextId}`;
      toggle.setAttribute("role", "button");
      toggle.setAttribute("aria-labelledby", title.id);
      toggle.setAttribute("aria-controls", content.id);
    }
    const expanded = String(!toggle.classList.contains("collapsed"));
    if (toggle.getAttribute("aria-expanded") !== expanded) toggle.setAttribute("aria-expanded", expanded);
  }

  function markControls(root) {
    if (root.matches(toggleSelector)) markToggle(root);
    root.querySelectorAll(toggleSelector).forEach(markToggle);
    const items = root.matches(censusActions) ? [root] : root.querySelectorAll(censusActions);
    for (const item of items) {
      item.setAttribute("role", "button");
      item.setAttribute("aria-label", item.title);
      item.tabIndex = 0;
    }
    if (root.matches(batchSelector)) markBatch(root);
    root.querySelectorAll(batchSelector).forEach(markBatch);
    const parentBatch = root.parentElement?.closest(batchSelector);
    if (parentBatch) markBatch(parentBatch);
  }

  function markBatch(menu) {
    const single = menu.parentElement.querySelector(":scope > a");
    if (!single || menu.hasAttribute("popover")) return;
    menu.popover = "auto";
    menu.classList.add("reference-child-popover");
    menu.parentElement.classList.add("reference-child-group");
    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "reference-child-batch";
    trigger.textContent = "…";
    const name = menu.closest(".btnContent").querySelector(".label-content, .btnTitle").textContent.trim();
    const title = document.defaultView.i18nLang?.getLanguage() === "fr" ? "Quantités" : "Quantities";
    trigger.setAttribute("aria-label", `${title} · ${name} · ${single.textContent.trim()}`);
    trigger.popoverTargetElement = menu;
    for (const type of ["click", "keydown", "keypress", "mouseover"]) {
      trigger.addEventListener(type, (event) => event.stopPropagation());
    }
    menu.addEventListener("click", (event) => {
      if (event.target.closest("a") && menu.matches(":popover-open")) menu.hidePopover();
    }, true);
    single.after(trigger);
  }

  function selectTitle(event) {
    const title = event.target.closest(".panelContainer > .title");
    if (!title || event.target.closest("a, button, input, select, textarea, label")) return;
    const toggle = title.parentElement.querySelector(":scope > .toggle");
    if (toggle?.getClientRects().length) toggle.click();
  }

  function activateControl(event) {
    if (!event.target.matches(`${toggleSelector}, ${censusActions}`)
      || (event.code !== "Space" && !(event.key === "Enter" && event.target.tagName === "SPAN"))) return;
    event.preventDefault();
    event.stopPropagation();
    event.target.click();
  }

  const observer = new MutationObserver((records) => {
    for (const { type, target, addedNodes } of records) {
      if (type === "attributes" && target.matches(toggleSelector)) markToggle(target);
      for (const node of addedNodes) {
        if (node.nodeType === 1) markControls(node);
      }
    }
  });
  markControls(menu);
  observer.observe(menu, { subtree: true, childList: true, attributes: true, attributeFilter: ["class"] });
  menu.addEventListener("click", selectTitle);
  menu.addEventListener("keydown", activateControl);
  const resourceObserver = new MutationObserver(markResourceControls);
  markResourceControls();
  resourceObserver.observe(sidebar, {
    subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["class"],
  });
  sidebar.addEventListener("keydown", activateResourceButton, true);
  return () => {
    removeResourceDescriptions();
    observer.disconnect();
    resourceObserver.disconnect();
    sidebar.removeEventListener("keydown", activateResourceButton, true);
    menu.removeEventListener("click", selectTitle);
    menu.removeEventListener("keydown", activateControl);
  };
}
