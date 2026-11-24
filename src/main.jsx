import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { GameInformation, VillageIndicators } from "./GameInformation.jsx";
import { Icon } from "./Icon.jsx";
import { NavbarPopover } from "./NavbarPopover.jsx";
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
  const [active, onActive] = useState(null);
  const [worldEnabled, setWorldEnabled] = useState(true);
  const [renderState, setRenderState] = useState("loading");
  const viewDialog = useRef(null);
  const navbar = { active, onActive };
  const worldSnapshot = useMemo(() => snapshot && { ...snapshot, species }, [snapshot, species]);

  function changeSpecies(value) {
    setSpecies(value);
    saveResidentSpecies(value);
  }

  const cameraView = useRef(null);

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

  function changeView() {
    closeCamera();
    setHover(null);
    setRenderState("loading");
    setWorldEnabled(!worldEnabled);
    viewDialog.current.close();
  }

  const rendering = renderState !== "ready" && renderState !== "unavailable";
  const renderDescription = worldEnabled
    ? renderState === "unavailable" ? "Rendu 3D indisponible" : rendering ? "Rendu 3D en cours" : "Rendu 3D prêt"
    : "Interface seule";

  useEffect(() => {
    if (!camera) {
      return;
    }
    function exitCamera(event) {
      if (event.key === "Escape" && !active && !viewDialog.current?.open
        && !document.querySelector(".species-popover:popover-open, .species-details[open]")) {
        closeCamera();
      }
    }
    window.addEventListener("keydown", exitCamera);
    return () => window.removeEventListener("keydown", exitCamera);
  }, [active, camera, closeCamera]);

  return (
    <div className="shell">
      <nav className="topbar" aria-label="Navigation AGLLM">
        <ResidentSpeciesPicker species={species} onChange={changeSpecies} />
        <div className="navbar-actions">
          {ready && <>
            <VillageIndicators metrics={snapshot.indicators} controls={navbar} />
            <div className="info-menu">
              <button className="info-button view-mode-button" type="button" aria-haspopup="dialog"
                aria-label="Changer le mode de vue" aria-description={renderDescription} title={renderDescription}
                data-render={worldEnabled ? renderState : "off"}
                onClick={() => { onActive(null); viewDialog.current.showModal(); }}>
                {worldEnabled ? "3D" : "UI"}
              </button>
            </div>
            <NavbarPopover {...navbar} icon="save" title="Sauvegarde" onAction={game.save} saved={game.saved} />
            <NavbarPopover {...navbar} icon="settings" title="Options" onAction={game.openOptions} />
          </>}
          <GameInformation controls={navbar} snapshot={snapshot}
            stateLabel={snapshot?.paused ? "Partie en pause" : statuses[status]} saveFeedback={state ? notice : ""} />
        </div>
      </nav>
      <main className="playfield" aria-label="Village et commandes de la partie">
        {worldEnabled && status !== "stopped" && (
          <WorldView snapshot={worldSnapshot} subject={typeof camera === "string" ? camera : null} view={cameraView}
            hover={hover} onSelect={select} onHover={onHover} state={renderState} onState={setRenderState} />
        )}
        {state && <ReferenceInterface frame={game.frame} panel={panel} species={species} worldEnabled={worldEnabled} cameraView={cameraView} onInspect={inspect} onInspectResident={inspectResident}
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
      <dialog ref={viewDialog} className="view-mode-dialog" aria-labelledby="view-mode-title">
        <h2 id="view-mode-title">{worldEnabled ? "Passer en mode UI ?" : "Activer le monde 3D ?"}</h2>
        <p>{worldEnabled ? "Les panneaux du jeu occuperont l’espace de la scène 3D." : "La scène 3D du village sera recalculée."}</p>
        <footer>
          <button type="button" autoFocus onClick={() => viewDialog.current.close()}>Annuler</button>
          <button type="button" onClick={changeView}>Confirmer</button>
        </footer>
      </dialog>
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
