import React, { useEffect, useRef } from "react";
import { Icon } from "../Icon.jsx";
import { handleCameraKey, installSceneSelection } from "./camera/scene-input.js";
import "./world-view.css";
import "./camera/scene-input.css";

export function WorldView({ snapshot, subject, view, onSelect, onHover, hover, state, onState }) {
  const canvas = useRef(null);
  const latest = useRef(null);

  useEffect(() => installSceneSelection(canvas.current, onSelect, onHover), [onSelect, onHover]);

  useEffect(() => {
    latest.current = snapshot;
    view.current?.update(snapshot);
  }, [snapshot]);

  useEffect(() => {
    const element = canvas.current;
    let active = true;
    const lost = () => onState("lost");
    const restored = () => onState("loading");
    element.addEventListener("webglcontextlost", lost);
    element.addEventListener("webglcontextrestored", restored);

    import("./scene.js").then(({ createVillageScene }) => {
      if (active) {
        view.current = createVillageScene(element, (renderState) => { if (active) onState(renderState); });
        view.current.update(latest.current);
      }
    }).catch(() => {
      if (active) {
        onState("unavailable");
      }
    });

    return () => {
      active = false;
      view.current?.dispose();
      view.current = null;
      element.removeEventListener("webglcontextlost", lost);
      element.removeEventListener("webglcontextrestored", restored);
    };
  }, [view, onState]);

  const ready = state === "ready" || state === "calculating";

  function keyboard(event) {
    if (ready) handleCameraKey(event, view.current);
  }

  return (
    <div className="world">
      <canvas
        ref={canvas}
        tabIndex={ready ? 0 : -1}
        aria-label="Scène 3D du village"
        onKeyDown={keyboard}
      />
      {!ready && (
        <p className="render-status" role="status">
          {state === "loading" && "Chargement de la scène 3D…"}
          {state === "lost" && "Reconnexion au moteur 3D…"}
          {state === "unavailable" && "La scène 3D nécessite WebGL 2. Les données de la partie restent accessibles."}
        </p>
      )}
      {hover && <span className="world-hover" style={{ left: `${hover.x * 100}%`, top: `${hover.y * 100}%` }}>{hover.name}</span>}
      {subject && <p className="camera-subject"><Icon name="eye" />{subject}</p>}
    </div>
  );
}
