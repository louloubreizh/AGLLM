import React, { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon.jsx";
import { handleCameraKey } from "./scene-input.js";

export function WorldView({ snapshot, active, subject, view }) {
  const canvas = useRef(null);
  const latest = useRef(null);
  const [state, setState] = useState("loading");

  useEffect(() => {
    latest.current = snapshot;
    view.current?.update(snapshot);
  }, [snapshot]);

  useEffect(() => {
    const element = canvas.current;
    let active = true;
    const lost = () => setState("lost");
    const restored = () => setState("ready");
    element.addEventListener("webglcontextlost", lost);
    element.addEventListener("webglcontextrestored", restored);

    import("./world/scene.js").then(({ createVillageScene }) => {
      if (active) {
        view.current = createVillageScene(element);
        view.current.update(latest.current);
        setState("ready");
      }
    }).catch(() => {
      if (active) {
        setState("unavailable");
      }
    });

    return () => {
      active = false;
      view.current?.dispose();
      view.current = null;
      element.removeEventListener("webglcontextlost", lost);
      element.removeEventListener("webglcontextrestored", restored);
    };
  }, [view]);

  const ready = state === "ready";
  useEffect(() => {
    view.current?.setCameraMode(active);
    if (active && ready) {
      canvas.current?.focus({ preventScroll: true });
    }
  }, [active, ready]);

  function keyboard(event) {
    if (active && ready) handleCameraKey(event, view.current);
  }

  return (
    <div className={`world ${active ? "camera-active" : ""}`}>
      <canvas
        ref={canvas}
        tabIndex={active && ready ? 0 : -1}
        aria-label="Scène 3D du village"
        aria-describedby={active ? "camera-instructions" : undefined}
        onKeyDown={keyboard}
      />
      {!ready && (
        <p className="render-status" role="status">
          {state === "loading" && "Chargement de la scène 3D…"}
          {state === "lost" && "Reconnexion au moteur 3D…"}
          {state === "unavailable" && "La scène 3D nécessite WebGL 2. Les données de la partie restent accessibles."}
        </p>
      )}
      {subject && <p className="camera-subject"><Icon name="eye" />{subject}</p>}
      {active && <div className="camera">
        <p id="camera-instructions">Glisser ou utiliser les flèches pour tourner. Clic droit maintenu pour déplacer la vue. Molette pour zoomer.</p>
        <div className="camera-actions" aria-label="Commandes de la caméra">
          <button type="button" disabled={!ready} onClick={() => view.current.zoomOut()} aria-label="Zoom arrière"><Icon name="zoomOut" /></button>
          <button type="button" disabled={!ready} onClick={() => view.current.zoomIn()} aria-label="Zoom avant"><Icon name="zoomIn" /></button>
          <button type="button" disabled={!ready} onClick={() => view.current.reset()}><Icon name="center" />Recentrer</button>
        </div>
      </div>}
    </div>
  );
}
