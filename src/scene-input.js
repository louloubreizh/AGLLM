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

export function installSceneInput(document, camera) {
  const surface = document.createElement("div");
  surface.className = "kgllm-scene-input";
  surface.tabIndex = 0;
  surface.setAttribute("role", "region");
  surface.setAttribute("aria-label", "Caméra du village");
  document.body.prepend(surface);
  const controller = new document.defaultView.AbortController();
  const { signal } = controller;
  const pointers = new Map();

  function distance() {
    const [a, b] = pointers.values();
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  surface.addEventListener("pointerdown", (event) => {
    if (!camera.current || event.button !== 0 || pointers.size >= 2) return;
    surface.focus({ preventScroll: true });
    surface.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
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
  surface.addEventListener("keydown", (event) => handleCameraKey(event, camera.current), { signal });
  surface.addEventListener("keyup", (event) => {
    if (Object.hasOwn(cameraCommands, event.key)) event.stopPropagation();
  }, { signal });

  return () => {
    controller.abort();
    surface.remove();
  };
}
