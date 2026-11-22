import { buildingImage } from "./Icon.jsx";

const cards = new WeakMap();

function buildingLabel(button) {
  const metadata = button.model.metadata;
  return metadata.stages?.[metadata.stage]?.label || metadata.label || button.opts.name;
}

function descriptionText(document, button) {
  const metadata = button.model.metadata;
  const description = metadata.stages?.[metadata.stage]?.description ?? metadata.description ?? button.opts.description;
  const template = document.createElement("template");
  template.innerHTML = String(description || "");
  for (const lineBreak of template.content.querySelectorAll("br")) lineBreak.replaceWith("\n");
  return template.content.textContent.trim();
}

function createAction(document, name, activate) {
  const action = document.createElement("button");
  action.type = "button";
  action.dataset.campTool = name;
  action.toggleAttribute("data-camp-icon", true);
  if (activate) action.addEventListener("click", () => activate(action));
  return action;
}

function nativeWrapper(content, link) {
  return Array.from(content.children).find((child) => child.contains(link));
}

function moveStageLinks(content, controls, button) {
  const { stages, stage = 0 } = button.model.metadata;
  for (const { link } of button.stageLinks ?? []) {
    const upgrade = link.textContent.trim() === "^";
    const direction = upgrade ? "up" : "down";
    const wrapper = nativeWrapper(content, link);
    if (controls.querySelector(`[data-camp-stage="${direction}"]`)) {
      wrapper.hidden = true;
      continue;
    }
    const target = stages[stage + (upgrade ? 1 : -1)]?.label ?? buildingLabel(button);
    link.dataset.campStage = direction;
    link.toggleAttribute("data-camp-icon", true);
    link.textContent = upgrade ? "↑" : "↓";
    link.title = upgrade ? `Améliorer en ${target}` : `Revenir à ${target}`;
    link.setAttribute("aria-label", link.title);
    controls.append(wrapper);
  }
}

function addQuantityMenus(document, content, quantity, button) {
  for (const [links, first, many, all, name, label, sign] of [
    [button.remove, "off1", "off25", "offAll", "minus", "Désactiver des bâtiments", "−"],
    [button.add, "add1", "add25", "add", "plus", "Activer des bâtiments", "+"],
  ]) {
    const root = links?.[first]?.link;
    if (!root) continue;
    const wrapper = nativeWrapper(content, root);
    const menu = document.createElement("div");
    menu.className = "camp-quantity-menu";
    menu.popover = "auto";
    menu.setAttribute("role", "group");
    menu.setAttribute("aria-label", label);
    const trigger = createAction(document, name);
    trigger.title = `${label} · Double-clic : ${sign}1`;
    trigger.setAttribute("aria-label", label);
    trigger.popoverTargetElement = menu;
    trigger.addEventListener("click", (event) => {
      if (event.detail > 1) event.preventDefault();
    });
    trigger.addEventListener("dblclick", (event) => {
      event.stopPropagation();
      if (menu.matches(":popover-open")) menu.hidePopover();
      root.click();
    });
    for (const [key, amount] of [[first, "1"], [many, "25"], [all, "max"]]) {
      const action = links[key]?.link;
      if (!action) continue;
      action.textContent = `${sign}${amount}`;
      action.title = action.textContent;
      menu.append(action);
      action.addEventListener("click", () => {
        if (menu.matches(":popover-open")) menu.hidePopover();
      });
    }
    wrapper?.remove();
    quantity.append(trigger, menu);
  }
}

function moveNativeActions(content, toolbar, button) {
  for (const [kind, action] of [["power", button.toggle], ["automation", button.toggleAutomation], ["sell", button.sellHref]]) {
    if (!action?.link) continue;
    action.link.dataset.campNative = kind;
    action.link.toggleAttribute("data-camp-icon", true);
    toolbar.append(nativeWrapper(content, action.link));
  }
}

