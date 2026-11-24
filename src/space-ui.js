import { quantityDirection } from "./quantity-buttons.js";
import { element, setText } from "./village-ui.js";

const controlsByButton = new WeakMap();

function createControls(document, game, button) {
  const { buttonContent, domNode } = button;
  const label = button.model.metadata.label;
  const controls = element(document, "div", "quantity-controls space-quantity-controls");
  const count = element(document, "output", "space-active-count");
  controls.setAttribute("role", "group");
  controls.setAttribute("aria-label", `Bâtiments actifs · ${label}`);
  const [deactivate, activate] = [["off", "−", "Désactiver"], ["on", "+", "Activer"]].map(([method, sign, action]) =>
    quantityDirection(document, {
      label: (amount) => [action, amount].filter(Boolean).join(" ") + ` · ${label}`,
      sign,
      amounts: [5, 25],
      activate(amount) {
        if (game.isReadOnly() || !button.model.togglable) return;
        button.controller[method](button.model, amount);
        game.ui.update();
      },
    }));
  controls.append(deactivate.group, count, activate.group);
  for (const type of ["click", "keydown", "keypress"]) controls.addEventListener(type, (event) => event.stopPropagation());
  controls.addEventListener("mouseover", (event) => {
    event.stopPropagation();
    if (game.tooltipOwnerDomNode === domNode) document.defaultView.UIUtils.hideTooltip(game);
  });
  for (const link of [button.remove?.off1?.link, button.add?.add1?.link]) {
    link?.parentElement.remove();
  }
  buttonContent.append(controls);
  domNode.classList.add("space-adjustable-building");
  return () => {
    const { on, val } = button.model.metadata;
    const canEdit = !game.isReadOnly();
    controls.hidden = val === 0;
    setText(count, `${on}/${val}`);
    deactivate.enable(canEdit && on > 0);
    activate.enable(canEdit && on < val);
  };
}

export function updateSpaceBuildings(document, game) {
  for (const panel of game.spaceTab.planetPanels ?? []) {
    for (const button of panel.children) {
      if (!button.domNode?.isConnected || !button.model?.togglable) continue;
      let update = controlsByButton.get(button.domNode);
      if (!update) {
        update = createControls(document, game, button);
        controlsByButton.set(button.domNode, update);
      }
      update();
    }
  }
}
