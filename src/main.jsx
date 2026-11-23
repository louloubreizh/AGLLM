import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { GameInformation } from "./GameInformation.jsx";
import { Icon } from "./Icon.jsx";
import { ReferenceInterface } from "./ReferenceInterface.jsx";
import { ResidentSpeciesPicker } from "./ResidentSpeciesPicker.jsx";
import { loadResidentSpecies, saveResidentSpecies } from "./resident-species.js";
import { useReferenceGame } from "./use-reference-game.js";
import { WorldView } from "./world3d/WorldView.jsx";
import "./style.css";

const panels = [["resources", "Ressources", "resources"], ["play", "Jeu", "camp"], ["journal", "Journal", "journal"]];
const statuses = {
  checking: "Démarrage",
  waiting: "Partie ouverte dans un autre onglet",
  playing: "Partie en cours",
  loading: "Chargement du moteur AGLLM",
  missing: "Moteur AGLLM indisponible",
  stopped: "AGLLM est arrêté",
};

function App() {
  const game = useReferenceGame();
  const { snapshot, state, status, notice } = game;
  const ready = status === "playing";
  const [camera, setCamera] = useState(null);
  const [panel, setPanel] = useState("play");
  const [species, setSpecies] = useState(loadResidentSpecies);
  const worldSnapshot = useMemo(() => snapshot && { ...snapshot, species }, [snapshot, species]);

  function changeSpecies(value) {
    setSpecies(value);
    saveResidentSpecies(value);
  }

  const cameraView = useRef(null);
  const pauseLabel = snapshot?.paused ? "Reprendre la partie" : "Mettre en pause";

  const inspect = useCallback((type, name) => {
    if (cameraView.current?.inspect(type)) setCamera(name);
  }, []);
  const inspectResident = useCallback((id) => {
    const name = cameraView.current?.inspectResident(id);
    if (name) setCamera(name);
  }, []);

  const [hover, setHover] = useState(null);
  const onHover = useCallback((point) => {
    const name = cameraView.current?.hover(point);
    setHover(name ? { ...point, name } : null);
    return Boolean(name);
  }, []);

  const select = useCallback((x, y) => {
    const name = cameraView.current?.pick(x, y);
    if (name) setCamera(name);
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
      if (event.key === "Escape" && !document.querySelector(".species-popover:popover-open")) {
        closeCamera();
      }
    }
    window.addEventListener("keydown", exitCamera);
    return () => window.removeEventListener("keydown", exitCamera);
  }, [camera, closeCamera]);

  return (
    <div className="shell">
      <nav className="topbar" aria-label="Navigation AGLLM">
        <ResidentSpeciesPicker species={species} onChange={changeSpecies} />
        {ready && (
          <div className="game-actions">
            <button type="button" aria-label={pauseLabel} title={pauseLabel} onClick={() => game.act("pause")}>
              <Icon name={snapshot?.paused ? "play" : "pause"} />
            </button>
            <button type="button" aria-label="Sauvegarder" title="Sauvegarder" onClick={game.save}>
              <Icon name="save" /><span className="action-label">Sauvegarder</span>
            </button>
            <button type="button" aria-label="Options" title="Options" onClick={game.openOptions}>
              <Icon name="settings" /><span className="action-label">Options</span>
            </button>
            <button type="button" aria-label="Connexion" title="Connexion" aria-haspopup="dialog"
              aria-expanded={snapshot?.loginOpen ?? false} onClick={game.openConnection}>
              <Icon name="account" /><span className="action-label">Connexion</span>
            </button>
          </div>
        )}
        <GameInformation snapshot={snapshot} stateLabel={snapshot?.paused ? "Partie en pause" : statuses[status]}
          saveFeedback={state ? notice : ""} />

      </nav>
      <main className="playfield" aria-label="Village et commandes de la partie">
        {status !== "stopped" && (
          <WorldView snapshot={worldSnapshot} subject={typeof camera === "string" ? camera : null} view={cameraView} hover={hover} onSelect={select} onHover={onHover} />
        )}
        {state && <ReferenceInterface frame={game.frame} panel={panel} species={species} cameraView={cameraView} onInspect={inspect} onInspectResident={inspectResident}
          onSelect={select} onHover={onHover} onExit={closeCamera} onDocument={game.onDocument} onNotice={game.setNotice} />}
        {(!state || status === "missing") && (
          <div className="game-message">
            <strong role="status"><Icon name="info" />{statuses[status]}</strong>
            {status === "stopped" && <p>Relancez AGLLM avec start.cmd pour reprendre votre partie.</p>}
            {status === "waiting" && <p>Fermez l’autre onglet AGLLM pour poursuivre votre partie ici.</p>}
            {status === "checking" && <p>Préparation de la partie…</p>}
            {status === "missing" && <p>Vérifiez l’installation du moteur dans motorAGLLM/source.</p>}
          </div>
        )}
      </main>
      {ready && (
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
