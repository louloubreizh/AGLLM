import { control, element } from "./village-ui.js";

export function quantityDirection(document, { label, sign, amounts, activate, stepClass = "" }) {
  const group = element(document, "div", "quantity-direction");
  const single = control(document, `quantity-step ${stepClass}`, sign, label(1));
  single.setAttribute("aria-expanded", "false");
  single.setAttribute("aria-keyshortcuts", "ArrowDown");
  const batch = element(document, "div", "quantity-batch");
  batch.popover = "manual";
  batch.setAttribute("role", "group");
  batch.setAttribute("aria-label", label());
  const view = document.defaultView;
  let timer;
  let longPress;
  let touchStart;
  let ignoreClick = false;

  function show() {
    view.clearTimeout(timer);
    if (single.disabled || batch.matches(":popover-open")) return;
    batch.showPopover({ source: single });
    single.setAttribute("aria-expanded", "true");
    document.addEventListener("pointerdown", outside, true);
  }

  function close() {
    view.clearTimeout(timer);
    if (batch.matches(":popover-open")) batch.hidePopover();
    if (single.getAttribute("aria-expanded") === "true") single.setAttribute("aria-expanded", "false");
    document.removeEventListener("pointerdown", outside, true);
  }
  function outside(event) {
    if (!group.contains(event.target)) close();
  }

  group.addEventListener("pointerenter", (event) => { if (event.pointerType !== "touch") show(); });
  group.addEventListener("pointerleave", (event) => {
    if (event.pointerType === "touch") return;
    if (!batch.contains(document.activeElement)) timer = view.setTimeout(close, 150);
  });
  group.addEventListener("focusout", (event) => {
    if (!group.contains(event.relatedTarget)) close();
  });
  group.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" && event.target === single) {
      event.preventDefault();
      show();
      batch.firstElementChild.focus();
    } else if (event.key === "Escape" && batch.matches(":popover-open")) {
      event.stopPropagation();
      single.focus();
      close();
    }
  });
  single.addEventListener("click", (event) => {
    if (!ignoreClick || event.detail === 0) activate(1, event);
    ignoreClick = false;
  });
  single.addEventListener("pointerdown", (event) => {
    ignoreClick = false;
    if (event.pointerType !== "touch") return;
    touchStart = { x: event.clientX, y: event.clientY };
    longPress = view.setTimeout(() => { ignoreClick = true; show(); }, 500);
  });
  function cancelPress() {
    touchStart = null;
    view.clearTimeout(longPress);
  }
  single.addEventListener("pointermove", (event) => {
    if (touchStart && Math.hypot(event.clientX - touchStart.x, event.clientY - touchStart.y) > 8) cancelPress();
  });
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) {
    single.addEventListener(type, cancelPress);
  }
  single.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    if (event.pointerType === "touch") ignoreClick = true;
    cancelPress();
    show();
  });
  for (const amount of amounts) {
    const item = control(document, "quantity-batch-action", `${sign}${amount}`, label(amount));
    item.addEventListener("click", (event) => {
      if (event.detail === 0) single.focus();
      activate(amount, event);
      close();
    });
    batch.append(item);
  }
  group.append(single, batch);
  return {
    group,
    enable(enabled) {
      single.disabled = !enabled;
      if (!enabled) close();
    },
  };
}
