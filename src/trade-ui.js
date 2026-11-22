import { element, villageIcon } from "./village-ui.js";

function formatOffers(document, game, panel, notes) {
  const names = new Map(
    [...panel.race.buys, ...panel.race.sells, { name: "titanium" }].map(({ name }) => {
      const resource = game.resPool.get(name);
      return [resource.title || name, name];
    }),
  );
  for (const [kind, key] of [["buys", "trade.buys"], ["sells", "trade.sells"]]) {
    const markers = [...notes.querySelectorAll(`:scope > div > .${kind}`)];
    if (!markers.length) continue;
    const group = element(document, "section", `trade-offers trade-offers-${kind}`);
    const label = markers.find((marker) => marker.textContent.trim())?.textContent
      ?? document.defaultView.$I(key);
    const heading = element(document, "h3", "", label.replace(/[:\s]+$/, ""));
    const list = element(document, "dl");
    for (const marker of markers) {
      const original = marker.parentElement;
      const amount = original.querySelector(".tradeAmount");
      if (!amount) continue;
      const name = [...original.childNodes].filter((node) => node.nodeType === 3)
        .map((node) => node.textContent).join("").trim();
      const row = element(document, "div", "trade-offer");
      const title = element(document, "dt");
      const icon = names.get(name);
      if (icon) title.append(villageIcon(document, icon));
      title.append(name);
      row.append(title, element(document, "dd", "", amount.textContent.trim()));
      list.append(row);
      original.remove();
    }
    group.append(heading, list);
    notes.append(group);
  }
}

function markPin(pin, pinned) {
  if (!pin) return;
  if (!pin.hasAttribute("data-trade-pin")) {
    pin.setAttribute("data-trade-pin", "");
    pin.setAttribute("role", "button");
    pin.addEventListener("keydown", (event) => {
      if (event.key !== " ") return;
      event.preventDefault();
      event.stopPropagation();
      pin.click();
    });
  }
  const state = String(Boolean(pinned));
  if (pin.getAttribute("aria-pressed") !== state) pin.setAttribute("aria-pressed", state);
  if (pin.getAttribute("aria-label") !== pin.title) pin.setAttribute("aria-label", pin.title);
}

export function updateTrade(document, game) {
  for (const panel of game.diplomacyTab.racePanels) {
    const content = panel.contentDiv;
    if (!content?.isConnected) continue;
    if (!content.hasAttribute("data-trade-offers")) {
      const notes = content.querySelector(":scope > .left");
      if (notes) formatOffers(document, game, panel, notes);
      content.setAttribute("data-trade-offers", "");
    }
    for (const button of [panel.embassyButton, panel.autoPinnedButton]) {
      markPin(button?.pinLinkHref?.link, panel.race.pinned);
    }
    for (const [button, available] of [
      [panel.feedBtn, game.resPool.get("necrocorn").value >= 1],
      [panel.buyBcoin, game.resPool.get("relic").value > 0],
      [panel.sellBcoin, game.resPool.get("blackcoin").value > 0],
    ]) {
      if (!button?.domNode?.isConnected) continue;
      button.domNode.toggleAttribute("data-trade-unavailable", !available);
    }
  }
}
