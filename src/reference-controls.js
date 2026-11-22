export function installReferenceControls(document) {
  const menu = document.getElementById("gameContainerId");
  const toggleSelector = ".panelContainer > .toggle";
  const censusActions = ".links-container :is(.favoriteHref, .leaderHref, .promoteHref)";
  let nextId = 0;

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
  return () => {
    observer.disconnect();
    menu.removeEventListener("click", selectTitle);
    menu.removeEventListener("keydown", activateControl);
  };
}
