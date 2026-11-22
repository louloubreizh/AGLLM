import { buildingImage, iconImage } from "./Icon.jsx";

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
  const image = document.createElement("img");
  image.src = iconImage(name);
  image.alt = "";
  image.draggable = false;
  action.append(image);
  action.addEventListener("click", (event) => {
    event.stopPropagation();
    activate(action);
  });
  return action;
}

export function addBuildingActions(document, game, button, callbacks) {
  const node = button.domNode;
  let header = node.querySelector(":scope > .camp-building-header");
  if (!header) {
    header = document.createElement("div");
    header.className = "camp-building-header";
    const identity = document.createElement("div");
    identity.className = "camp-building-identity";
    const count = document.createElement("span");
    count.className = "camp-building-count";
    identity.append(button.buttonTitle, count);
    const actions = document.createElement("div");
    actions.className = "camp-building-actions";
    const eye = createAction(document, "eye", () => callbacks.inspect(button.opts.building, buildingLabel(button)));
    const info = createAction(document, "info", (trigger) => callbacks.information({
      name: buildingLabel(button),
      description: descriptionText(document, button),
      picture: buildingImage(node.dataset.buildingIcon),
      trigger,
    }));
    info.setAttribute("aria-haspopup", "dialog");
    actions.append(eye, info);
    header.append(identity, actions);
    node.prepend(header);
    actions.addEventListener("mouseover", (event) => {
      event.stopPropagation();
      if (game.tooltipOwnerDomNode === node) document.defaultView.UIUtils.hideTooltip(game);
    });
    for (const type of ["keydown", "keypress", "keyup"]) {
      actions.addEventListener(type, (event) => event.stopPropagation());
    }
    button.buttonContent.addEventListener("keypress", (event) => {
      if (event.target.closest("a")) event.stopPropagation();
    });
  }
  const count = header.querySelector(".camp-building-count");
  const amount = button.buttonTitle.querySelector(".amt")?.textContent;
  const total = button.model.metadata.val;
  const quantity = amount?.includes("/") ? amount : "(" + total + ")";
  if (count.textContent !== quantity) count.textContent = quantity;
  // Magneto bonuses can already be included in the native title.
  count.hidden = !button.buttonTitle.querySelector(".label") && !amount;

  const [eye, info] = header.querySelector(".camp-building-actions").children;
  const label = buildingLabel(button);
  const disabled = total < 1;
  if (eye.disabled !== disabled) eye.disabled = disabled;
  const observation = `Observer ${label}`;
  const observationTitle = disabled ? "Construisez un exemplaire pour l’observer" : observation;
  if (eye.title !== observationTitle) eye.title = observationTitle;
  if (eye.getAttribute("aria-label") !== observation) eye.setAttribute("aria-label", observation);
  const information = `Informations sur ${label}`;
  if (info.title !== information) {
    info.title = information;
    info.setAttribute("aria-label", information);
  }
}