function createBuildingCard(document, game, button, callbacks) {
  const { buttonContent: content, buttonTitle: title, domNode: node } = button;
  content.classList.add("camp-building-card");

  const preview = document.createElement("div");
  preview.className = "camp-building-preview";
  const picture = document.createElement("img");
  picture.alt = "";
  picture.draggable = false;
  const count = document.createElement("span");
  count.className = "camp-building-count";
  preview.append(picture);

  const quantity = document.createElement("div");
  quantity.className = "camp-building-quantity";
  quantity.append(count);
  addQuantityMenus(document, content, quantity, button);

  const heading = document.createElement("div");
  heading.className = "camp-building-heading";
  heading.append(title);
  const stages = document.createElement("div");
  stages.className = "camp-building-stages";
  moveStageLinks(content, stages, button);

  const toolbar = document.createElement("div");
  toolbar.className = "camp-building-actions";
  toolbar.setAttribute("role", "group");
  const eye = createAction(document, "eye", () => callbacks.inspect(button.opts.building, buildingLabel(button)));
  const info = createAction(document, "info", (trigger) => callbacks.information({
    name: buildingLabel(button),
    description: descriptionText(document, button),
    picture: buildingImage(node.dataset.buildingIcon),
    trigger,
  }));
  info.setAttribute("aria-haspopup", "dialog");
  toolbar.append(eye, info);

  moveNativeActions(content, toolbar, button);
  content.prepend(preview, heading, stages, quantity, toolbar);

  for (const controls of [toolbar, quantity]) {
    controls.addEventListener("click", (event) => event.stopPropagation());
    controls.addEventListener("mouseover", (event) => {
      event.stopPropagation();
      if (game.tooltipOwnerDomNode === node) document.defaultView.UIUtils.hideTooltip(game);
    });
    controls.addEventListener("keydown", (event) => {
      if (event.target.closest("button")) event.stopPropagation();
    });
  }
  content.addEventListener("keypress", (event) => {
    if (event.target.closest("a, button")) event.stopPropagation();
  });
  return { count, eye, info, picture, quantity, toolbar };
}

export function updateBuildingCard(document, game, button, callbacks) {
  const node = button.domNode;
  let card = cards.get(node);
  if (!card) {
    card = createBuildingCard(document, game, button, callbacks);
    cards.set(node, card);
  }

  const { count, eye, info, picture, quantity, toolbar } = card;
  const label = buildingLabel(button);
  if (card.label !== label) {
    eye.setAttribute("aria-label", `Observer ${label}`);
    info.setAttribute("aria-label", `Fiche · ${label}`);
    info.title = info.getAttribute("aria-label");
    toolbar.setAttribute("aria-label", `Actions pour ${label}`);
    card.label = label;
  }

  const icon = node.dataset.buildingIcon;
  if (card.icon !== icon) {
    picture.src = buildingImage(icon);
    card.icon = icon;
  }

  const { val: total, on: active = total } = button.model.metadata;
  const countText = `${active}/${total}`;
  if (count.textContent !== countText) count.textContent = countText;
  const countTitle = `${active} actifs sur ${total}`;
  if (count.title !== countTitle) count.title = countTitle;
  const down = quantity.querySelector('[data-camp-tool="minus"]');
  const up = quantity.querySelector('[data-camp-tool="plus"]');
  if (down) down.disabled = active < 1;
  if (up) up.disabled = active >= total;
  const observationDisabled = total < 1;
  if (eye.disabled !== observationDisabled) eye.disabled = observationDisabled;
  const eyeTitle = observationDisabled ? "Construisez un exemplaire pour l’observer" : `Observer ${label}`;
  if (eye.title !== eyeTitle) eye.title = eyeTitle;

  const sell = button.sellHref?.link;
  const hideSell = !button.model.showSellLink;
  if (sell && sell.hidden !== hideSell) sell.hidden = hideSell;
  for (const control of [button.toggle?.link, button.toggleAutomation?.link]) {
    if (control?.title && control.getAttribute("aria-label") !== control.title) {
      control.setAttribute("aria-label", control.title);
    }
  }
  const readOnly = game.isReadOnly();
  toolbar.toggleAttribute("data-read-only", readOnly);
  if (quantity.toggleAttribute("data-read-only", readOnly)) {
    quantity.querySelector(":popover-open")?.hidePopover();
  }
}
