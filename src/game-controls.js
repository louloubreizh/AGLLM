const disclosure = ".panelContainer > .toggle";

export function installGameControls(document) {
  const menu = document.getElementById("gameContainerId");
  let nextId = 0;

  function describe(toggle) {
    const panel = toggle.parentElement;
    const title = panel.querySelector(":scope > .title");
    const content = panel.querySelector(":scope > .container");
    if (!title || !content) return;

    if (!toggle.hasAttribute("aria-controls")) {
      nextId += 1;
      if (!title.id) title.id = `kgllm-section-label-${nextId}`;
      if (!content.id) content.id = `kgllm-section-content-${nextId}`;
      toggle.setAttribute("role", "button");
      toggle.setAttribute("aria-labelledby", title.id);
      toggle.setAttribute("aria-controls", content.id);
    }
    const expanded = String(!toggle.classList.contains("collapsed"));
    if (toggle.getAttribute("aria-expanded") !== expanded) {
      toggle.setAttribute("aria-expanded", expanded);
    }
  }

  function decorate(root) {
    if (root.matches(disclosure)) describe(root);
    root.querySelectorAll(disclosure).forEach(describe);
  }

  function openFromTitle(event) {
    const title = event.target.closest(".panelContainer > .title");
    if (!title || event.target.closest("a, button, input, select, textarea, label")) return;
    const toggle = title.parentElement.querySelector(":scope > .toggle");
    if (toggle?.getClientRects().length) {
      event.stopPropagation();
      toggle.click();
    }
  }

  function activateWithSpace(event) {
    if (event.code !== "Space" || !event.target.matches(`${disclosure}, .btnContent a`)) return;
    event.preventDefault();
    event.stopPropagation();
    event.target.click();
  }

  function preventFragmentNavigation(event) {
    if (event.target.closest('a[href="#"], a[href="#!"]')) event.preventDefault();
  }

  decorate(menu);
  document.addEventListener("click", preventFragmentNavigation, true);
  menu.addEventListener("click", openFromTitle);
  menu.addEventListener("keydown", activateWithSpace);
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === "attributes") {
        if (record.target.matches(disclosure)) describe(record.target);
        continue;
      }
      for (const node of record.addedNodes) {
        if (node.nodeType === 1) decorate(node);
      }
    }
  });
  observer.observe(menu, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
  return () => {
    observer.disconnect();
    document.removeEventListener("click", preventFragmentNavigation, true);
    menu.removeEventListener("click", openFromTitle);
    menu.removeEventListener("keydown", activateWithSpace);
  };
}
