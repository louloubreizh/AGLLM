import React, { useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { GameInformation } from "./GameInformation.jsx";
import { GameOptions } from "./GameOptions.jsx";
import { Icon } from "./Icon.jsx";
import { GameInterface } from "./GameInterface.jsx";
import { useGame } from "./use-game.js";
import { WorldView } from "./WorldView.jsx";
import "./style.css";

const panels = [["play", "Jeu", "camp"], ["resources", "Ressources", "resources"], ["journal", "Journal", "journal"]];
const statuses = {
  checking: "Démarrage",
  waiting: "Partie ouverte dans un autre onglet",
  playing: "Partie en cours",
  stopped: "AGLLM est arrêté",
};

function App() {
  const game = useGame();
  const { snapshot, state, status, notice } = game;
  const [camera, setCamera] = useState(null);
  const [panel, setPanel] = useState("play");
  const [options, setOptions] = useState(false);
  const cameraButton = useRef(null);
  const cameraView = useRef(null);
  const pauseLabel = snapshot?.paused ? "Reprendre la partie" : "Mettre en pause";

  const inspect = useCallback((type, name) => {
    if (cameraView.current?.inspect(type)) setCamera(name);
  }, []);

  const closeCamera = useCallback(() => {
    cameraView.current?.endInspection();
    setCamera(null);
  }, []);

  useEffect(() => {
    if (!camera) {
      return;
    }
    function exitCamera(event) {
      if (event.key === "Escape") {
        closeCamera();
        cameraButton.current?.focus();
      }
    }
    window.addEventListener("keydown", exitCamera);
    return () => window.removeEventListener("keydown", exitCamera);
  }, [camera, closeCamera]);

  return (
    <div className="shell">
      <nav className="topbar" aria-label="Navigation AGLLM">
        <div className="wordmark" aria-label="AnimalGame LouisLeMaitre"><span className="brand-icon"><Icon name="brand" /></span>AGLLM</div>
        {state && !camera && (
          <div className="game-actions">
            <button type="button" aria-label={pauseLabel} title={pauseLabel} onClick={() => game.act("pause")}>
              <Icon name={snapshot.paused ? "play" : "pause"} />
            </button>
            <button type="button" aria-label="Sauvegarder" title="Sauvegarder" onClick={game.save}>
              <Icon name="save" /><span className="action-label">Sauvegarder</span>
            </button>
            <button type="button" aria-label="Options" title="Options" onClick={() => setOptions(true)}>
              <Icon name="settings" /><span className="action-label">Options</span>
            </button>
          </div>
        )}
        <GameInformation snapshot={snapshot} stateLabel={snapshot?.paused ? "Partie en pause" : statuses[status]}
          saveFeedback={state ? notice : ""} />
        {status !== "stopped" && (
          <button ref={cameraButton} className="camera-toggle" type="button" aria-label={camera ? "Revenir au jeu" : "Caméra 3D"}
            onClick={() => { if (camera) closeCamera(); else setCamera(true); }}>
            <Icon name={camera ? "camp" : "world"} />
            <span className="action-label">{camera ? "Revenir au jeu" : "Caméra 3D"}</span>
          </button>
        )}
      </nav>
      <main className="playfield" aria-label="Village et commandes de la partie">
        {status !== "stopped" && (
          <WorldView snapshot={snapshot} active={Boolean(camera)} subject={typeof camera === "string" ? camera : null} view={cameraView} />
        )}
        {state ? (
          <>
            <GameInterface state={state} act={game.act} panel={panel} visible={!camera} onInspect={inspect} />
            {options && <GameOptions game={game} onClose={() => setOptions(false)} />}
          </>
        ) : (
          <div className="game-message">
            <strong role="status"><Icon name="info" />{statuses[status]}</strong>
            {status === "stopped" && <p>Relancez AGLLM avec start.cmd pour reprendre votre partie.</p>}
            {status === "waiting" && <p>Fermez l’autre onglet AGLLM pour poursuivre votre partie ici.</p>}
            {status === "checking" && <p>Préparation de la partie…</p>}
          </div>
        )}
      </main>
      {state && !camera && (
        <nav className="panel-switcher" aria-label="Panneaux de jeu">
          {panels.map(([name, label, icon]) => (
            <button key={name} type="button" aria-label={label} onClick={() => setPanel(name)} aria-pressed={panel === name}>
              <Icon name={icon} /><span className="panel-label">{label}</span>
            </button>
          ))}
        </nav>
      )}
      <div className="save-notice" role="status">{state ? notice : ""}</div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
