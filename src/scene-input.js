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
