const gap = 8;

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
  const journal = document.getElementById("rightColumn");
  let frame = 0;

  function place() {
    frame = 0;
    const owner = view.gamePage?.tooltipOwnerDomNode;
    if (!owner?.isConnected || !tooltip.textContent.trim() || tooltip.style.display === "none") return;

    if (tooltip.classList.contains("tooltip-in-right-column") && journal.getClientRects().length
      && !journal.hasAttribute("data-collapsed")) {
      if (tooltip.parentElement !== journal) journal.append(tooltip);
      tooltip.removeAttribute("data-floating");
      return;
    }

    if (tooltip.parentElement !== document.body) document.body.append(tooltip);
    tooltip.setAttribute("data-floating", "");
    const anchor = owner.getBoundingClientRect();
    const { width, height } = tooltip.getBoundingClientRect();
    const { x, y } = placeTooltip(anchor, { width, height }, { width: view.innerWidth, height: view.innerHeight });
    for (const [property, value] of [["--tooltip-x", x], ["--tooltip-y", y]]) {
      const length = `${value}px`;
      if (tooltip.style.getPropertyValue(property) !== length) tooltip.style.setProperty(property, length);
    }
  }

  function schedule() {
    if (!frame) frame = view.requestAnimationFrame(place);
  }

  const observer = new MutationObserver(schedule);
  observer.observe(tooltip, { attributes: true, attributeFilter: ["class", "style"], childList: true });
  observer.observe(document.getElementById("game"), { attributes: true, attributeFilter: ["data-panel"] });
  view.addEventListener("resize", schedule);
  document.addEventListener("scroll", schedule, true);
  return () => {
    view.cancelAnimationFrame(frame);
    observer.disconnect();
    view.removeEventListener("resize", schedule);
    document.removeEventListener("scroll", schedule, true);
  };
}
