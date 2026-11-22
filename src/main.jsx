import React, { useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { GameInformation } from "./GameInformation.jsx";
import { Icon } from "./Icon.jsx";
import { GameInterface } from "./GameInterface.jsx";
import { useGame } from "./use-game.js";
import { WorldView } from "./WorldView.jsx";
import "./style.css";

const panels = [["play", "Jeu", "camp"], ["resources", "Ressources", "resources"], ["journal", "Journal", "journal"]];
const actions = [
  ["Sauvegarder", "save", "#save-link"],
  ["Options", "settings", "#options-link"],
  ["Connexion", "account", ".kgnet-login-link-container"],
];

const statuses = {
  checking: "Démarrage",
  waiting: "Partie ouverte dans un autre onglet",
  loading: "Chargement de Kittens Game",
  playing: "Partie en cours",
  missing: "Dossier de Kittens Game introuvable",
  stopped: "KGLLM est arrêté",
};

function App() {
  const { frame, showGame, snapshot, status } = useGame();
  const [camera, setCamera] = useState(null);
  const [panel, setPanel] = useState("play");
  const [saveFeedback, setSaveFeedback] = useState("");
  const cameraButton = useRef(null);
  const cameraView = useRef(null);
  const gameReady = status === "playing";

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
      <nav className="topbar" aria-label="Navigation KGLLM">
        <div className="wordmark"><span className="brand-icon"><Icon name="brand" /></span>KGLLM <small>v0.1</small></div>
        {showGame && !camera && (
          <div className="game-actions">
            {actions.map(([label, mark, selector]) => (
              <button key={selector} type="button" disabled={!gameReady} aria-label={label} title={label}
                onClick={() => frame.current?.contentDocument?.querySelector(selector)?.click()}>
                <Icon name={mark} />
                <span className="action-label">{label}</span>
              </button>
            ))}
          </div>
        )}
        <GameInformation snapshot={snapshot} stateLabel={snapshot?.paused ? "Partie en pause" : statuses[status]}
          saveFeedback={showGame ? saveFeedback : ""} />
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
        {showGame ? (
          <GameInterface frame={frame} panel={panel} visible={!camera} camera={cameraView} onInspect={inspect} onSaveFeedback={setSaveFeedback} />
        ) : (
          <div className="game-message">
            <strong role="status"><Icon name="info" />{statuses[status]}</strong>
            {status === "stopped" && <p>Relancez KGLLM depuis le Bureau pour reprendre votre partie.</p>}
            {status === "waiting" && <p>Fermez l’autre onglet KGLLM pour poursuivre votre partie ici.</p>}
            {status === "missing" && <p>Vérifiez le dossier kittensgame-master ou le chemin KGLLM_GAME_DIR.</p>}
            {status === "checking" && <p>Préparation de la partie…</p>}
          </div>
        )}
      </main>
      {showGame && !camera && (
        <nav className="panel-switcher" aria-label="Panneaux de jeu">
          {panels.map(([name, label, icon]) => (
            <button key={name} type="button" aria-label={label} onClick={() => setPanel(name)} aria-pressed={panel === name}>
              <Icon name={icon} /><span className="panel-label">{label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
