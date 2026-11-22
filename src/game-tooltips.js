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

export function installGameTooltips(document) {
  const window = document.defaultView;
  const tooltip = document.getElementById("tooltip");
  const widgets = [...document.querySelectorAll("#leftColumn, #midColumn, #rightColumn")];
  let frame = 0;

  function place() {
    frame = 0;
    const owner = window.gamePage?.tooltipOwnerDomNode;
    if (!owner?.isConnected || !tooltip.textContent.trim() || !tooltip.getClientRects().length) {
      tooltip.removeAttribute("data-anchored");
      return;
    }

    const anchor = owner.getBoundingClientRect();
    const widget = owner.closest("#leftColumn, #midColumn, #rightColumn")?.getBoundingClientRect();
    const viewport = { width: window.innerWidth, height: window.innerHeight };
    if (!anchor.width || !anchor.height || anchor.bottom <= 0 || anchor.top >= viewport.height
      || anchor.right <= 0 || anchor.left >= viewport.width
      || (widget && (anchor.bottom <= widget.top || anchor.top >= widget.bottom
        || anchor.right <= widget.left || anchor.left >= widget.right))) {
      tooltip.removeAttribute("data-anchored");
      return;
    }

    if (tooltip.parentElement !== document.body) document.body.append(tooltip);
    const size = { width: tooltip.getBoundingClientRect().width, height: tooltip.scrollHeight + 2 };
    const { x, y, maxHeight } = placeTooltip(anchor, size, viewport);
    for (const [property, value] of [["--hint-x", x], ["--hint-y", y], ["--hint-max-height", maxHeight]]) {
      const length = `${value}px`;
      if (tooltip.style.getPropertyValue(property) !== length) tooltip.style.setProperty(property, length);
    }
    tooltip.setAttribute("data-anchored", "");
  }

  function schedule() {
    if (!frame) frame = window.requestAnimationFrame(place);
  }

  function keyboardDescription(event) {
    if (event.target === tooltip && event.key === "Escape") {
      const owner = window.gamePage?.tooltipOwnerDomNode;
      if (owner) {
        event.preventDefault();
        event.stopPropagation();
        window.UIUtils.hideTooltip(window.gamePage);
        owner.focus({ preventScroll: true });
      }
    } else if (event.code === "Space" && event.target.matches?.(".btn.modern")) {
      event.preventDefault();
      event.stopPropagation();
      event.target.dispatchEvent(new window.MouseEvent("mouseover", { bubbles: true }));
      window.cancelAnimationFrame(frame);
      place();
      tooltip.focus({ preventScroll: true });
    }
  }

  const observer = new MutationObserver(schedule);
  observer.observe(tooltip, { attributes: true, attributeFilter: ["style", "class"], childList: true });
  for (const widget of widgets) observer.observe(widget, { attributes: true, attributeFilter: ["style"] });
  const resizing = new ResizeObserver(schedule);
  resizing.observe(tooltip);
  window.addEventListener("resize", schedule);
  document.addEventListener("scroll", schedule, true);
  document.addEventListener("keydown", keyboardDescription, true);
  schedule();

  return () => {
    window.cancelAnimationFrame(frame);
    observer.disconnect();
    resizing.disconnect();
    window.removeEventListener("resize", schedule);
    document.removeEventListener("scroll", schedule, true);
    document.removeEventListener("keydown", keyboardDescription, true);
  };
}
