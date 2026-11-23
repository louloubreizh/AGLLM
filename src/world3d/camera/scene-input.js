const cameraCommands = {
  ArrowLeft: (view) => view.rotate(0.16, 0),
  ArrowRight: (view) => view.rotate(-0.16, 0),
  ArrowUp: (view) => view.rotate(0, 0.12),
  ArrowDown: (view) => view.rotate(0, -0.12),
  "+": (view) => view.zoomIn(),
  "-": (view) => view.zoomOut(),
  Home: (view) => view.reset(),
};

export function handleCameraKey(event, view) {
  if (!view || !Object.hasOwn(cameraCommands, event.key)) return;
  event.preventDefault();
  cameraCommands[event.key](view);
}

export function installSceneSelection(surface, onSelect, onHover) {
  const controller = new surface.ownerDocument.defaultView.AbortController();
  const { signal } = controller;
  let press;
  let pending;
  const window = surface.ownerDocument.defaultView;

  function pointAt(event) {
    const bounds = surface.getBoundingClientRect();
    return { x: (event.clientX - bounds.left) / bounds.width, y: (event.clientY - bounds.top) / bounds.height };
  }

  function clearHover() {
    window.cancelAnimationFrame(pending);
    pending = undefined;
    onHover(null);
    surface.classList.remove("is-inspectable");
  }

  surface.addEventListener("pointerdown", (event) => {
    clearHover();
    press = event.isPrimary && event.button === 0
      ? { id: event.pointerId, x: event.clientX, y: event.clientY } : null;
  }, { signal });
  function moved(event) {
    return Math.hypot(event.clientX - press.x, event.clientY - press.y) > 5;
  }
  surface.addEventListener("pointermove", (event) => {
    if (press?.id === event.pointerId && moved(event)) press = null;
    if (event.pointerType === "mouse" && !event.buttons) {
      window.cancelAnimationFrame(pending);
      const point = pointAt(event);
      pending = window.requestAnimationFrame(() => {
        surface.classList.toggle("is-inspectable", onHover(point));
      });
    }
  }, { signal });
  surface.addEventListener("pointerleave", clearHover, { signal });
  surface.addEventListener("wheel", clearHover, { signal, passive: true });
  surface.addEventListener("pointerup", (event) => {
    if (press?.id === event.pointerId && event.button === 0 && !moved(event)) {
      const { x, y } = pointAt(event);
      if (x >= 0 && x <= 1 && y >= 0 && y <= 1) onSelect(x, y);
    }
    press = null;
  }, { signal });
  for (const event of ["pointercancel", "lostpointercapture"]) {
    surface.addEventListener(event, () => { press = null; }, { signal });
  }
  for (const event of ["mousedown", "auxclick"]) {
    surface.addEventListener(event, (pointer) => {
      if (pointer.button === 1) pointer.preventDefault();
    }, { signal });
  }
  surface.addEventListener("contextmenu", (event) => event.preventDefault(), { signal });
  return () => {
    window.cancelAnimationFrame(pending);
    controller.abort();
    surface.classList.remove("is-inspectable");
  };
}

export function installSceneInput(document, camera, onSelect, onHover, onExit) {
  const surface = document.createElement("div");
  surface.className = "reference-scene-input";
  surface.tabIndex = 0;
  surface.setAttribute("role", "region");
  surface.setAttribute("aria-label", "Caméra du village");
  document.body.prepend(surface);
  const controller = new document.defaultView.AbortController();
  const { signal } = controller;
  const removeSelection = installSceneSelection(surface, onSelect, onHover);
  const pointers = new Map();

  function distance() {
    const [a, b] = pointers.values();
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  surface.addEventListener("pointerdown", (event) => {
    const touch = event.pointerType !== "mouse";
    if (!camera.current || pointers.size >= 2 || (!touch && event.button !== 1 && event.button !== 2)) return;
    if (!touch) event.preventDefault();
    surface.focus({ preventScroll: true });
    surface.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY, pan: !touch && event.button === 2 });
    surface.classList.add("is-moving");
  }, { signal });

  surface.addEventListener("pointermove", (event) => {
    const point = pointers.get(event.pointerId);
    if (!point || !camera.current) return;
    const pinch = pointers.size === 2;
    const previousDistance = pinch ? distance() : 0;
    const dx = event.clientX - point.x;
    const dy = event.clientY - point.y;
    point.x = event.clientX;
    point.y = event.clientY;
    if (pinch) {
      const nextDistance = distance();
      if (previousDistance > 0 && nextDistance > 0) camera.current.zoom(previousDistance / nextDistance);
    } else if (point.pan) {
      camera.current.pan(dx, dy);
    } else {
      const scale = 2 * Math.PI / Math.max(260, surface.clientHeight);
      camera.current.rotate(dx * scale, dy * scale);
    }
  }, { signal });

  function endPointer(event) {
    pointers.delete(event.pointerId);
    if (!pointers.size) surface.classList.remove("is-moving");
  }
  for (const event of ["pointerup", "pointercancel", "lostpointercapture"]) {
    surface.addEventListener(event, endPointer, { signal });
  }

  surface.addEventListener("wheel", (event) => {
    if (!camera.current || event.ctrlKey) return;
    event.preventDefault();
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? surface.clientHeight : 1;
    camera.current.zoom(Math.exp(Math.max(-0.7, Math.min(0.7, event.deltaY * unit * 0.002))));
  }, { signal, passive: false });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") onExit();
  }, { signal, capture: true });
  surface.addEventListener("keydown", (event) => handleCameraKey(event, camera.current), { signal });
  surface.addEventListener("keyup", (event) => {
    if (Object.hasOwn(cameraCommands, event.key)) event.stopPropagation();
  }, { signal });

  return () => {
    controller.abort();
    removeSelection();
    surface.remove();
  };
}
