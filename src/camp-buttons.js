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

function moveStageLinks(content, toolbar, before, after, button) {
  const { stages, stage = 0 } = button.model.metadata;
  for (const { link } of button.stageLinks ?? []) {
    const upgrade = link.textContent.trim() === "^";
    const direction = upgrade ? "up" : "down";
    const wrapper = nativeWrapper(content, link);
    if (!wrapper) continue;
    if (toolbar.querySelector(`[data-camp-stage="${direction}"]`)) {
      wrapper.hidden = true;
      continue;
    }
    const target = stages[stage + (upgrade ? 1 : -1)]?.label ?? buildingLabel(button);
    link.dataset.campStage = direction;
    link.toggleAttribute("data-camp-icon", true);
    link.textContent = upgrade ? "↑" : "↓";
    link.title = upgrade ? `Améliorer en ${target}` : `Revenir à ${target}`;
    link.setAttribute("aria-label", link.title);
    (upgrade ? before : after).append(wrapper);
  }
}

function addQuantityMenus(document, content, controls, button) {
  for (const [links, first, many, all, name, label, sign, method] of [
    [button.remove, "off1", "off25", "offAll", "minus", "Désactiver des bâtiments", "−", "off"],
    [button.add, "add1", "add25", "add", "plus", "Activer des bâtiments", "+", "on"],
  ]) {
    const root = links?.[first]?.link;
    const trigger = createAction(document, name);
    trigger.setAttribute("aria-label", label);
    controls.append(trigger);
    if (!root) {
      trigger.disabled = true;
      continue;
    }
    const wrapper = nativeWrapper(content, root);
    const menu = document.createElement("div");
    menu.className = "camp-quantity-menu";
    menu.popover = "auto";
    menu.setAttribute("role", "group");
    menu.setAttribute("aria-label", label);
    trigger.title = `${label} · Double-clic : ${sign}1`;
    trigger.popoverTargetElement = menu;
    trigger.addEventListener("click", (event) => {
      if (event.detail > 1) event.preventDefault();
    });
    trigger.addEventListener("dblclick", (event) => {
      event.stopPropagation();
      if (menu.matches(":popover-open")) menu.hidePopover();
      root.click();
    });
    const five = document.createElement("button");
    five.type = "button";
    five.textContent = `${sign}5`;
    five.addEventListener("click", () => {
      if (!button.game.isReadOnly()) {
        button.animate();
        button.controller[method](button.model, 5);
      }
      menu.hidePopover();
    });
    menu.append(five);
    for (const [key, amount] of [[many, "25"], [all, "max"]]) {
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
    controls.append(menu);
  }
}

function moveNativeActions(content, toolbar, before, after, button) {
  for (const [kind, action, target] of [
    ["power", button.toggle, before], ["automation", button.toggleAutomation, after], ["sell", button.sellHref, after],
  ]) {
    if (!action?.link || toolbar.contains(action.link)) continue;
    action.link.dataset.campNative = kind;
    action.link.toggleAttribute("data-camp-icon", true);
    const wrapper = nativeWrapper(content, action.link);
    if (wrapper) target.append(wrapper);
  }
}

function createCardLayout(document, content, title) {
  content.classList.add("camp-building-card");

  const preview = document.createElement("div");
  preview.className = "camp-building-preview";
  const picture = document.createElement("img");
  picture.alt = "";
  picture.draggable = false;
  const count = document.createElement("span");
  count.className = "camp-building-count";
  preview.append(picture);

  const heading = document.createElement("div");
  heading.className = "camp-building-heading";
  const activity = document.createElement("div");
  activity.className = "camp-building-activity";
  activity.append(count);
  heading.append(title, activity);
  const toolbar = document.createElement("div");
  toolbar.className = "camp-building-actions";
  toolbar.setAttribute("role", "group");
  const primary = document.createElement("div");
  primary.className = "camp-building-primary";
  const before = document.createElement("div");
  const after = document.createElement("div");
  before.className = "camp-actions-before";
  after.className = "camp-actions-after";
  toolbar.append(before, primary, after);
  content.prepend(preview, heading, toolbar);
  return { picture, count, activity, toolbar, primary, before, after };
}

function createBuildingCard(document, game, button, callbacks) {
  const { buttonContent: content, buttonTitle: title, domNode: node } = button;
  const layout = createCardLayout(document, content, title);
  const { activity, toolbar, primary, before, after } = layout;
  const eye = createAction(document, "eye", () => callbacks.inspect(button.opts.building, buildingLabel(button)));
  const info = createAction(document, "info", (trigger) => callbacks.information({
    name: buildingLabel(button),
    description: descriptionText(document, button),
    picture: buildingImage(node.dataset.buildingIcon),
    trigger,
  }));
  info.setAttribute("aria-haspopup", "dialog");
  primary.append(eye, info);
  addQuantityMenus(document, content, activity, button);
  moveNativeActions(content, toolbar, before, after, button);
  moveStageLinks(content, toolbar, before, after, button);

  for (const controls of [activity, toolbar]) {
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
  return { ...layout, eye, info };
}

export function updateBuildingCard(document, game, button, callbacks) {
  const node = button.domNode;
  let card = cards.get(node);
  if (!card) {
    card = createBuildingCard(document, game, button, callbacks);
    cards.set(node, card);
  }

  const { count, eye, info, picture, activity, toolbar, before, after } = card;
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
  const readOnly = game.isReadOnly();
  const down = activity.querySelector('[data-camp-tool="minus"]');
  const up = activity.querySelector('[data-camp-tool="plus"]');
  down.disabled = readOnly || !button.remove || active < 1;
  up.disabled = readOnly || !button.add || active >= total;
  node.toggleAttribute("data-camp-unavailable", !button.model.enabled);
  const observationDisabled = total < 1;
  if (eye.disabled !== observationDisabled) eye.disabled = observationDisabled;
  const eyeTitle = observationDisabled ? "Construisez un exemplaire pour l’observer" : `Observer ${label}`;
  if (eye.title !== eyeTitle) eye.title = eyeTitle;

  const sell = button.sellHref?.link;
  const hideSell = !button.model.showSellLink;
  if (sell) {
    if (!toolbar.contains(sell)) moveNativeActions(button.buttonContent, toolbar, before, after, button);
    if (sell.hidden !== hideSell) sell.hidden = hideSell;
    const sellLabel = `Vendre · ${label}`;
    if (sell.getAttribute("aria-label") !== sellLabel) sell.setAttribute("aria-label", sellLabel);
  }
  for (const control of [button.toggle?.link, button.toggleAutomation?.link]) {
    if (control?.title && control.getAttribute("aria-label") !== control.title) {
      control.setAttribute("aria-label", control.title);
    }
  }
  if (toolbar.toggleAttribute("data-read-only", readOnly)) {
    activity.querySelector(":popover-open")?.hidePopover();
  }
}
