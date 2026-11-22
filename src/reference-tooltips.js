const gap = 4;

export function placeTooltip(anchor, size, viewport) {
  const leftSpace = anchor.left - gap;
  const rightSpace = viewport.width - anchor.right - gap;
  const bottomSpace = viewport.height - anchor.bottom - gap;
  const topSpace = anchor.top - gap;
  let x = anchor.left;
  let y = anchor.top;
  let maxHeight = viewport.height - 2 * gap;

  if (rightSpace >= size.width + gap) x = anchor.right + gap;
  else if (leftSpace >= size.width + gap) x = anchor.left - size.width - gap;
  else if (bottomSpace >= size.height + gap || bottomSpace >= topSpace) {
    maxHeight = Math.max(40, bottomSpace - gap);
    y = anchor.bottom + gap;
  } else {
    maxHeight = Math.max(40, topSpace - gap);
    y = anchor.top - Math.min(size.height, maxHeight) - gap;
  }

  return {
    x: Math.max(gap, Math.min(x, viewport.width - size.width - gap)),
    y: Math.max(gap, Math.min(y, viewport.height - Math.min(size.height, maxHeight) - gap)),
    maxHeight,
  };
}

export function keepReferenceTooltipsVisible(document) {
  const view = document.defaultView;
  const tooltip = document.getElementById("tooltip");
  const game = document.getElementById("game");
  let frame = 0;

  function place() {
    frame = 0;
    const owner = view.gamePage?.tooltipOwnerDomNode;
    if (!owner?.isConnected || !tooltip.textContent.trim() || tooltip.style.display === "none") return;
    if (!owner.getClientRects().length) {
      view.UIUtils.hideTooltip(view.gamePage);
      return;
    }

    const anchor = owner.getBoundingClientRect();
    const viewport = owner.closest(".tabInner, .widget-content")?.getBoundingClientRect();
    if (viewport && (anchor.bottom <= viewport.top || anchor.top >= viewport.bottom
      || anchor.right <= viewport.left || anchor.left >= viewport.right)) {
      view.UIUtils.hideTooltip(view.gamePage);
      return;
    }
    if (tooltip.parentElement !== document.body) document.body.append(tooltip);
    if (!tooltip.hasAttribute("data-floating")) tooltip.setAttribute("data-floating", "");
    const { width, height } = tooltip.getBoundingClientRect();
    const { x, y, maxHeight } = placeTooltip(anchor, { width, height: Math.max(height, tooltip.scrollHeight + 2) },
      { width: view.innerWidth, height: view.innerHeight });
    for (const [property, value] of [["--tooltip-x", x], ["--tooltip-y", y], ["--tooltip-height", maxHeight]]) {
      const length = `${value}px`;
      if (tooltip.style.getPropertyValue(property) !== length) tooltip.style.setProperty(property, length);
    }
  }

  function schedule() {
    if (!frame) frame = view.requestAnimationFrame(place);
  }

  const observer = new MutationObserver(schedule);
  observer.observe(tooltip, { attributes: true, attributeFilter: ["class", "style"], childList: true });
  observer.observe(game, { attributes: true, attributeFilter: ["data-panel"], childList: true });
  for (const widget of game.querySelectorAll(".game-widget")) {
    observer.observe(widget, { childList: true, attributes: true, attributeFilter: ["style", "data-collapsed"] });
  }
  view.addEventListener("resize", schedule);
  document.addEventListener("scroll", schedule, true);
  return () => {
    view.cancelAnimationFrame(frame);
    observer.disconnect();
    view.removeEventListener("resize", schedule);
    document.removeEventListener("scroll", schedule, true);
  };
}
